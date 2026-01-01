import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { AuthService } from "../services/auth/auth.service";
import { AdminAuthService } from "../services/auth/admin.service";
import {authenticateRequest, AuthPayload } from "../helper/auth.helper"; 
import { MainError } from "../errors/main.error";
import { AuthError } from "../errors/auth.error";
import { getAuthPayload, handleAppApi, handleDeviceApi, handleSessionApi, returnCodeChallange, returnInternalSigniture } from "../helper/auth.helper";
import { NotificationService } from "../services/notification/notification.service";
import { SelfObserver } from "../services/notification/observers/self.observer";

export const getBaseUrl = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthPayload, 
    identity?: {
        user_id?: string;
        device_id?: string;
        app_id?: string;
        session_id?: string;
      };
  }
}

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body;
  let headers;
  const base = getBaseUrl();
  const code_challange = req.auth?.code_challenger;
  let response;
  const notificationService = new NotificationService();
  try {
    notificationService.addObserver(new SelfObserver());
    notificationService.startWatching();

    const service = new AuthService();
    const user = await service.login({
      email: payload.email,
      password_hash: payload.password_hash,
    });
    const devicePayload = {
      user_id: user.id,
      device_id: payload.device_id,
      device_name: payload.device_name,
      device_type: payload.device_type,
    };
    
    headers = await returnInternalSigniture(service, 'POST', '/devices', devicePayload);

    const device = await handleDeviceApi(base, devicePayload, headers);

    headers = await returnInternalSigniture(service, 'GET', `/apps/${payload.app_id}`);
    const app = await handleAppApi(base, payload.app_id, headers);

    const sessionPayload = {
      user_id: user.id,
      app_id: app.id,
      device_id: device.device_id || device.id,
      client_type: payload.device_type || "browser",
      accessTokenTtl: payload.accessTokenTtl,
      refreshTokenttl: payload.refreshTokenttl,
    };

    headers = await returnInternalSigniture(service, 'POST', '/sessions', sessionPayload);
    const session: any = await handleSessionApi(base, sessionPayload, headers);
    response = {
      user_id: user.id,
      device_pm_id: device.id,
      device_id: device.device_id,
      app_id: app.id,
      ...session,
    }
    
    const codeChallange = await returnCodeChallange(service, response, code_challange);
    notificationService.insertNotification({
      userId: user.id,
      type: "info",
      title: "Login Successful",
      message: `You have successfully logged in to app ${app.name} with device ${device.device_name || device.device_id || device.id}`,
      metadata: {
        appId: app.id,
        deviceId: device.device_id || device.id,
      },
      createdAt: new Date(),
    });
    
    res.status(200).json(codeChallange ?? response);
  } catch (err) {
    notificationService.stopWatching();
    notificationService.clearObservers();
    next(err);
  }
};


export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body as any;
  const base = getBaseUrl();
  const code_challange = req.auth?.code_challenger;
  let headers;
  try {
    let createResp;
    try {
      const userPayload = {
        email: payload.email,
        password_hash: payload.password_hash,
        username: payload.username,
        phone: payload.phone,
        avatar_url: payload.avatar_url,
        date_of_birth: payload.date_of_birth,
        is_admin: payload.is_admin,
        is_verified: payload.is_verified,
      };

      headers = await returnInternalSigniture(null, 'POST', '/users', userPayload);
      createResp = await axios.post(`${base}/users`, userPayload, {headers});
    } catch (err: any) {
      const apiError = err?.response?.data;
      if (apiError?.errorType) {
        const mappedError = new MainError(apiError.message, err.response?.status || 400, apiError.details);
        mappedError.name = apiError.errorType;
        return next(mappedError);
      }
      if (err.response?.data) return next(err.response.data);
      return next(err);
    }

    if (!createResp || !createResp.data) return next(new MainError("User creation failed", 500));
    const createdUser = (createResp.data as any)?.user || createResp.data;

    try {
      const loginPayload: any = {
        email: createdUser.email || payload.email,
        password_hash: payload.password_hash,
        app_id: payload.app_id,
        device_id: payload.device_id,
        device_name: payload.device_name,
        device_type: payload.device_type,
      };

      if (payload.accessTokenTtl) loginPayload.accessTokenTtl = payload.accessTokenTtl;
      if (payload.refreshTokenttl) loginPayload.refreshTokenttl = payload.refreshTokenttl;

      headers = await returnInternalSigniture(null, 'POST', '/auth/login', loginPayload);
      const loginResp = await axios.post(`${base}/auth/login`, loginPayload, {headers});

      const codeChallanger = await returnCodeChallange(null, loginResp.data, code_challange);
      return res.status(loginResp.status || 200).json(codeChallanger ?? loginResp.data);
    } catch (err: any) {
      const apiError = err?.response?.data;
      if (apiError?.errorType) {
        const mappedError = new MainError(apiError.message, err.response?.status || 400, apiError.details);
        mappedError.name = apiError.errorType;
        return next(mappedError);
      }
      if (err.response?.data) return next(err.response.data);
      return next(err);
    }
  } catch (error) {
    next(error);
  }
};

export const changePasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body as any;
  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  try {
    const service = new AuthService();
    const updated = await service.changePassword({
      user_id: payload.user_id,
      old_password_hash: payload.old_password_hash,
      new_password_hash: payload.new_password_hash,
    } as any);
    res.status(200).json({ user: updated });
  } catch (err) {
    next(err);
  }
};

export const authenticateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = getAuthPayload(req);
    const code_challanger = req.auth?.code_challenger

    if (!payload.access_token) {
      throw new MainError("Missing authentication parameters", 400);
    } 

    const service = new AuthService();
    const authResult = await authenticateRequest({
      ...payload,
      baseUrl: getBaseUrl(),
      service,
    });

    const codeChallangeKey = await returnCodeChallange(service, authResult, code_challanger);
    res.status(200).json(codeChallangeKey ?? authResult);
  } catch (err) {
    next(err);
  }
};

export const refreshController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body as any;
  try {
    const service = new AuthService();
    const result = await service.refreshAccessToken({
      refresh_token: payload.refresh_token,
      accessTtl: payload.accessTokenTtl ? Number(payload.accessTokenTtl) : undefined,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const verifiyController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body as any;
  try {
    const service = new AuthService();
    const result = await service.verifyCodeChallenge(payload.secret_key, payload.code_verifier);
    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const isAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = req.params as any;
    const service = new AuthService();
    const result = await service.isUserAdmin(params.id);
    res.status(200).json({ is_admin: !!result });
  } catch (err) {
    next(err);
  }
};

export const isSuperAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const callerId = (req as any).auth?.user_id || (req.headers['x-user-id'] as string);
    if (!callerId) throw new AuthError("Authentication was not provided", 401);

    const service = new AdminAuthService();
    const result = await service.isUserSuperAdmin(callerId);
    res.status(200).json({ is_superadmin: !!result });
  } catch (err) {
    next(err);
  }
};

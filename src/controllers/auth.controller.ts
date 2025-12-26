import { Request, Response, NextFunction } from "express";
import axios, { head } from "axios";
import { AuthService } from "../services/auth.service";
import {AuthPayload } from "../helper/auth.helper"; 
import { MainError } from "../errors/main.error";
import { AccessTokenExpiredError, AuthError, NotAdminError } from "../errors/auth.error";
import { getAuthAppPayload, getAuthPayload, handleAppApi, handleDeviceApi, handleSessionApi, returnCodeChallange, returnInternalSigniture } from "../helper/auth.helper";

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
  try {
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
    res.status(200).json(codeChallange ?? response);
  } catch (err) {
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

export const authenticateAppController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    
    const payload = getAuthAppPayload(req);
    if (payload.type === "pkce") {
      req.auth = {
        code_challenger: payload.code_challenger,
      };
      return next();
    }

    const service = new AuthService();
    if (payload.type === "hmac") {
      await service.authenticateAppHmac({
        app_id: payload.app_id,
        signature: payload.signature,
        timestamp: payload.timestamp,
        req,
      });
      return next();
    }
    
    if (payload.type === "internal") {
      await service.validateInternalHmac({ ...payload, req });
      return next();
    }
    

    return next();
  } catch (err) {
    next(err);
  }
};

export async function authenticateRequest(params: {
  access_token?: string;
  refresh_token?: string;
  accessTokenTtl?: number;
  refreshTokenTtl?: number;
  baseUrl: string;
  service: AuthService;
}) {
  if (!params) throw new MainError("Prams is not provided", 401, {params});
  const {
    access_token,
    refresh_token,
    accessTokenTtl,
    refreshTokenTtl,
    service,
  } = params;

  try {
    const identity = await service.authenticate(
      access_token as string,
    );

    return {
      ... identity,
      access_token,
      refresh_token,
      refreshed: false,
    };
  } catch (err) {
    if (!(err instanceof AccessTokenExpiredError)) {
      throw err;
    }

    if (!refresh_token) {
      throw new AuthError("Refresh token required", 401);
    }

    const refreshBody: any = {
      refresh_token,
    };

    if (accessTokenTtl !== undefined) {
      refreshBody.accessTokenTtl = accessTokenTtl;
    }

    const refreshResult = await service.refreshAccessToken({
      refresh_token,
      accessTtl: accessTokenTtl !== undefined ? Number(accessTokenTtl) : undefined,
      refreshTtl: refreshTokenTtl !== undefined ? Number(refreshTokenTtl) : undefined
    });

    return {
      ...refreshResult,
      refreshed: true,
    };
  }
}

export const authenticateEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = getAuthPayload(req);
    const code_challanger = req.auth?.code_challenger

    if (!payload.user_id || !payload.device_id || !payload.app_id || !payload.access_token) {
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

export const isAdminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const callerId = (req as any).auth?.user_id || (req.headers['x-user-id'] as string);
    if (!callerId) return next(new MainError('Missing caller user id', 400));

    const service = new AuthService();
    const isAdmin = await service.isUserAdmin(callerId);
    if (!isAdmin) throw new NotAdminError("User is not admin");

    next();
  } catch (err) {
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

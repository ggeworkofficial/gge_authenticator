import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { AuthService } from "../services/auth.service";
import { MainError } from "../errors/main.error";
import { Logger } from "../utils/logger";
import { AccessTokenExpiredError } from "../errors/auth.error";

const logger = Logger.getLogger();

const getBaseUrl = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

const handleDeviceApi = async (
  base: string,
  user_id: string,
  payload: any
) => {
  const devicePayload = {
    user_id,
    device_id: payload.device_id,
    device_name: payload.device_name,
    device_type: payload.device_type,
  };

  try {
    const resp = await axios.post(`${base}/devices`, devicePayload);
    if (!resp.data || !(resp.data as any).device) throw new MainError("Device creation failed", 500, { payload: devicePayload });
    
    return (resp.data as any).device;
  } catch (err: any) {
    const { response } = err;

    if (response?.data?.errorType === "DeviceCreateError" &&
        response.data.message === "Device already exists") 
    {
      logger.warn(`Device already exists for user_id=${user_id}, device_id=${payload.device_id}. Fetching existing device.`);
      const existingResp = await axios.get(`${base}/devices`, {
        params: { user_id, device_id: payload.device_id },
      });
      
      const existingDevice = (existingResp.data as any).devices?.[0];
      if (!existingDevice) throw new MainError("Existing device not found", 500);

      return existingDevice;
    }

    throw err;
  }
};


const handleAppApi = async (base: string, app_id: string) => {
  try {
    const resp = await axios.get(`${base}/apps/${app_id}`);
    if (!(resp.data as any)?.app) {
      throw new MainError("App not found", 404, { app_id });
    }
    return (resp.data as any).app;
  } catch (err: any) {
    const apiError = err?.response?.data;

    if (apiError?.errorType) {
      const mapped = new MainError(apiError.message, 400, apiError.details);
      mapped.name = apiError.errorType;
      throw mapped;
    }

    throw err;
  }
};


const handleSessionApi = async (
  base: string,
  sessionPayload: any
) => {
  try {
    const resp = await axios.post(`${base}/sessions`, sessionPayload);
    return resp.data;
  } catch (err: any) {
    const apiError = err?.response?.data;

    if (apiError?.errorType) {
      const mapped = new MainError(apiError.message, 400, apiError.details);
      mapped.name = apiError.errorType;
      throw mapped;
    }

    throw err;
  }
};


export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body;
  const base = getBaseUrl();

  try {
    // 1. LOGIN USER
    const service = new AuthService();
    const user = await service.login({
      email: payload.email,
      password_hash: payload.password_hash,
    });

    // 2. DEVICE
    const device = await handleDeviceApi(base, user.id, payload);

    // 3. APP
    const app = await handleAppApi(base, payload.app_id);

    // 4. SESSION
    const sessionPayload = {
      user_id: user.id,
      app_id: app.id,
      device_id: device.device_id || device.id,
      client_type: payload.device_type || "browser",
      accessTokenTtl: payload.accessTokenTtl,
      refreshTokenttl: payload.refreshTokenttl,
    };

    const session: any = await handleSessionApi(base, sessionPayload);

    // 5. RESPONSE
    res.status(200).json({
      user_id: user.id,
      device_pm_id: device.id,
      device_id: device.device_id,
      app_id: app.id,
      ...session,
    });
  } catch (err) {
    next(err);
  }
};


export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body as any;
  const base = getBaseUrl();
  try {
    // 1) create user via internal users API
    let createResp;
    try {
      // forward user-related fields to /users
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
      createResp = await axios.post(`${base}/users`, userPayload);
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

    // 2) call login endpoint with email/password to obtain tokens and session
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

      const loginResp = await axios.post(`${base}/auth/login`, loginPayload);
      // forward the login response as-is
      return res.status(loginResp.status || 200).json(loginResp.data);
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
  console.log("changePasswordController payload:", req.body);
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

export const authenticateController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body as any;
  const base = getBaseUrl();
  try {
    const service = new AuthService();
    // Try to validate access token
    try {
      const decoded = await service.authenticate(payload.access_token);
      // If valid, respond with authenticate schema
      // decode exp to date if available
      const exp = (decoded && (decoded as any).exp) ? new Date((decoded as any).exp * 1000) : undefined;
      return res.status(200).json({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
        user_id: payload.user_id,
        device_id: payload.device_id,
        app_id: payload.app_id,
        access_token_expires_at: exp,
      });
    } catch (err: any) {
      // If access token expired, forward to /auth/refresh
      if (err instanceof AccessTokenExpiredError) {
        try {
          const refreshBody: any = {
            refresh_token: payload.refresh_token,
            user_id: payload.user_id,
            device_id: payload.device_id,
            app_id: payload.app_id,
          };
          if (payload.accessTokenTtl) refreshBody.accessTokenTtl = payload.accessTokenTtl;

          const refreshResp = await axios.post(`${base}/auth/refresh`, refreshBody);

          // include refreshed access token in authenticate response
          const newAccess = (refreshResp.data as any).access_token;
          const accessExpiresAt = (refreshResp.data as any).access_token_expires_at;

          return res.status(200).json({
            access_token: newAccess,
            refresh_token: payload.refresh_token,
            user_id: payload.user_id,
            device_id: payload.device_id,
            app_id: payload.app_id,
            access_token_expires_at: accessExpiresAt,
          });
        } catch (err2: any) {
          const apiError = err2?.response?.data;
          if (apiError?.errorType) {
            const mappedError = new MainError(apiError.message, err2.response?.status || 400, apiError.details);
            mappedError.name = apiError.errorType;
            return next(mappedError);
          }
          if (err2.response?.data) return next(err2.response.data);
          return next(err2);
        }
      }

      return next(err);
    }
  } catch (error) {
    next(error);
  }
};

export const refreshController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body as any;
  try {
    const service = new AuthService();
    const result = await service.refreshAccessToken({
      refresh_token: payload.refresh_token,
      user_id: payload.user_id,
      device_id: payload.device_id,
      app_id: payload.app_id,
      accessTtl: payload.accessTokenTtl ? Number(payload.accessTokenTtl) : undefined,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

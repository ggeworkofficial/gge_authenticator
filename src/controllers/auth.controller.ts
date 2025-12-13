import { Request, Response, NextFunction } from "express";
import axios, { head } from "axios";
import { AuthService } from "../services/auth.service";
import { MainError } from "../errors/main.error";
import { Logger } from "../utils/logger";
import { AccessTokenExpiredError, AuthError } from "../errors/auth.error";

const logger = Logger.getLogger();

const getBaseUrl = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthPayload
  }
}

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


export const returnCodeChallange = async (service: any, response: any, code_challange?: string, ) => {
  if (!service || !(service instanceof AuthService)) {
    service = new AuthService()
  }
  if (code_challange) {
      const secret_key = await service.saveCodeChalleng(code_challange, response);
      return {
        secret_key,
        message: "Waiting for verification"
      };
  }
}

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body;
  const base = getBaseUrl();
  const code_challange = req.auth?.code_challenger;
  let response;
    

  try {
    const service = new AuthService();
    const user = await service.login({
      email: payload.email,
      password_hash: payload.password_hash,
    });

    const device = await handleDeviceApi(base, user.id, payload);
    const app = await handleAppApi(base, payload.app_id);

    const sessionPayload = {
      user_id: user.id,
      app_id: app.id,
      device_id: device.device_id || device.id,
      client_type: payload.device_type || "browser",
      accessTokenTtl: payload.accessTokenTtl,
      refreshTokenttl: payload.refreshTokenttl,
    };

    const session: any = await handleSessionApi(base, sessionPayload);
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
  const headers = {
    "x-code-challenger": code_challange,
  };
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

      const loginResp = await axios.post(`${base}/auth/login`, loginPayload, {headers});

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

export interface AuthPayload {
  user_id?: string;
  device_id?: string;
  app_id?: string;
  app_secret?: string;
  access_token?: string;
  refresh_token?: string;
  accessTokenTtl?: number;
  access_token_expires_at?: Date | undefined;
  code_challenger?: string;
  error?: boolean
}

type AuthAppPayload =
  | { type: "pkce"; code_challenger: string }
  | { type: "hmac"; app_id: string; signature: string; timestamp: number };


const getAuthPayload = (req: Request): AuthPayload => {
  const body = (req.body && Object.keys(req.body).length > 0) 
              ? req.body as AuthPayload 
              : {} as AuthPayload;
  const headers = req.headers;

  return {
    user_id: body.user_id || headers['x-user-id'] as string,
    device_id: body.device_id || headers['x-device-id'] as string,
    app_id: body.app_id || headers['x-app-id'] as string,
    access_token: body.access_token || headers['x-access-token'] as string,
    refresh_token: body.refresh_token || headers['x-refresh-token'] as string,
    accessTokenTtl: body.accessTokenTtl || Number(headers['x-access-token-ttl']),
  };
};

const getAuthAppPayload = (req: Request): AuthAppPayload => {
  const headers = req.headers;

  const appId = headers["x-app-id"] as string | undefined;
  const codeChallenger = headers["x-code-challenger"] as string | undefined;
  const signature = headers["x-signature"] as string | undefined;
  const timestampRaw = headers["x-timestamp"] as string | undefined;

  // app_id is ALWAYS required
  if (!appId) {
    throw new AuthError("Missing x-app-id", 400);
  }

  const usingPKCE = !!codeChallenger;
  const usingHMAC = !!signature || !!timestampRaw;

  // Cannot mix auth methods
  if (usingPKCE && usingHMAC) {
    throw new AuthError("Multiple authentication methods provided", 400);
  }

  // PKCE flow
  if (usingPKCE) {
    return {
      type: "pkce",
      code_challenger: codeChallenger!,
    };
  }

  // HMAC flow
  if (!signature || !timestampRaw) {
    throw new AuthError("Missing HMAC headers", 400);
  }

  const timestamp = Number(timestampRaw);
  if (Number.isNaN(timestamp)) {
    throw new AuthError("Invalid timestamp", 400);
  }

  return {
    type: "hmac",
    app_id: appId,
    signature,
    timestamp,
  };
};


export const authenticateAppController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = getAuthAppPayload(req);

    // PKCE → just attach and move on
    if (payload.type === "pkce") {
      req.auth = {
        code_challenger: payload.code_challenger,
      };
      return next();
    }

    // HMAC
    const service = new AuthService();

    await service.authenticateAppHmac({
      app_id: payload.app_id,
      signature: payload.signature,
      timestamp: payload.timestamp,
      req,
    });

    return next();
  } catch (err) {
    next(err);
  }
};


export const authenticateController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = getAuthPayload(req);
  const base = getBaseUrl();

  if (!payload.user_id || !payload.device_id || !payload.app_id || !payload.access_token) {
    return next(new MainError("Missing required authentication parameters", 400));
  }
  try {
    const service = new AuthService();
    // Try to validate access token
    try {

      const decoded = await service.authenticate(payload.access_token, payload.user_id, payload.app_id!, payload.device_id);
      // If valid, respond with authenticate schema
      // decode exp to date if available
      const exp = (decoded && (decoded as any).exp) ? new Date((decoded as any).exp * 1000) : undefined;
      req.auth = {
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
        user_id: payload.user_id,
        device_id: payload.device_id,
        app_id: payload.app_id,
        access_token_expires_at: exp,
      };
      return next();

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

export const verifiyController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body as any;
  console.log(`payload ${payload}`)
  try {
    const service = new AuthService();
    const result = await service.verifyCodeChallenge(payload.secret_key, payload.code_verifier);
    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { AuthService } from "../services/auth.service";
import { MainError } from "../errors/main.error";
import { Logger } from "../utils/logger";

const logger = Logger.getLogger();

const getBaseUrl = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body as any;
  try {
    const service = new AuthService();
    const user = await service.login({ email: payload.email, password_hash: payload.password_hash });

    // Build device payload (exclude app_id)
    const devicePayload: any = {
      user_id: user.id,
      device_id: payload.device_id,
      device_name: payload.device_name,
      device_type: payload.device_type,
    };

    const base = getBaseUrl();

    // Call devices POST endpoint via HTTP so that route handles creation
    let deviceResp;
    try {
      deviceResp = await axios.post(`${base}/devices`, devicePayload);
      
    } catch (err: any) {
        if (err.response) {
            const { status, data } = err.response;

            if (data?.errorType === "DeviceCreateError" && data?.message === "Device already exists") {
                logger.info("Device already exists, continuing login...");
                const existingResp = await axios.get(
                    `${base}/devices`,
                    { params: { user_id: user.id, device_id: payload.device_id } }
                );

                const existingDevice = (existingResp.data as any).devices?.[0];
                if (!existingDevice) {
                    return next(new MainError("Existing device record not found", 500));
                }

                deviceResp = { data: { device: existingDevice } };
            } else {
                return next(err);
            }
        } else {
            return next(err);
        }
    }

    if (!deviceResp) throw new MainError("Device response missing", 500, { payload: devicePayload });
    const device = (deviceResp.data as any).device;
    if (!device) return next(new MainError("Device creation failed", 500, {payload: devicePayload}));

    // Call apps GET to verify app exists
    let appResp;
    try {
      const appId = payload.app_id;
      appResp = await axios.get(`${base}/apps/${appId}`);
    } catch (err: any) {
        const apiError = err?.response?.data;

        if (apiError?.errorType) {
            // Re-create your real server-side error object
            const mappedError = new MainError(
            apiError.message,
            400,
            apiError.details
            );
            mappedError.name = apiError.errorType;
            return next(mappedError);
        } 
        if (err.response?.data) {
            console.error("Device creation error:", err.response.data);
            return next(err.response.data); // <-- forward the real backend error
        }
      return next(err);
    }

    const app = (appResp.data as any).app;
    if (!app) return next(new MainError("App not found", 404, { app_id: payload.app_id }));

    // Create session via internal API POST /sessions
    try {
      const sessionPayload: any = {
        user_id: user.id,
        app_id: app.id,
        device_id: device.device_id || device.id,
        client_type: payload.device_type || "browser",
      };

      if (payload.accessTokenTtl) sessionPayload.accessTokenTtl = payload.accessTokenTtl;
      if (payload.refreshTokenttl) sessionPayload.refreshTokenttl = payload.refreshTokenttl;

      let sessionResp;
      try {
        sessionResp = await axios.post(`${base}/sessions`, sessionPayload);
      } catch (err: any) {
        const apiError = err?.response?.data;

        if (apiError?.errorType) {
          const mappedError = new MainError(apiError.message, err.response?.status || 400, apiError.details);
          mappedError.name = apiError.errorType;
          return next(mappedError);
        }

        if (err.response?.data) {
          return next(err.response.data);
        }

        return next(err);
      }

      if (!sessionResp || !sessionResp.data) return next(new MainError("Session creation failed", 500));

      const sess = sessionResp.data as any;

      res.status(200).json({
        user_id: user.id,
        device_pm_id: device.id,
        device_id: device.device_id,
        app_id: app.id,
        // include the entire sessions response payload
        ...sess,
      });
    } catch (err) {
      return next(err);
    }
  } catch (error) {
    next(error);
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

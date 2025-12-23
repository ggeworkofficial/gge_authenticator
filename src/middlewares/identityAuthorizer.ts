import { Request, Response, NextFunction } from "express";
import { AuthError } from "../errors/auth.error";
import { AuthService } from "../services/auth.service";

interface Options {
  allowAdmin?: boolean;
  checkUser?: boolean;
  checkDevice?: boolean;
  checkApp?: boolean;
  userIdKey?: string;  
  deviceIdKey?: string; 
  appIdKey?: string;  
}

const extractId = (
  req: Request,
  keys: string[]
): string | undefined => {
  for (const key of keys) {
    const value =
      (req.params?.[key] as string) ??
      (req.body?.[key] as string) ??
      (req.query?.[key] as string);

    if (value) return value;
  }
  return undefined;
};


export const authorizeIdentity =
  (options: Options = {}) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new AuthError("Authentication required", 401);
      }

      const {
        user_id: authUserId,
        device_id: authDeviceId,
        app_id: authAppId,
      } = req.auth;

      if (!authUserId || !authDeviceId || !authAppId) throw new AuthError("Some identity params are missing ")

      const requestedUserId = extractId(req, ["user_id", "id"]);
      const requestedDeviceId = extractId(req, ["device_id", "id"]);
      const requestedAppId = extractId(req, ["app_id", "id"]);

      if (options.checkUser && !requestedUserId) {
        throw new AuthError("Missing user id in request", 400);
      }

      if (options.checkDevice && !requestedDeviceId) {
        throw new AuthError("Missing device id in request", 400);
      }

      if (options.checkApp && !requestedAppId) {
        throw new AuthError("Missing app id in request", 400);
      }



      // 🔐 Admin override
      if (options.allowAdmin) {
        const authService = new AuthService();
        const isAdmin = await authService.isUserAdmin(authUserId);

        if (isAdmin) {
          return next();
        }
      }

      // 🔒 User ownership
      if (
        options.checkUser &&
        requestedUserId &&
        requestedUserId !== authUserId
      ) {
        throw new AuthError("Forbidden: user mismatch", 403);
      }

      // 🔒 Device ownership
      if (
        options.checkDevice &&
        requestedDeviceId &&
        requestedDeviceId !== authDeviceId
      ) {
        throw new AuthError("Forbidden: device mismatch", 403);
      }

      // 🔒 App ownership
      if (
        options.checkApp &&
        requestedAppId &&
        requestedAppId !== authAppId
      ) {
        throw new AuthError("Forbidden: app mismatch", 403);
      }

      next();
    } catch (err) {
      next(err);
    }
  };

import { Request, Response, NextFunction } from "express";
import { SessionService } from "../services/session.service";

export const createSessionController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id, app_id, device_id, client_type, access_ttl, refresh_ttl } = req.body as any;
  try {
    const svc = new SessionService();
    const result = await svc.createSession({
      userId: user_id,
      appId: app_id,
      deviceId: device_id,
      clientType: client_type,
      accessTtl: access_ttl ? Number(access_ttl) : undefined,
      refreshTtl: refresh_ttl ? Number(refresh_ttl) : undefined,
    });

    res.status(201).json({
      session: result.session,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  createSessionController,
};

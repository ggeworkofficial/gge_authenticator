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

export const listSessionsController = async (req: Request, res: Response, next: NextFunction) => {
  const filter = req.query as any;
  try {
    const svc = new SessionService();
    const rows = await svc.listSessions(filter);
    res.status(200).json({ sessions: rows });
  } catch (err) {
    next(err);
  }
};

export const getSessionController = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  try {
    const svc = new SessionService();
    const row = await svc.getSessionById(id);
    res.status(200).json({ session: row });
  } catch (err) {
    next(err);
  }
};

export const updateSessionController = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const body = req.body as any;
  try {
    const svc = new SessionService();
    const updated = await svc.updateSession(id, body);
    res.status(200).json({ session: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteSessionsController = async (req: Request, res: Response, next: NextFunction) => {
  const filter = req.query as any;
  try {
    const svc = new SessionService();
    const deleted = await svc.deleteSessionsByFilter(filter);
    res.status(200).json({ deleted });
  } catch (err) {
    next(err);
  }
};

export const deleteSessionByIdController = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  try {
    const svc = new SessionService();
    const deleted = await svc.deleteSessionById(id);
    res.status(200).json({ deleted });
  } catch (err) {
    next(err);
  }
};

export default {
  createSessionController,
  listSessionsController,
  getSessionController,
  updateSessionController,
  deleteSessionsController,
  deleteSessionByIdController,
};

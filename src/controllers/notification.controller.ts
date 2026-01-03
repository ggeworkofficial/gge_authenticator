import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification/notification.service";
import { AuthError } from "../errors/auth.error";
import { NotificationDocument } from "../models/mongodb/NotificationDocument";
import { SelfObserver } from "../services/notification/observers/self.observer";

export const createNotificationController = async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body as any;
  const svc = new NotificationService();
  try {
    const payload: Partial<NotificationDocument> = {
      userId: body.user_id,
      type: body.type,
      title: body.title,
      message: body.message,
      metadata: body.metadata,
      createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    };

    const inserted = await svc.insertNotification(payload);
    res.status(201).json({ notification: inserted });
  } catch (err) {
    next(err);
  }
};

export const listNotificationsController = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  try {
    const svc = new NotificationService();
    const q = req.query as any;
    const limit = q.limit ? Number(q.limit) : undefined;
    const result = await svc.listNotifications(req.auth.user_id as string, limit, q.lastId, q.appId, q.deviceId);
    res.status(200).json({ notifications: result.items, nextCursor: result.nextCursor });
  } catch (err) {
    next(err);
  }
};

export const getNotificationController = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  const id = req.params.id as string;
  try {
    const svc = new NotificationService();
    const row = await svc.updateNotification(id, {} as any); // use updateNotification to fetch latest
    res.status(200).json({ notification: row });
  } catch (err) {
    next(err);
  }
};

export const readNotificationController = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  const id = req.params.id as string;
  const body = req.body as any;
  try {
    const svc = new NotificationService();
    const updated = await svc.updateRead(id, Boolean(body.read));
    res.status(200).json({ updated });
  } catch (err) {
    next(err);
  }
};

export const updateNotificationController = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  const id = req.params.id as string;
  const body = req.body as any;
  try {
    const svc = new NotificationService();
    const updated = await svc.updateNotification(id, body);
    res.status(200).json({ notification: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteNotificationController = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  const id = req.params.id as string;
  try {
    const svc = new NotificationService();
    const deleted = await svc.deleteNotification(id);
    res.status(200).json({ deleted });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCountController = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  try {
    const svc = new NotificationService();
    const q = req.query as any;
    const count = await svc.getUnreadCount(req.auth.user_id as string, q.appId, q.deviceId);
    res.status(200).json({ unreadCount: count });
  } catch (err) {
    next(err);
  }
};

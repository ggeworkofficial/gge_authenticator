import { Response, Request, NextFunction } from "express";
import { MainError } from "../errors/main.error";
import { AuthService } from "../services/auth/auth.service";
import { AdminAuthService } from "../services/auth/admin.service";
import { NotAdminError, NotSuperAdminError } from "../errors/auth.error";

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

export const isSuperAdminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const callerId = (req as any).auth?.user_id || (req.headers['x-user-id'] as string);
    if (!callerId) return next(new MainError('Missing caller user id', 400));

    const service = new AdminAuthService();
    const isSuper = await service.isUserSuperAdmin(callerId);
    if (!isSuper) throw new NotSuperAdminError("User is not super admin");

    next();
  } catch (err) {
    next(err);
  }
};
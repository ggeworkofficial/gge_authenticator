import { Request, Response, NextFunction } from "express";
import { authenticateRequest, getAuthPayload } from "../helper/auth.helper";
import { AuthService } from "../services/auth/auth.service";
import { getBaseUrl } from "../controllers/auth.controller";

export const authenticateMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try { 
    const payload = getAuthPayload(req);
    const service = new AuthService();

    const authResult = await authenticateRequest({
      ...payload,
      baseUrl: getBaseUrl(),
      service,
    });

    req.auth = authResult;
    next();
  } catch (err) {
    next(err);
  }
};
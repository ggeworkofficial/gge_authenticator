import { Response, Request, NextFunction} from "express";
import { getAuthAppPayload } from "../helper/auth.helper";
import { AuthService } from "../services/auth/auth.service";

export const authenticateAppMiddleware = async (
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
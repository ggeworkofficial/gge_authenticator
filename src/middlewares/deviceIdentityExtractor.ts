import { Request, Response, NextFunction } from "express";
import { AuthError } from "../errors/auth.error";

export const extractDeviceIdentity = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  if (!id) {
    throw new AuthError("Device identifier is required", 400);
  }

  /**
   * Expected format:
   * <user_uuid>-<device_uuid>
   * UUID length = 36
   */
  const separatorIndex = id.indexOf("-", 36);

  if (separatorIndex === -1) {
    throw new AuthError("Invalid device identifier format", 400);
  }

  const user_id = id.substring(0, separatorIndex);
  const device_id = id.substring(separatorIndex + 1);

  if (!user_id || !device_id) {
    throw new AuthError("Invalid device identifier components", 400);
  }

  // Attach canonical identity
  req.identity = {
    ...(req.identity ?? {}),
    user_id,
    device_id,
  };

  next();
};

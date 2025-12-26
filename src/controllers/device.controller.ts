import { NextFunction, Request, Response } from "express";
import { DeviceService } from "../services/device.service";
import { AuthError } from "../errors/auth.error";
import { returnCodeChallange } from "../helper/auth.helper";


export const deviceCreateController = async (req: Request, res: Response, next: NextFunction) => {
  const data = req.body;
  const code_challange = req.auth?.code_challenger;
  try { 
    const service = new DeviceService();
    const device = await service.createDevice(data);
    const codeChallangeSecret = await returnCodeChallange(null, device, code_challange);
    res.status(201).json({device: codeChallangeSecret ?? device});
  } catch (error) {
    next(error);
  }
};

export const deviceListController = async (req: Request, res: Response, next: NextFunction) => {
  const filter = req.query as any;
  const code_challange = req.auth?.code_challenger;
  try {
    
    const service = new DeviceService();
    const devices = await service.getDevices({ device_id: filter.device_id, user_id: filter.user_id });
    const codeChallanger = await returnCodeChallange(null, devices, code_challange);
    res.status(200).json({devices: codeChallanger ?? devices});
  } catch (error) {
    next(error);
  }
};

export const deviceGetController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  try {
    if (!req.identity?.user_id || !req.identity?.device_id) {
      throw new AuthError("Device identity not resolved", 500);
    }
    
    const service = new DeviceService();
    const device = await service.getDeviceByUserAndDeviceId(req.identity?.user_id, req.identity?.device_id);
    res.status(200).json({ device });
  } catch (error) {
    next(error);
  }
};

export const deviceUpdateController = async (req: Request, res: Response, next: NextFunction) => {
  const data = req.body;
  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  try {
    if (!req.identity?.user_id || !req.identity?.device_id) {
      throw new AuthError("Device identity not resolved", 500);
    }

    const service = new DeviceService();
    const updated = await service.updateDevice(req.identity.user_id, req.identity.device_id, data);
    res.status(200).json({ updated });
  } catch (error) {
    next(error);
  }
};

export const deviceDeleteController = async (req: Request, res: Response, next: NextFunction) => {
  const filter = req.query as any;
  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  try {
    const service = new DeviceService();
    const deletedCount = await service.deleteByFilter({ device_id: filter.device_id, user_id: filter.user_id });
    res.status(200).json({ deletedCount });
  } catch (error) {
    next(error);
  }
};

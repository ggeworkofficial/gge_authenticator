import { NextFunction, Request, Response } from "express";
import { DeviceService } from "../services/device.service";

export const deviceCreateController = async (req: Request, res: Response, next: NextFunction) => {
  const data = req.body;
  try {
    const service = new DeviceService();
    const device = await service.createDevice(data);
    res.status(201).json({ device });
  } catch (error) {
    next(error);
  }
};

export const deviceListController = async (req: Request, res: Response, next: NextFunction) => {
  const filter = req.query as any;
  try {
    const service = new DeviceService();
    const devices = await service.getDevices({ device_id: filter.device_id, user_id: filter.user_id });
    res.status(200).json({ devices });
  } catch (error) {
    next(error);
  }
};

export const deviceGetController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const service = new DeviceService();
    const device = await service.getDeviceById(id);
    res.status(200).json({ device });
  } catch (error) {
    next(error);
  }
};

export const deviceUpdateController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const service = new DeviceService();
    const updated = await service.updateDevice(id, data);
    res.status(200).json({ updated });
  } catch (error) {
    next(error);
  }
};

export const deviceDeleteController = async (req: Request, res: Response, next: NextFunction) => {
  const filter = req.query as any;
  try {
    const service = new DeviceService();
    const deletedCount = await service.deleteByFilter({ device_id: filter.device_id, user_id: filter.user_id });
    res.status(200).json({ deletedCount });
  } catch (error) {
    next(error);
  }
};

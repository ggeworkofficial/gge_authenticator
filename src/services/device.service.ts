import { Postgres } from "../connections/postgres";
import {
  DeviceCreateError,
  DeviceFindError,
  DeviceListError,
  DeviceUpdateError,
  DeviceDeleteError,
} from "../errors/device.error";
import { UserDevice } from "../models/postgres/UserDevice";
import { DeviceRepository } from "../repositories/device.repository";
import { UserRepository } from "../repositories/user.repository";

type DeviceFilter = { device_id?: string; user_id?: string };

export class DeviceService {
  private deviceRepo = new DeviceRepository();
  private userRepo = new UserRepository();
  private db = Postgres.getInstance();

  async createDevice(data: Partial<UserDevice>): Promise<UserDevice> {
    const transaction = await this.db.getTransaction();
    
    try {
      const user = await this.userRepo.findById(data.user_id as any, transaction);
      if (!user) throw new DeviceCreateError("User not found for device", { user_id: data.user_id });
      
      const existing = await this.deviceRepo.findAll({ device_id: data.device_id as any, user_id: data.user_id as any }, transaction);
      if (existing && existing.length > 0) throw new DeviceCreateError("Device already exists", { device_id: data.device_id });
      
      const device = await this.deviceRepo.create(data, transaction);
      await transaction.commit();
      return device;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof DeviceCreateError) throw error;
      throw new DeviceCreateError("Failed to create device", { data, cause: error });
    }
  }

  async getDeviceByUserAndDeviceId(userId: string, deviceId: string): Promise<UserDevice> {
    const transaction = await this.db.getTransaction();
    try {
      const device = await this.deviceRepo.findByUserAndDeviceId(userId, deviceId, transaction);
      if (!device) throw new DeviceFindError("Device not found", { user_id: userId, device_id: deviceId });

      await transaction.commit();
      return device;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof DeviceFindError) throw error;
      throw new DeviceFindError("Failed to fetch device", { user_id: userId, device_id: deviceId, cause: error });
    }
  }

  // Backwards-compatible: keep single-id lookup by primary key
  async getDeviceById(id: string): Promise<UserDevice> {
    const transaction = await this.db.getTransaction();
    try {
      const device = await this.deviceRepo.findById(id, transaction);
      if (!device) throw new DeviceFindError("Device not found", { id });

      await transaction.commit();
      return device;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof DeviceFindError) throw error;
      throw new DeviceFindError("Failed to fetch device", { id, cause: error });
    }
  }

  async getDevices(filter?: DeviceFilter): Promise<UserDevice[]> {
    const transaction = await this.db.getTransaction();
    try {
      const devices = await this.deviceRepo.findAll(filter, transaction);
      await transaction.commit();
      return devices;
    } catch (error) {
      await transaction.rollback();
      throw new DeviceListError("Failed to list devices", { filter, cause: error });
    }
  }

  async updateDevice(userId: string, deviceId: string, data: Partial<UserDevice>): Promise<UserDevice> {
    const transaction = await this.db.getTransaction();
    try {
      const updated = await this.deviceRepo.updateByUserAndDeviceId(userId, deviceId, data, transaction);
      if (!updated) throw new DeviceUpdateError("Device not found", { user_id: userId, device_id: deviceId });

      await transaction.commit();
      return updated;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof DeviceUpdateError) throw error;
      throw new DeviceUpdateError("Failed to update device", { user_id: userId, device_id: deviceId, data, cause: error });
    }
  }

  async deleteByFilter(filter: DeviceFilter): Promise<number> {
    const transaction = await this.db.getTransaction();
    try {
      const deletedCount = await this.deviceRepo.deleteByFilter(filter, transaction);
      if (deletedCount === 0) throw new DeviceDeleteError("No devices matched filter", { filter });
      
      await transaction.commit();
      return deletedCount;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof DeviceDeleteError) throw error;
      throw new DeviceDeleteError("Failed to delete devices", { filter, cause: error });
    }
  }
}

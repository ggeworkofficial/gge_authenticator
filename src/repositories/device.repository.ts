import { UserDevice } from "../models/postgres/UserDevice";
import { Transaction, WhereOptions } from "sequelize";

type DeviceFilter = { device_id?: string; user_id?: string };

export class DeviceRepository {

  private mapFilter(filter?: DeviceFilter): WhereOptions {
    const where: any = {};
    if (!filter) return where;
    if (filter.device_id) where.device_id = filter.device_id;
    if (filter.user_id) where.user_id = filter.user_id;
    if (filter.device_id && filter.user_id) {
      where.device_id = filter.device_id;
      where.user_id = filter.user_id;
    }
    return where;
  }

  public async create(data: Partial<UserDevice>, transaction?: Transaction): Promise<UserDevice> {
    return UserDevice.create(data as any, { transaction });
  }

  public async findById(id: string, transaction?: Transaction): Promise<UserDevice | null> {
    return UserDevice.findByPk(id, { transaction });
  }

  public async findByUserAndDeviceId(userId: string, deviceId: string, transaction?: Transaction): Promise<UserDevice | null> {
    return UserDevice.findOne({ where: { user_id: userId, device_id: deviceId }, transaction });
  }

  public async findAll(filter?: DeviceFilter, transaction?: Transaction): Promise<UserDevice[]> {
    const where = this.mapFilter(filter);
    return UserDevice.findAll({ where, transaction });
  }

  public async update(id: string, data: Partial<UserDevice>, transaction?: Transaction): Promise<UserDevice | null> {
    const device = await this.findById(id, transaction);
    if (!device) return null;
    await device.update(data as any, { transaction });
    return device;
  }

  public async updateByUserAndDeviceId(userId: string, deviceId: string, data: Partial<UserDevice>, transaction?: Transaction): Promise<UserDevice | null> {
    const device = await UserDevice.findOne({ where: { user_id: userId, device_id: deviceId }, transaction });
    if (!device) return null;
    await device.update(data as any, { transaction });
    return device;
  }

  public async deleteById(id: string, transaction?: Transaction): Promise<boolean> {
    const deleted = await UserDevice.destroy({ where: { id }, transaction });
    return deleted > 0;
  }

  public async deleteByFilter(filter: DeviceFilter, transaction?: Transaction): Promise<number> {
    const where = this.mapFilter(filter);
    const deletedCount = await UserDevice.destroy({ where, transaction });
    return deletedCount;
  }
}

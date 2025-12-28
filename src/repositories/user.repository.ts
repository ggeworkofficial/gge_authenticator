import { User } from "../models/postgres/User";
import { Transaction } from "sequelize";

export class UserRepository {
  public async create(userData: Partial<User>, transaction?: Transaction): Promise<User> {
    return User.create(userData as any, { transaction });
  }

  public async findById(id: string, transaction?: Transaction): Promise<User | null> {
    return User.findByPk(id, { transaction });
  }

  public async findAll(filter?: Partial<User>, transaction?: Transaction): Promise<User[]> {
    return User.findAll({ where: filter || {}, transaction });
  }

  public async update(id: string, data: Partial<User>, transaction?: Transaction): Promise<User | null> {
    const user = await this.findById(id, transaction);
    if (!user) return null;
    await user.update(data as any, { transaction });
    return user;
  }

  public async delete(id: string, transaction?: Transaction): Promise<boolean> {
    const deletedCount = await User.destroy({ where: { id }, transaction });
    return deletedCount > 0;
  }

  public async findByEmail(email: string, transaction?: Transaction): Promise<User | null> {
    return User.findOne({ where: { email }, transaction });
  }

  public async setAdminStatus(id: string, isAdmin: boolean, transaction?: Transaction): Promise<User | null> {
    const user = await this.findById(id, transaction);
    if (!user) return null;
    await user.update({ is_admin: isAdmin } as any, { transaction });
    return user;
  }
}

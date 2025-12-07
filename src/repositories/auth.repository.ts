import { UserRepository } from "./user.repository";
import { User } from "../models/postgres/User";
import { Transaction } from "sequelize";

export class AuthRepository {
  private userRepo = new UserRepository();

  public async findUserByEmail(email: string, transaction?: Transaction): Promise<User | null> {
    return this.userRepo.findByEmail(email, transaction);
  }

  public async findUserById(id: string, transaction?: Transaction): Promise<User | null> {
    return this.userRepo.findById(id, transaction);
  }

  public async changePassword(userId: string, newPasswordHash: string, transaction?: Transaction): Promise<User | null> {
    return this.userRepo.update(userId, { password_hash: newPasswordHash } as any, transaction);
  }
  public async checkPassword(userId: string, passwordHash: string, transaction?: Transaction): Promise<boolean> {
    const user = await this.findUserById(userId, transaction);
    if (!user || !user.password_hash) return false;
    return user.password_hash === passwordHash;
  }
}

import { UserRepository } from "./user.repository";
import { User } from "../models/postgres/User";
import { Transaction } from "sequelize";
import { Token } from "../models/mongodb/TokenDocument";

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

  public async findSessionByRefreshToken(refreshToken: string) {
    return Token.findOne({ refreshToken } as any) as any;
  }

  public async findSessionByUserDevice(userId: string, deviceId: string, appId: string) {
    return Token.findOne({ userId, deviceId, appId } as any) as any;
  }

  public async updateAccessTokenForSession(userId: string, deviceId: string, appId: string, accessToken: string, accessExpiresAt: Date) {
    const filter: any = { userId, deviceId, appId };
    const update = { $set: { accessToken, accessTokenExpiresAt: accessExpiresAt } } as any;
    const res = await Token.updateOne(filter, update as any);
    return res;
  }
}

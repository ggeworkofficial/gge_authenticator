import { UserRepository } from "./user.repository";
import { User } from "../models/postgres/User";
import { Transaction } from "sequelize";

export class AuthRepository {
  private userRepo = new UserRepository();

  public async findUserByEmail(email: string, transaction?: Transaction): Promise<User | null> {
    return this.userRepo.findByEmail(email, transaction);
  }
}

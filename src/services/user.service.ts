import bcrypt from "bcrypt";
import { Postgres } from "../connections/postgres";
import {
  UserCreateError,
  UserFindError,
  UserListError,
  UserUpdateError,
  UserDeleteError,
} from "../errors/user.error";
import { User } from "../models/postgres/User";
import { UserRepository } from "../repositories/user.repository";
import { UserPromotionError } from "../errors/user.error";
import { PublicUserDTO, UserMapper, UserSelfDTO } from "../DTO/user.dto";

export class UserService {
  private repo = new UserRepository();
  private db = Postgres.getInstance();

  async createUser(userData: Partial<User>): Promise<UserSelfDTO> {
    const transaction = await this.db.getTransaction();
    try {
      const existing = await this.repo.findByEmail(userData.email as string, transaction);
      if (existing) throw new UserCreateError("User already exists", { email: userData.email });
      
      const hashedPassword = await bcrypt.hash(userData.password_hash!, 10);
      userData.password_hash = hashedPassword;
      
      const user = await this.repo.create(userData, transaction);
      await transaction.commit();
      return UserMapper.toSelf(user);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof UserCreateError) throw error;
      throw new UserCreateError("Failed to create user", { userData, cause: error });
    }
  }

  async getUserById(id: string): Promise<UserSelfDTO> {;
    const transaction = await this.db.getTransaction();
    try {
      const user = await this.repo.findById(id, transaction);
      if (!user) throw new UserFindError("User not found", { id });
      
      await transaction.commit();
      return UserMapper.toSelf(user);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof UserFindError) throw error;
      throw new UserFindError("Failed to fetch user", { id, cause: error });
    }
  }

  async getUsers(filter?: Partial<User>): Promise<PublicUserDTO[]> {
    const transaction = await this.db.getTransaction();
    try {
      const users = await this.repo.findAll(filter, transaction);
      await transaction.commit();
      return UserMapper.toPublicList(users);
    } catch (error) {
      await transaction.rollback();
      throw new UserListError("Failed to list users", { filter, cause: error });
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<UserSelfDTO> {
    const transaction = await this.db.getTransaction();
    try {
      const updated = await this.repo.update(id, data, transaction);
      if (!updated) throw new UserUpdateError("User not found", { id });
      
      await transaction.commit();
      return UserMapper.toSelf(updated);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof UserUpdateError) throw error;
      throw new UserUpdateError("Failed to update user", { id, data, cause: error });
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const transaction = await this.db.getTransaction();
    try {
      const deleted = await this.repo.delete(id, transaction);
      if (!deleted) throw new UserDeleteError("User not found", { id });
      
      await transaction.commit();
      return deleted;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof UserDeleteError) throw error;
      throw new UserDeleteError("Failed to delete user", { id, cause: error });
    }
  }

  async updateUserAdmin(targetUserId: string, makeAdmin: boolean = true) {
    const transaction = await this.db.getTransaction();
    try {
      const user = await this.repo.findById(targetUserId, transaction);
      if (!user) throw new UserPromotionError("User not found", { id: targetUserId });

      const updated = await this.repo.setAdminStatus(targetUserId, !!makeAdmin, transaction);
      if (!updated) throw new UserPromotionError("Failed to update admin status", { id: targetUserId });

      await transaction.commit();
      return UserMapper.toSelf(updated);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof UserPromotionError) throw error;
      throw new UserPromotionError("Failed to promote user", { id: targetUserId, cause: error });
    }
  }
}

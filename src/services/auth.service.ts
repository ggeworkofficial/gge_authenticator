import bcrypt from "bcrypt";
import { AuthRepository } from "../repositories/auth.repository";
import { Postgres } from "../connections/postgres";
import { User } from "../models/postgres/User";
import { UserNotFoundError, IncorrectPasswordError } from "../errors/auth.error";

type LoginPayload = {
  email: string;
  password_hash: string;
};

export class AuthService {
  private repo = new AuthRepository();

  /** Authenticate user and return the user instance */
  async login(payload: LoginPayload): Promise<User> {
    const db = Postgres.getInstance();
    const tx = await db.getTransaction();
    try {
      const user = await this.repo.findUserByEmail(payload.email, tx);
      if (!user) throw new UserNotFoundError("user not found", { email: payload.email });
      if (!user.password_hash) throw new IncorrectPasswordError("Password not found", { email: payload.email });
      

      const passwordMatch = await bcrypt.compare(payload.password_hash, user.password_hash);

      if (!passwordMatch) {
          throw new IncorrectPasswordError("Password incorrect", { email: payload.email });
      }

      await tx.commit();
      return user;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
}

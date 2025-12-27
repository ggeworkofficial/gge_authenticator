import bcrypt from "bcrypt";
import { Postgres } from "../../connections/postgres";
import { AuthRepository } from "../../repositories/auth.repository";
import { UserNotFoundError, IncorrectPasswordError, PasswordChangeError, PasswordMatchError } from "../../errors/auth.error";
import { User } from "../../models/postgres/User";
import { UserMapper, UserSelfDTO } from "../../DTO/user.dto";

type LoginPayload = { email: string; password_hash: string };

export class PasswordAuthService {
  private authRepo = new AuthRepository();
  private db = Postgres.getInstance();

  async login(payload: LoginPayload): Promise<User> {
    const transaction = await this.db.getTransaction();
    try {
      const user = await this.authRepo.findUserByEmail(payload.email, transaction);
      if (!user) throw new UserNotFoundError("user not found", { email: payload.email });

      if (!user.password_hash) throw new IncorrectPasswordError("Password not found", { email: payload.email });
      const passwordMatch = await bcrypt.compare(payload.password_hash, user.password_hash);
      if (!passwordMatch) throw new IncorrectPasswordError("Password incorrect", { email: payload.email });

      await transaction.commit();
      return user;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof UserNotFoundError) throw error;
      if (error instanceof IncorrectPasswordError) throw error;
      throw new UserNotFoundError("Login failed", { email: payload.email, cause: error });
    }
  }

  async changePassword(params: { user_id: string; old_password_hash: string; new_password_hash: string }): Promise<UserSelfDTO> {
    const db = Postgres.getInstance();
    const tx = await db.getTransaction();
    try {
      if (params.old_password_hash === params.new_password_hash) throw new PasswordMatchError("New password must be different from old password", { user_id: params.user_id });

      const { user_id, old_password_hash, new_password_hash } = params;
      const user = await this.authRepo.findUserById(user_id, tx);

      if (!user) throw new UserNotFoundError("user not found", { user_id });
      if (!user.password_hash) throw new IncorrectPasswordError("Password not found", { user_id });

      const match = await bcrypt.compare(old_password_hash, user.password_hash);
      if (!match) throw new IncorrectPasswordError("Incorrect old password", { user_id });

      const hashedNew = await bcrypt.hash(new_password_hash, 10);
      const updated = await this.authRepo.changePassword(user_id, hashedNew, tx);
      if (!updated) throw new PasswordChangeError("Failed to update password", { user_id });

      await tx.commit();
      return UserMapper.toSelf(updated);
    } catch (err) {
      await tx.rollback();
      if (err instanceof PasswordMatchError) throw err;
      if (err instanceof UserNotFoundError) throw err;
      if (err instanceof IncorrectPasswordError) throw err;
      throw new PasswordChangeError("Could not change password", { error: err });
    }
  }
}

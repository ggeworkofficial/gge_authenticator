import bcrypt from "bcrypt";
import { AuthRepository } from "../repositories/auth.repository";
import { Postgres } from "../connections/postgres";
import { User } from "../models/postgres/User";
import jwt from "jsonwebtoken";
import {
  UserNotFoundError,
  IncorrectPasswordError,
  PasswordChangeError,
  PasswordMatchError,
  AccessTokenExpiredError,
  RefreshTokenExpiredError,
  RefreshTokenNotFoundError,
  AccessTokenError,
} from "../errors/auth.error";
import dotenv from "dotenv";

dotenv.config();

type LoginPayload = {
  email: string;
  password_hash: string;
};

export class AuthService {
    private repo = new AuthRepository();

    private ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
    private REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
    private ACCESS_TTL = Number(process.env.ACCESS_TOKEN_TTL) || 900;
    private db = Postgres.getInstance();

    async login(payload: LoginPayload): Promise<User> {
        const transaction = await this.db.getTransaction();
        try {
            const user = await this.repo.findUserByEmail(payload.email, transaction);
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

    public async authenticate(accessToken: string) {
        try {
            const decoded = jwt.verify(accessToken, this.ACCESS_SECRET) as any;
            return decoded;
        } catch (err: any) {
            if (err && err.name === "TokenExpiredError") throw new AccessTokenExpiredError("Access token expired", { cause: err });
            if (err && err.name === "JsonWebTokenError") throw new AccessTokenError("Access token invalid", { cause: err });
            throw err;
        }
    }

    public async refreshAccessToken(params: { refresh_token: string; user_id: string; device_id: string; app_id: string; accessTtl?: number }) {
        const { refresh_token, user_id, device_id, app_id, accessTtl } = params;
        try {  
            const session = await this.repo.findSessionByRefreshToken(refresh_token);
            if (!session) throw new RefreshTokenNotFoundError("Refresh token session not found", { user_id, device_id, app_id });
            
            jwt.verify(refresh_token, this.REFRESH_SECRET);
        } catch (err: any) {
            if (err && err.name === "TokenExpiredError") throw new RefreshTokenExpiredError("Refresh token expired", { user_id, device_id, app_id });
            throw err;
        }

        const now = Math.floor(Date.now() / 1000);
        const ttl = typeof accessTtl === "number" && !isNaN(accessTtl) ? accessTtl : this.ACCESS_TTL;
        const accessExp = now + ttl;
        const accessToken = jwt.sign({ sub: user_id, app: app_id, device: device_id, type: "access" }, this.ACCESS_SECRET, { expiresIn: ttl });
        const accessTokenExpiresAt = new Date(accessExp * 1000);

        await this.repo.updateAccessTokenForSession(user_id, device_id, app_id, accessToken, accessTokenExpiresAt);

        return { 
            access_token: accessToken, 
            access_token_expires_at: accessTokenExpiresAt 
        };
    }

    async changePassword(params: { user_id: string; old_password_hash: string; new_password_hash: string }): Promise<User> {
        const db = Postgres.getInstance();
        const tx = await db.getTransaction();
        try {
            if (params.old_password_hash === params.new_password_hash) throw new PasswordMatchError("New password must be different from old password", { user_id: params.user_id });
            
            const { user_id, old_password_hash, new_password_hash } = params;
            const user = await this.repo.findUserById(user_id, tx);

            if (!user) throw new UserNotFoundError("user not found", { user_id });
            if (!user.password_hash) throw new IncorrectPasswordError("Password not found", { user_id });

            const match = await bcrypt.compare(old_password_hash, user.password_hash);
            if (!match) throw new IncorrectPasswordError("Incorrect old password", { user_id });
            
            const hashedNew = await bcrypt.hash(new_password_hash, 10);
            const updated = await this.repo.changePassword(user_id, hashedNew, tx);
            if (!updated) throw new PasswordChangeError("Failed to update password", { user_id });

            await tx.commit();
            return updated;
        } catch (err) {
            await tx.rollback();
            if (err instanceof PasswordMatchError) throw err;
            if (err instanceof UserNotFoundError) throw err;
            if (err instanceof IncorrectPasswordError) throw err;
            throw new PasswordChangeError("Could not change password", { error: err });
        }
    }
}

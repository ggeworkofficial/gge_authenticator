import { Request } from "express";
import bcrypt from "bcrypt";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { AuthRepository } from "../../repositories/auth.repository";
import { Postgres } from "../../connections/postgres";
import { User } from "../../models/postgres/User";
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
  AuthError,
  RefreshTokenReplayError,
} from "../../errors/auth.error";
import dotenv from "dotenv";
import { AppRepository } from "../../repositories/app.repository";
import { AppFindError, IncorrectAppSecretError } from "../../errors/app.error";
import { SessionNotFoundError } from "../../errors/session.error";

dotenv.config();

type LoginPayload = {
  email: string;
  password_hash: string;
};

export class AuthService {
    private authRepo = new AuthRepository();
    private appRepo = new AppRepository();
    private ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
    private REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
    private ACCESS_TTL = Number(process.env.ACCESS_TOKEN_TTL) || 900;
    private REFRESH_TTL = Number(process.env.REFRESH_TTL as string) || 604800;
    private db = Postgres.getInstance();

    public async isUserAdmin(userId: string): Promise<boolean> {
        try {
            const flag = await this.authRepo.isUserAdmin(userId);
            return !!flag;
        } catch (err) {
            throw new AuthError("Could not determine admin status", { userId, cause: err });
        }
    }

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

    public async verifyCodeChallenge(secret_key: string, code_verifier: string): Promise<any> {
        try {
            const stored = await this.authRepo.findCodeChallange(secret_key);
            if (!stored) throw new AuthError("Code challenge not found", { secret_key });

            let parsed: any;
            try {
                parsed = JSON.parse(stored);
            } catch (e) {
                throw new AuthError("Stored code challenge is invalid", { secret_key, e });
            }

            const codeChallenge = parsed.code_challenge || parsed.code_challange;
            const response = parsed.response;

            if (!codeChallenge) throw new AuthError("Stored code challenge missing", { secret_key });

            // compute SHA256 then base64url encode (PKCE S256 style)
            const hash = crypto.createHash("sha256").update(code_verifier).digest();
            const b64 = hash.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

            if (b64 !== codeChallenge) {
                throw new AuthError("Code verifier does not match challenge", { secret_key });
            }

            // Return the stored response without any code_challenge field
            if (response && typeof response === "object") {
                const out = { ...response };
                if (out.code_challenge) delete out.code_challenge;
                if (out.code_challange) delete out.code_challange;
                return out;
            }

            return response;
        } catch (err: any) {
            if (err instanceof AuthError) throw err;
            throw new AuthError("Code verification failed", { error: err });
        }
    }

    public async saveCodeChalleng(code_challange: string, response: any): Promise<string> {
        try {
            const key = uuidv4();
            await this.authRepo.storeCodeChallange(key, {code_challange, response});
            return key;
        } catch (error: any) {
            throw new AuthError("Authentication failed", {error});
        }
    }

    public async authenticate(accessToken: string) {
        try {
            const decoded = jwt.verify(accessToken, this.ACCESS_SECRET) as any;

            const { sub, app, device, type } = decoded;
            if (type !== "access") throw new AccessTokenError("Invalid token type");

            const session = await this.authRepo.findSessionByUserDevice(sub, device, app);
            if (!session) throw new SessionNotFoundError("Session not found");
            
            return {
                user_id: sub,
                app_id: app,
                device_id: device,
                session_id: session._id.toString(),
            };
        } catch (err: any) {
            if (err && err.name === "TokenExpiredError") throw new AccessTokenExpiredError("Access token expired", { cause: err });
            if (err && err.name === "JsonWebTokenError") throw new AccessTokenError("Access token invalid", { cause: err });
            throw err;
        }
    }

    public async refreshAccessToken(params: {
        refresh_token: string;
        accessTtl?: number;
        refreshTtl?: number;
        }) {
        const {
            refresh_token,
            accessTtl,
            refreshTtl
        } = params;

        let session;
        try {
            session = await this.authRepo.findSessionByRefreshToken(refresh_token);
            if (!session) throw new RefreshTokenNotFoundError("Refresh token session not found", {});
            
            const decoded = jwt.verify(refresh_token, this.REFRESH_SECRET) as any;
            const { sub, app, device, type } = decoded;

            if (type !== "access") throw new AccessTokenError("Invalid token type");
            if (
                decoded.sub !== sub ||
                decoded.device !== device ||
                decoded.app !== app ||
                decoded.type !== "refresh"
            ) {
                throw new AuthError("Refresh token mismatch");
            }
            const now = Math.floor(Date.now() / 1000);

            // TTLs
            const accessTTL =
                typeof accessTtl === "number" && !isNaN(accessTtl)
                ? accessTtl
                : this.ACCESS_TTL;

            const refreshTTL =
                typeof refreshTtl === "number" && !isNaN(refreshTtl)
                ? refreshTtl
                : this.REFRESH_TTL;

            // Generate new tokens
            const accessExp = now + accessTTL;
            const refreshExp = now + refreshTTL;

            const newAccessToken = jwt.sign(
                { sub: sub, app: app, device: device, type: "access" },
                this.ACCESS_SECRET,
                { expiresIn: accessTTL }
            );

            const newRefreshToken = jwt.sign(
                { sub: sub, app: app, device: device, type: "refresh" },
                this.REFRESH_SECRET,
                { expiresIn: refreshTTL }
            );

            const accessTokenExpiresAt = new Date(accessExp * 1000);
            const refreshTokenExpiresAt = new Date(refreshExp * 1000);
            const rotateResult = await this.authRepo.rotateRefreshToken(
                sub,
                device,
                app,
                refresh_token,
                newRefreshToken,
                refreshTokenExpiresAt
            );

            if (rotateResult.matchedCount === 0) {
                throw new RefreshTokenReplayError("Refresh token replay detected");
            }

            await this.authRepo.updateAccessTokenForSession(
                sub,
                device,
                app,
                newAccessToken,
                accessTokenExpiresAt
            );

            return {
                user_id: sub,
                device_id: device,
                app_id: app,
                session_id: session._id.toString(),
                access_token: newAccessToken,
                access_token_expires_at: accessTokenExpiresAt,
                refresh_token: newRefreshToken,
                refresh_token_expires_at: refreshTokenExpiresAt,
            };
        } catch (err: any) {
            if (err?.name === "TokenExpiredError") throw new RefreshTokenExpiredError("Refresh token expired");
            throw err;
        }

    }

    async changePassword(params: { user_id: string; old_password_hash: string; new_password_hash: string }): Promise<User> {
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
            return updated;
        } catch (err) {
            await tx.rollback();
            if (err instanceof PasswordMatchError) throw err;
            if (err instanceof UserNotFoundError) throw err;
            if (err instanceof IncorrectPasswordError) throw err;
            throw new PasswordChangeError("Could not change password", { error: err });
        }
    }

    async authenticateAppHmac(payload: {
        app_id: string;
        signature: string;
        timestamp: number;
        req: Request;
    }): Promise<void> {
        const { app_id, signature, timestamp, req } = payload;
        const transaction = await this.db.getTransaction();

        try {
            const app = await this.appRepo.findById(app_id, transaction);
            if (!app) throw new AppFindError("App not found", { app_id });
            if (!app.hashed_secret) throw new IncorrectAppSecretError("App secret not set", { app_id });
            
            const now = Date.now();
            const MAX_DRIFT_MS = 60_000; 

            if (Math.abs(now - timestamp) > MAX_DRIFT_MS) throw new AuthError("Request timestamp expired", { app_id, timestamp });

            const body = req.body && Object.keys(req.body).length
                        ? JSON.stringify(req.body)
                        : "";

            console.log("OG URL: ", req.originalUrl);
            const signingString = [
                req.method.toUpperCase(),
                req.originalUrl,
                timestamp,
                body,
            ].join("|");

            const expectedSignature = crypto
                .createHmac("sha256", app.hashed_secret)
                .update(signingString)
                .digest("hex");

            const sigOk =
            signature.length === expectedSignature.length &&
            crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            );

            if (!sigOk) throw new IncorrectAppSecretError("Invalid HMAC signature", { app_id });
            

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();

            if (
                error instanceof AppFindError ||
                error instanceof IncorrectAppSecretError ||
                error instanceof AuthError
            ) {
                throw error;
            }

                throw new AuthError("App authentication failed", {
                app_id,
                cause: error,
            });
        }
    }

    async createInternalSignature(params: {
        method: string;
        url: string;
        body?: any;
    }) {
        const timestamp = Date.now().toString();

        const payload =
            params.body && Object.keys(params.body).length
            ? JSON.stringify(params.body)
            : "";

        const signingString = [
            params.method.toUpperCase(),
            params.url,
            timestamp,
            payload,
        ].join("|");

        const signature = crypto
            .createHmac("sha256", process.env.INTERNAL_SECRET!)
            .update(signingString)
            .digest("hex");

        return {
            timestamp,
            signature,
        };
    }

    async validateInternalHmac(params: {
        signature: string;
        timestamp: number;
        req: Request;
    }): Promise<void> {
        const { signature, timestamp, req } = params;

        const MAX_DRIFT_MS = 60_000;
        if (Math.abs(Date.now() - timestamp) > MAX_DRIFT_MS) {
            throw new AuthError("Internal request expired", 401);
        }

        const body =
            req.body && Object.keys(req.body).length
            ? JSON.stringify(req.body)
            : "";

        const signingString = [
            req.method.toUpperCase(),
            req.originalUrl,
            timestamp,
            body,
        ].join("|");

        const expectedSignature = crypto
            .createHmac("sha256", process.env.INTERNAL_SECRET!)
            .update(signingString)
            .digest("hex");

        const valid =
            signature.length === expectedSignature.length &&
            crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
            );

        if (!valid) {
            throw new AuthError("Invalid internal signature", 401);
        }
    }

}

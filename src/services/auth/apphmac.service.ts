import * as crypto from "crypto";
import { AppRepository } from "../../repositories/app.repository";
import { Postgres } from "../../connections/postgres";
import { AppFindError, IncorrectAppSecretError } from "../../errors/app.error";
import { AuthError } from "../../errors/auth.error";
import { Request } from "express";

export class AppHmacAuthService {
  private appRepo = new AppRepository();
  private db = Postgres.getInstance();

  async authenticate(params: { app_id: string; signature: string; timestamp: number; req: Request }): Promise<void> {
    const { app_id, signature, timestamp, req } = params;
    const transaction = await this.db.getTransaction();

    try {
      const app = await this.appRepo.findById(app_id, transaction);
      if (!app) throw new AppFindError("App not found", { app_id });
      if (!app.hashed_secret) throw new IncorrectAppSecretError("App secret not set", { app_id });

      const now = Date.now();
      const MAX_DRIFT_MS = 60_000;

      if (Math.abs(now - timestamp) > MAX_DRIFT_MS) throw new AuthError("Request timestamp expired", { app_id, timestamp });

      const body = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : "";

      const signingString = [req.method.toUpperCase(), req.originalUrl, timestamp, body].join("|");

      const expectedSignature = crypto.createHmac("sha256", app.hashed_secret).update(signingString).digest("hex");

      const sigOk = signature.length === expectedSignature.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

      if (!sigOk) throw new IncorrectAppSecretError("Invalid HMAC signature", { app_id });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppFindError || error instanceof IncorrectAppSecretError || error instanceof AuthError) throw error;
      throw new AuthError("App authentication failed", { app_id, cause: error });
    }
  }
}

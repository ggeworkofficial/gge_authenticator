import * as crypto from "crypto";
import { AuthError } from "../../errors/auth.error";
import { Request } from "express";

export class InternalAuthService {
  async createInternalSignature(params: { method: string; url: string; body?: any }) {
    const timestamp = Date.now().toString();

    const payload = params.body && Object.keys(params.body).length ? JSON.stringify(params.body) : "";

    const signingString = [params.method.toUpperCase(), params.url, timestamp, payload].join("|");

    const signature = crypto.createHmac("sha256", process.env.INTERNAL_SECRET!).update(signingString).digest("hex");

    return { timestamp, signature };
  }

  async validateInternalHmac(params: { signature: string; timestamp: number; req: Request }): Promise<void> {
    const { signature, timestamp, req } = params;

    const MAX_DRIFT_MS = 60_000;
    if (Math.abs(Date.now() - timestamp) > MAX_DRIFT_MS) {
      throw new AuthError("Internal request expired", 401);
    }

    const body = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : "";

    const signingString = [req.method.toUpperCase(), req.originalUrl, timestamp, body].join("|");

    const expectedSignature = crypto.createHmac("sha256", process.env.INTERNAL_SECRET!).update(signingString).digest("hex");

    const valid = signature.length === expectedSignature.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!valid) {
      throw new AuthError("Invalid internal signature", 401);
    }
  }
}

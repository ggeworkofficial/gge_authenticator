import jwt from "jsonwebtoken";
import { AuthRepository } from "../../repositories/auth.repository";
import { RefreshTokenNotFoundError, RefreshTokenExpiredError, AccessTokenError, RefreshTokenReplayError } from "../../errors/auth.error";

export class RefreshAuthService {
  private authRepo = new AuthRepository();
  private ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
  private REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
  private ACCESS_TTL = Number(process.env.ACCESS_TOKEN_TTL) || 900;
  private REFRESH_TTL = Number(process.env.REFRESH_TTL as string) || 604800;

  async rotate(params: { refresh_token: string; accessTtl?: number; refreshTtl?: number }) {
    const { refresh_token, accessTtl, refreshTtl } = params;
    let session;
    try {
      session = await this.authRepo.findSessionByRefreshToken(refresh_token);
      if (!session) throw new RefreshTokenNotFoundError("Refresh token session not found", {});

      const decoded = jwt.verify(refresh_token, this.REFRESH_SECRET) as any;
      const { sub, app, device, type } = decoded;

      if (type !== "refresh") throw new AccessTokenError("Invalid token type");
      if (
        decoded.sub !== sub ||
        decoded.device !== device ||
        decoded.app !== app ||
        decoded.type !== "refresh"
      ) {
        throw new Error("Refresh token mismatch");
      }

      const now = Math.floor(Date.now() / 1000);

      const accessTTL = typeof accessTtl === "number" && !isNaN(accessTtl) ? accessTtl : this.ACCESS_TTL;
      const refreshTTL = typeof refreshTtl === "number" && !isNaN(refreshTtl) ? refreshTtl : this.REFRESH_TTL;

      const accessExp = now + accessTTL;
      const refreshExp = now + refreshTTL;

      const newAccessToken = jwt.sign({ sub: sub, app: app, device: device, type: "access" }, this.ACCESS_SECRET, { expiresIn: accessTTL });

      const newRefreshToken = jwt.sign({ sub: sub, app: app, device: device, type: "refresh" }, this.REFRESH_SECRET, { expiresIn: refreshTTL });

      const accessTokenExpiresAt = new Date(accessExp * 1000);
      const refreshTokenExpiresAt = new Date(refreshExp * 1000);

      const rotateResult = await this.authRepo.rotateRefreshToken(sub, device, app, refresh_token, newRefreshToken, refreshTokenExpiresAt);

      if (rotateResult.matchedCount === 0) {
        throw new RefreshTokenReplayError("Refresh token replay detected");
      }

      await this.authRepo.updateAccessTokenForSession(sub, device, app, newAccessToken, accessTokenExpiresAt);

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
}

import jwt from "jsonwebtoken";
import { AuthRepository } from "../../repositories/auth.repository";
import { Postgres } from "../../connections/postgres";
import { AccessTokenError, AccessTokenExpiredError } from "../../errors/auth.error";
import { SessionNotFoundError } from "../../errors/session.error";

export class JwtAuthService {
  private authRepo = new AuthRepository();
  private ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

  async authenticate(accessToken: string) {
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
}

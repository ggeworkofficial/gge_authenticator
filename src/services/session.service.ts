import jwt from "jsonwebtoken";
import { SessionRepository } from "../repositories/session.repository";
import { SessionCreateError, SessionUpdateError, SessionListError, SessionNotFoundError, SessionValidationError, SessionDeleteError } from "../errors/session.error";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || "access-secret";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh-secret";

export class SessionService {
  private repo = new SessionRepository();

  /**
   * Create session tokens and persist session document in MongoDB.
   * @param params accessTtl/refreshTtl in seconds (number)
   */
  public async createSession(params: {
    userId: string;
    appId: string;
    deviceId: string;
    clientType?: "browser" | "mobile" | "desktop";
    accessTtl?: number;
    refreshTtl?: number;
  }) {
    const { userId, appId, deviceId, clientType = "browser", accessTtl = Number(process.env.ACCESS_TOKEN_TTL) || 900, refreshTtl = Number(process.env.REFRESH_TOKEN_TTL) || 604800 } = params;

    if (!userId || !appId || !deviceId) {
      throw new SessionValidationError("userId, appId and deviceId are required");
    }

    try {
      const now = Math.floor(Date.now() / 1000);

      const accessExp = now + accessTtl;
      const refreshExp = now + refreshTtl;

      const accessToken = jwt.sign({ sub: userId, app: appId, device: deviceId, type: "access" }, ACCESS_SECRET, { expiresIn: accessTtl });
      const refreshToken = jwt.sign({ sub: userId, app: appId, device: deviceId, type: "refresh" }, REFRESH_SECRET, { expiresIn: refreshTtl });

      const accessTokenExpiresAt = new Date(accessExp * 1000);
      const refreshTokenExpiresAt = new Date(refreshExp * 1000);

      const doc = {
        userId,
        appId,
        clientType,
        deviceId,
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        createdAt: new Date(),
        expiresAt: refreshTokenExpiresAt,
      };

      const stored = await this.repo.create(doc as any);

      return {
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        session: stored,
      };
    } catch (err) {
      if (err instanceof SessionCreateError) throw err;
      throw new SessionCreateError("Could not create session", { error: err });
    }
  }

  public async listSessions(filter?: { user_id?: string; app_id?: string; device_id?: string }) {
    try {
      const rows = await this.repo.findAll(filter as any);
      return rows;
    } catch (err) {
      throw new SessionListError("Could not list sessions", { error: err });
    }
  }

  public async getSessionById(id: string) {
    try {
      const row = await this.repo.findById(id);
      if (!row) throw new SessionNotFoundError("Session not found", { id });
      return row;
    } catch (err) {
      if (err instanceof SessionNotFoundError) throw err;
      throw new SessionListError("Failed to get session", { error: err });
    }
  }

  public async updateSession(id: string, data: Partial<any>) {
    try {
      const res = await this.repo.updateById(id, data as any);
      if (!res || (res.matchedCount !== undefined && res.matchedCount === 0)) {
        throw new SessionNotFoundError("Session not found for update", { id });
      }
      const updated = await this.repo.findById(id);
      return updated;
    } catch (err) {
      if (err instanceof SessionNotFoundError) throw err;
      throw new SessionUpdateError("Could not update session", { error: err });
    }
  }

  public async deleteSessionById(id: string) {
    try {
      const deleted = await this.repo.deleteById(id);
      if (!deleted) throw new SessionNotFoundError("Session not found for delete", { id });
      return deleted;
    } catch (err) {
      if (err instanceof SessionNotFoundError) throw err;
      throw new SessionDeleteError("Could not delete session", { error: err });
    }
  }

  public async deleteSessionsByFilter(filter: { user_id?: string; app_id?: string; device_id?: string }) {
    try {
      const deleted = await this.repo.deleteByFilter(filter as any);
      return deleted;
    } catch (err) {
      throw new SessionDeleteError("Could not delete sessions", { error: err });
    }
  }
}

import { Token } from "../models/mongodb/TokenDocument";
import { SessionCreateError } from "../errors/session.error";

interface SessionDoc {
  userId: string;
  appId: string;
  clientType: "browser" | "mobile" | "desktop";
  deviceId: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  createdAt: Date;
  expiresAt: Date;
}

export class SessionRepository {
  public async create(doc: SessionDoc) {
    try {
      
      const now = new Date();
      const update = {
        $set: {
          ...doc,
          createdAt: doc.createdAt || now,
          expiresAt: doc.expiresAt || doc.refreshTokenExpiresAt,
        }
      } as any;

      const filter = {
        userId: doc.userId,
        appId: doc.appId,
        deviceId: doc.deviceId,
      }

      const res = await Token.updateOne(filter, update, {upsert: true});
      if (!res.acknowledged) throw new SessionCreateError("Failed to insert session document", { res });
      // attach insertedId
      return { ...update, _id: res.upsertedId } as any;
    } catch (err) {
      throw new SessionCreateError("Failed to create session", { error: err });
    }
  }
}

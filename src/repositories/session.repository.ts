import { Token } from "../models/mongodb/TokenDocument";
import { SessionCreateError } from "../errors/session.error";
import { ObjectId } from "mongodb";

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
      };

      const res = await Token.updateOne(filter, update, { upsert: true });
      if (!res.acknowledged) throw new SessionCreateError("Failed to insert session document", { res });
      // return stored document - fetch it
      const stored = await Token.findOne(filter);
      return stored as any;
    } catch (err) {
      throw new SessionCreateError("Failed to create session", { error: err });
    }
  }

  public async findById(id: string) {
    try {
      const obj = await Token.findOne({ _id: new ObjectId(id) } as any);
      return obj as any;
    } catch (err) {
      throw err;
    }
  }

  public async findAll(filter?: Partial<{ user_id?: string; app_id?: string; device_id?: string }>) {
    try {
      const q: any = {};
      if (!filter) return (await Token.find({}).toArray()) as any;
      if ((filter as any).user_id) q.userId = (filter as any).user_id;
      if ((filter as any).app_id) q.appId = (filter as any).app_id;
      if ((filter as any).device_id) q.deviceId = (filter as any).device_id;
      return (await Token.find(q).toArray()) as any;
    } catch (err) {
      throw err;
    }
  }

  public async updateById(id: string, data: Partial<SessionDoc>) {
    try {
      const update = { $set: data } as any;
      const res = await Token.updateOne({ _id: id } as any, update);
      return res;
    } catch (err) {
      throw err;
    }
  }

  public async deleteById(id: string) {
    try {
      const res = await Token.deleteOne({ _id: id } as any);
      return res.deletedCount || 0;
    } catch (err) {
      throw err;
    }
  }

  public async deleteByFilter(filter: Partial<{ user_id?: string; app_id?: string; device_id?: string }>) {
    try {
      const q: any = {};
      if ((filter as any).user_id) q.userId = (filter as any).user_id;
      if ((filter as any).app_id) q.appId = (filter as any).app_id;
      if ((filter as any).device_id) q.deviceId = (filter as any).device_id;
      const res = await Token.deleteMany(q);
      return res.deletedCount || 0;
    } catch (err) {
      throw err;
    }
  }
}

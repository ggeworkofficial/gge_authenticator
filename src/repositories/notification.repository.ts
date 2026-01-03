import { ObjectId } from "mongodb";
import { getNotificationCollection, NotificationDocument } from "../models/mongodb/NotificationDocument";
import { getUnreadCounterCollection, UnreadCounterDocument } from "../models/mongodb/UnreadCounterDocument";
import {
  NotificationRepositoryError,
  InvalidNotificationIdError,
} from "../errors/notification.error";
import { MongoDB } from "../connections/mongodb";

const mongodb = MongoDB.getInstance();
export class NotificationRepository {
  /**
   * Start watching insert events on the notifications collection.
   * onInsert will be called with the full inserted document.
   * Returns the changeStream so caller can close it when needed.
   */
  public async getNotificationCollection() {
    return await getNotificationCollection();
  }

  public async getUnreadCounterCollection() {
    return await getUnreadCounterCollection();
  }

  public async watchInserts(onInsert: (doc: NotificationDocument) => void) {
    await mongodb.connect();
    const pipeline = [
      { $match: { operationType: "insert" } },
    ];

    const db = await getNotificationCollection();
    const changeStream = db.watch(pipeline, { fullDocument: "updateLookup" });
    console.log("Started watching notification inserts");
    changeStream.on("change", (change: any) => {
      try {
        const doc = change.fullDocument as NotificationDocument;
        console.log(`New notification inserted: ${doc._id} for user ${doc.userId}`);
        onInsert(doc);
      } catch (err) {
        // swallow handler errors to keep stream alive
        console.error("notification changeStream handler error", err);
      }
    });

    changeStream.on("error", (err: any) => {
      console.error("notification changeStream error", err);
    });

    return changeStream;
  }

  /**
   * Increment (or decrement) unread counter for a user/app/device combination.
   * Creates the document if it does not exist.
   */
  private async incrementUnreadCounter(
    userId: string,
    appId?: string,
    deviceId?: string,
    delta = 1
  ): Promise<UnreadCounterDocument> {
    await mongodb.connect();
    const filter: any = { userId };
    if (appId) filter.appId = appId;
    if (deviceId) filter.deviceId = deviceId;

    const update = {
      $inc: { unreadCount: delta },
      $set: { updatedAt: new Date() },
      $setOnInsert: { userId, appId: appId || undefined, deviceId: deviceId || undefined },
    } as any;

    try {
      const db = await getUnreadCounterCollection();
      await db.updateOne(filter, update, { upsert: true });
      const doc = await db.findOne(filter) as any;

      // normalize _id to string like other models
      const result: UnreadCounterDocument = {
        _id: doc?._id?.toString(),
        userId: doc.userId,
        appId: doc.appId,
        deviceId: doc.deviceId,
        unreadCount: doc.unreadCount || 0,
        updatedAt: doc.updatedAt,
      };

      return result;
    } catch (err: any) {
      throw new NotificationRepositoryError("Failed to increment unread counter", err?.message || err);
    }
  }

  public closeChangeStream(changeStream: any) {
    try {
      changeStream.close();
    } catch (err) {
      // ignore
    }
  }

  public async insertNotification(data: Partial<NotificationDocument>): Promise<NotificationDocument> {
    try {
      const payload: Partial<NotificationDocument> = {
        userId: data.userId!,
        type: data.type || "info",
        title: data.title || "",
        message: data.message || "",
        metadata: data.metadata || {},
        read: data.read ?? false,
        delivered: data.delivered ?? false,
        createdAt: data.createdAt || new Date(),
        expiresAt: data.expiresAt,
      };

      const db = await this.getNotificationCollection();
      const res = await db.insertOne(payload as any);
      await this.incrementUnreadCounter(data.userId!, data.metadata?.appId, data.metadata?.deviceId, 1);
      const inserted = await db.findOne({ _id: res.insertedId } as any) as any;
      return this.normalize(inserted);
    } catch (err: any) {
      throw new NotificationRepositoryError("Failed to insert notification", err?.message || err);
    }
  }

  public async updateRead(notificationId: string, read: boolean): Promise<boolean> {
    try {
      await mongodb.connect();
      const _id = this.toObjectId(notificationId);

    const db = await this.getNotificationCollection();
    const res = await db.findOneAndUpdate(
      { _id, read: false },              // only if unread
      { $set: { read: true } },
      { returnDocument: "before" }       // get OLD doc
    );

    if (!res) {
      return false; // already read or not found
    }

    const doc = res;

    await this.incrementUnreadCounter(
      doc.userId,
      doc.metadata?.appId,
      doc.metadata?.deviceId,
      -1
    );

    return true;

  } catch (err: any) {
    if (err instanceof InvalidNotificationIdError) throw err;
    throw new NotificationRepositoryError("Failed to update read status", err?.message || err);
  }
}
  public async updateNotification(notificationId: string, data: Partial<NotificationDocument>): Promise<NotificationDocument | null> {
    try {
      await mongodb.connect();
      const _id = this.toObjectId(notificationId);
      const update = { ...data } as any;
      // prevent overriding _id
      delete update._id;
      const db = await this.getNotificationCollection();
      await db.updateOne({ _id } as any, { $set: update } as any);
      const doc = await db.findOne({ _id } as any) as any;
      return doc ? this.normalize(doc) : null;
    } catch (err: any) {
      if (err instanceof InvalidNotificationIdError) throw err;
      throw new NotificationRepositoryError("Failed to update notification", err?.message || err);
    }
  }

  public async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await mongodb.connect();
      const db = await this.getNotificationCollection();
      const _id = this.toObjectId(notificationId);

      // find the notification first to get user/app/device and read status
      const doc: any = await db.findOne({ _id } as any);
      if (!doc) return false;

      // if the notification was unread, decrement the unread counter
      if (!doc.read) {
        try {
          await this.incrementUnreadCounter(
            doc.userId,
            doc.metadata?.appId,
            doc.metadata?.deviceId,
            -1
          );
        } catch (err) {
          // log and continue with delete to avoid leaving stale notifications
          console.error("Failed to decrement unread counter for deleted notification", err);
        }
      }

      const res = await db.deleteOne({ _id } as any);
      return res.deletedCount > 0;
    } catch (err: any) {
      if (err instanceof InvalidNotificationIdError) throw err;
      throw new NotificationRepositoryError("Failed to delete notification", err?.message || err);
    }
  }

  /**
   * Retrieve the unread counter document (or null) for the given user/app/device
   */
  public async getUnreadCounter(userId: string, appId?: string, deviceId?: string): Promise<UnreadCounterDocument | null> {
    try {
      await mongodb.connect();
      const filter: any = { userId };
      if (appId) filter.appId = appId;
      if (deviceId) filter.deviceId = deviceId;
      const db = await this.getUnreadCounterCollection();
      const doc = await db.findOne(filter) as any;
      if (!doc) return null;
      const result: UnreadCounterDocument = {
        _id: doc._id?.toString(),
        userId: doc.userId,
        appId: doc.appId,
        deviceId: doc.deviceId,
        unreadCount: doc.unreadCount || 0,
        updatedAt: doc.updatedAt,
      };
      return result;
    } catch (err: any) {
      throw new NotificationRepositoryError("Failed to retrieve unread counter", err?.message || err);
    }
  }

  /**
   * Cursor-based pagination using ObjectId cursor. Returns items and nextCursor (string _id) when more available.
   * If lastId is provided, it will return documents with _id < lastId (newest first).
   */
  public async listNotifications(userId: string, limit = 20, lastId?: string, appId?: string, deviceId?: string) {
    try {
      await mongodb.connect();
      const filter: any = { userId };
      if (lastId) {
        filter._id = { $lt: this.toObjectId(lastId) };
      }

      const db = await this.getNotificationCollection();
      const cursor = db.find(filter).sort({ _id: -1 }).limit(limit + 1);
      const docs = await cursor.toArray() as any[];

      let nextCursor: string | undefined = undefined;
      if (docs.length > limit) {
        const next = docs[limit];
        nextCursor = next._id.toString();
        docs.splice(limit, 1);
      }

      const items = docs.map((d) => this.normalize(d));

      return {
        items,
        nextCursor,
      };
    } catch (err: any) {
      throw new NotificationRepositoryError("Failed to list notifications", err?.message || err);
    }
  }

  private toObjectId(id: string) {
    try {
      return new ObjectId(id);
    } catch (err) {
      throw new InvalidNotificationIdError("Invalid notification id", err);
    }
  }

  private normalize(doc: any): NotificationDocument {
    if (!doc) return doc;
    const n: NotificationDocument = {
      _id: doc._id?.toString(),
      userId: doc.userId,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      metadata: doc.metadata,
      read: !!doc.read,
      delivered: !!doc.delivered,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
    };
    return n;
  }
}

export default new NotificationRepository();

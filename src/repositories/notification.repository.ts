import { ObjectId } from "mongodb";
import { Notification, NotificationDocument } from "../models/mongodb/NotificationDocument";
import { MongoDB } from "../connections/mongodb";

export class NotificationRepository {
  private db = MongoDB.getInstance();
  private collection = Notification;

  /**
   * Start watching insert events on the notifications collection.
   * onInsert will be called with the full inserted document.
   * Returns the changeStream so caller can close it when needed.
   */
  public watchInserts(onInsert: (doc: NotificationDocument) => void) {
    const pipeline = [
      { $match: { operationType: "insert" } },
    ];

    const changeStream = this.collection.watch(pipeline, { fullDocument: "updateLookup" });

    changeStream.on("change", (change: any) => {
      try {
        const doc = change.fullDocument as NotificationDocument;
        onInsert(doc);
      } catch (err) {
        // swallow handler errors to keep stream alive
        console.error("notification changeStream handler error", err);
      }
    });

    changeStream.on("error", (err) => {
      console.error("notification changeStream error", err);
    });

    return changeStream;
  }

  public closeChangeStream(changeStream: any) {
    try {
      changeStream.close();
    } catch (err) {
      // ignore
    }
  }

  public async insertNotification(data: Partial<NotificationDocument>): Promise<NotificationDocument> {
    const payload: Partial<NotificationDocument> = {
      userId: data.userId!,
      type: data.type || "info",
      title: data.title || "",
      message: data.message || "",
      metadata: data.metadata || {},
      read: !!data.read,
      delivered: !!data.delivered,
      createdAt: data.createdAt || new Date(),
      expiresAt: data.expiresAt,
    };

    const res = await this.collection.insertOne(payload as any);
    const inserted = await this.collection.findOne({ _id: res.insertedId } as any) as any;
    return this.normalize(inserted);
  }

  public async updateRead(notificationId: string, read: boolean): Promise<boolean> {
    const _id = this.toObjectId(notificationId);
    const res = await this.collection.updateOne({ _id } as any, { $set: { read } } as any);
    return res.modifiedCount > 0;
  }

  public async updateNotification(notificationId: string, data: Partial<NotificationDocument>): Promise<NotificationDocument | null> {
    const _id = this.toObjectId(notificationId);
    const update = { ...data } as any;
    // prevent overriding _id
    delete update._id;
    await this.collection.updateOne({ _id } as any, { $set: update } as any);
    const doc = await this.collection.findOne({ _id } as any) as any;
    return doc ? this.normalize(doc) : null;
  }

  public async deleteNotification(notificationId: string): Promise<boolean> {
    const _id = this.toObjectId(notificationId);
    const res = await this.collection.deleteOne({ _id } as any);
    return res.deletedCount > 0;
  }

  /**
   * Cursor-based pagination using ObjectId cursor. Returns items and nextCursor (string _id) when more available.
   * If lastId is provided, it will return documents with _id < lastId (newest first).
   */
  public async listNotifications(userId: string, limit = 20, lastId?: string) {
    const filter: any = { userId };
    if (lastId) {
      filter._id = { $lt: this.toObjectId(lastId) };
    }

    const cursor = this.collection.find(filter).sort({ _id: -1 }).limit(limit + 1);
    const docs = await cursor.toArray() as any[];

    let nextCursor: string | undefined = undefined;
    if (docs.length > limit) {
      const next = docs[limit];
      nextCursor = next._id.toString();
      docs.splice(limit, 1);
    }

    return {
      items: docs.map((d) => this.normalize(d)),
      nextCursor,
    };
  }

  private toObjectId(id: string) {
    try {
      return new ObjectId(id);
    } catch (err) {
      throw new Error("Invalid ObjectId");
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

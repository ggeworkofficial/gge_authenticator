import { MongoDB } from "../../connections/mongodb";

const mongodb = MongoDB.getInstance();

export interface UnreadCounterDocument {
  _id?: string;
  userId: string;
  appId?: string;
  deviceId?: string;
  unreadCount: number;
  updatedAt: Date;
}

export async function getUnreadCounterCollection() {
  const db = await MongoDB.getInstance().waitForDB();
  return db.collection<UnreadCounterDocument>("unread_counters");
}

export async function initUnreadCounterIndexes() {
  const collection = await getUnreadCounterCollection();
  await collection.createIndex(
    { userId: 1, appId: 1, deviceId: 1 },
    {
      unique: true,
      name: "uniq_user_app_device_unread",
    }
  );
}
import { MongoDB } from "../../connections/mongodb";
import { ObjectId } from "mongodb";

export interface TwoFADocument {
  _id?: ObjectId;
  userId: string;
  type: "login" | "password_reset" | "sensitive_action";
  otpHash: string;          
  expiresAt: Date;          
  used: boolean;            
  createdAt: Date;
}

export async function getTwoFACollection() {
  const db = await MongoDB.getInstance().waitForDB();
  return db.collection<TwoFADocument>("two_fa");
}

export async function expieresAtIndex() {
  const collection = await getTwoFACollection();
  await collection.createIndex(
    { expiresAt: 1 },
    {
      expireAfterSeconds: 0,
      name: "idx_expires_at",
    }
  );
}
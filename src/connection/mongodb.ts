import { MongoClient, Db } from "mongodb";

export class MongoDB {
  private static instance: MongoDB;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private constructor() {} // prevent direct construction

  public static getInstance(): MongoDB {
    if (!MongoDB.instance) {
      MongoDB.instance = new MongoDB();
    }
    return MongoDB.instance;
  }

  public async connect(): Promise<void> {
    if (this.client) return; // Already connected

    const uri = process.env.MONGO_URI;
    const dbName = process.env.MONGO_DB_NAME;

    if (!uri) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    this.client = new MongoClient(uri);

    try {
      await this.client.connect();
      this.db = this.client.db(dbName);
      console.log(`🔥 MongoDB connected -> DB: ${dbName}`);
    } catch (err) {
      console.error("Failed to connect to MongoDB:", err);
      throw err;
    }
  }

  public getDB(): Db {
    if (!this.db) {
      throw new Error("Database not initialized! Call connect() first.");
    }
    return this.db;
  }

  public getClient(): MongoClient {
    if (!this.client) {
      throw new Error("Client not initialized! Call connect() first.");
    }
    return this.client;
  }
}

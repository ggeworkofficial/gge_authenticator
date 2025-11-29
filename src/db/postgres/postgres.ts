import { Sequelize } from "sequelize-typescript";
import { Transaction } from "sequelize";
import path from "path";

export class Postgres {
  private static instance: Postgres;
  public sequelize: Sequelize;

  private constructor() {
    this.sequelize = new Sequelize({
      dialect: "postgres",
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      logging: false,
      models: [path.join(__dirname, "..", "models")], // Auto-load all models
    });
  }

  /**
   * Returns the global DB instance (Singleton)
   */
  public static getInstance(): Postgres {
    if (!Postgres.instance) {
      Postgres.instance = new Postgres();
    }
    return Postgres.instance;
  }

  /**
   * Returns a new transaction (recommended usage)
   */
  public async getTransaction(): Promise<Transaction> {
    return await this.sequelize.transaction();
  }

  /**
   * Utility: Test database connection
   */
  public async testConnection(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      console.log("PostgreSQL connection established successfully.");
    } catch (error) {
      console.error("Unable to connect to PostgreSQL:", error);
    }
  }
}

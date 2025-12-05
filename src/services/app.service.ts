import { Postgres } from "../connections/postgres";
import {
  AppCreateError,
  AppFindError,
  AppListError,
  AppUpdateError,
  AppDeleteError,
} from "../errors/app.error";
import { App } from "../models/postgres/App";
import { AppRepository } from "../repositories/app.repository";


export class AppService {
  private repo = new AppRepository();

  async createApp(appData: App): Promise<App> {
    const db = Postgres.getInstance();
    const transaction = await db.getTransaction();
    try {
      const existingApp = await this.repo.findByName(appData.name!, transaction);
      if (existingApp) throw new AppCreateError("App already exists", { name: appData.name });

      const app = await this.repo.create(appData, transaction);
      await transaction.commit();
      return app;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAppById(id: string): Promise<App> {
    const db = Postgres.getInstance();
    const transaction = await db.getTransaction();
    try {
      const app = await this.repo.findById(id, transaction);
      if (!app) throw new AppFindError("App not found", { id });
      await transaction.commit();
      return app;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppFindError) throw error;
      throw new AppFindError("Failed to fetch app", { id, cause: error });
    }
  }

  async getApps(filter?: Partial<App>): Promise<App[]> {
    const db = Postgres.getInstance();
    const transaction = await db.getTransaction();
    try {
      const apps = await this.repo.findAll(filter, transaction);
      await transaction.commit();
      return apps;
    } catch (error) {
      await transaction.rollback();
      throw new AppListError("Failed to list apps", { filter, cause: error });
    }
  }

  async updateApp(id: string, data: Partial<App>): Promise<App> {
    const db = Postgres.getInstance();
    const transaction = await db.getTransaction();
    try {
      const updated = await this.repo.update(id, data, transaction);
      if (!updated) throw new AppUpdateError("App not found", { id });
      await transaction.commit();
      return updated;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppUpdateError) throw error;
      throw new AppUpdateError("Failed to update app", { id, data, cause: error });
    }
  }

  async deleteApp(id: string): Promise<boolean> {
    const db = Postgres.getInstance();
    const transaction = await db.getTransaction();
    try {
      const deleted = await this.repo.delete(id, transaction);
      if (!deleted) throw new AppDeleteError("App not found", { id });
      await transaction.commit();
      return deleted;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppDeleteError) throw error;
      throw new AppDeleteError("Failed to delete app", { id, cause: error });
    }
  }

}

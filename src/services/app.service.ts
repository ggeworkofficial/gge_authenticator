import { Postgres } from "../connections/postgres";
import {
  AppCreateError,
  AppFindError,
  AppListError,
  AppUpdateError,
  AppDeleteError,
  IncorrectAppSecretError,
} from "../errors/app.error";
import { AppUserCreateError, AppUserExistsError } from "../errors/app.error";
import { App } from "../models/postgres/App";
import { AppRepository } from "../repositories/app.repository";
import { UserApp } from "../models/postgres/UserApp";
import { UserRepository } from "../repositories/user.repository";
import { AppDTO, AppMapper } from "../DTO/app.dto";


export class AppService {
    private appRepo = new AppRepository();
    private userRepo = new UserRepository();
    private db = Postgres.getInstance();

    async createApp(appData: App): Promise<AppDTO> {
        const transaction = await this.db.getTransaction();
        try {
            const existingApp = await this.appRepo.findByName(appData.name!, transaction);
            if (existingApp) throw new AppCreateError("App already exists", { name: appData.name });

            const app = await this.appRepo.create(appData, transaction);
            await transaction.commit();
            return AppMapper.toAll(app);
        } catch (error) {
            await transaction.rollback();
            if (error instanceof AppCreateError) throw error;
            throw new AppCreateError("Failed to create app", { appData, cause: error });
        }
    }

    async createUserApp(user_id: string, app_id: string): Promise<UserApp> {
        const transaction = await this.db.getTransaction();
        try {
            const existing = await UserApp.findOne({ where: { user_id: user_id, app_id: app_id }, transaction: transaction });
            if (existing) throw new AppUserExistsError("User is already linked to this app", { userId: user_id, appId: app_id });

            const user = await this.userRepo.findById(user_id, transaction);
            if (!user) throw new AppUserExistsError("User not found", { userId: user_id, appId: app_id });

            const app = await this.appRepo.findById(app_id, transaction);
            if (!app) throw new AppUserExistsError("App not found", { userId: user_id, appId: app_id });

            const userApp = await this.appRepo.createUserApp(user_id, app_id, transaction);
            await transaction.commit();
            return userApp;
        } catch (error) {
            await transaction.rollback();
            if (error instanceof AppUserExistsError) throw error;
            throw new AppUserCreateError("Failed to create user-app link", { userId: user_id, appId: app_id, cause: error });
        }
    }

    async getAppById(id: string): Promise<AppDTO> {
        const transaction = await this.db.getTransaction();
        try {
            const app = await this.appRepo.findById(id, transaction);
            if (!app) throw new AppFindError("App not found", { id });
            await transaction.commit();
            return AppMapper.toAll(app);
        } catch (error) {
            await transaction.rollback();
            if (error instanceof AppFindError) throw error;
            throw new AppFindError("Failed to fetch app", { id, cause: error });
        }
    }

    async getApps(filter?: Partial<App>): Promise<AppDTO[]> {
        const transaction = await this.db.getTransaction();
        try {
            const apps = await this.appRepo.findAll(filter, transaction);
            await transaction.commit();
            return AppMapper.toAllList(apps);
        } catch (error) {
            await transaction.rollback();
            throw new AppListError("Failed to list apps", { filter, cause: error });
        }
    }

    async updateApp(id: string, data: Partial<App>): Promise<AppDTO> {
        const transaction = await this.db.getTransaction();
        try {
            const updated = await this.appRepo.update(id, data, transaction);
            if (!updated) throw new AppUpdateError("App not found", { id });
            await transaction.commit();
            return AppMapper.toAll(updated);
        } catch (error) {
            await transaction.rollback();
            if (error instanceof AppUpdateError) throw error;
            throw new AppUpdateError("Failed to update app", { id, data, cause: error });
        }
    }

    async deleteApp(id: string): Promise<boolean> {
        const transaction = await this.db.getTransaction();
        try {
            const deleted = await this.appRepo.delete(id, transaction);
            if (!deleted) throw new AppDeleteError("App not found", { id });
            await transaction.commit();
            return deleted;
        } catch (error) {
            await transaction.rollback();
            if (error instanceof AppDeleteError) throw error;
            throw new AppDeleteError("Failed to delete app", { id, cause: error });
        }
    }

    async changeAppSecret(params: {id: string, old_hashed_secret: string, new_hashed_secret: string}): Promise<AppDTO> {
        const transaction = await this.db.getTransaction();
        try {
            const app = await this.appRepo.findById(params.id, transaction);
            if (!app) throw new AppFindError("App not found", { id: params.id });

            const isMatch = params.old_hashed_secret === app.hashed_secret!;
            if (!isMatch) throw new IncorrectAppSecretError("Secret is incorrect", { id: params.id });
            
            app.hashed_secret = params.new_hashed_secret, 10;
            const updated = await this.appRepo.update(params.id, { hashed_secret: app.hashed_secret }, transaction);
            
            await transaction.commit();
            return AppMapper.toAll(updated!);
        } catch (error) {
            await transaction.rollback();
            if (error instanceof AppFindError) throw error;
            if (error instanceof IncorrectAppSecretError) throw error;
            throw new AppUpdateError("Failed to change app secret", { id: params.id, cause: error });
        }
    }
}

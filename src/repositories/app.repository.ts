import { App } from "../models/postgres/App";
import { UserApp } from "../models/postgres/UserApp";
import { Transaction } from "sequelize";

export class AppRepository {
  public async create(appData: App, transaction?: Transaction): Promise<App> {
    return App.create(appData, { transaction });
  }

  public async findById(id: string, transaction?: Transaction): Promise<App | null> {
    return App.findByPk(id, { transaction });
  }

  public async findAll(filter?: Partial<App>, transaction?: Transaction): Promise<App[]> {
    return App.findAll({
      where: filter || {},
      transaction,
    });
  }

  public async update(id: string, data: Partial<App>, transaction?: Transaction): Promise<App | null> {
    const app = await this.findById(id, transaction);
    if (!app) return null;

    await app.update(data, { transaction });
    return app;
  }

  public async delete(id: string, transaction?: Transaction): Promise<boolean> {
    const deletedCount = await App.destroy({
      where: { id },
      transaction,
    });
    return deletedCount > 0;
  }

  public async findByName(name: string, transaction?: Transaction): Promise<App | null> {
    return App.findOne({ where: { name }, transaction });
  }

  public async createUserApp(user_id: string, app_id: string, transaction?: Transaction): Promise<UserApp> {
    return UserApp.create({ user_id, app_id } as any, { transaction });
  }
}
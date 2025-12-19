import { App } from "../models/postgres/App";


export interface AppDTO {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class AppMapper {
  static toAll(app: App): AppDTO {
    return {
      id: app.id,
      name: app.name,
      display_name: app.display_name,
      description: app.description,
      icon_url: app.icon_url,
      is_active: app.is_active,
      created_at: app.created_at,
      updated_at: app.updated_at,
    };
  }

  static toAllList(apps: App[]): AppDTO[] {
    return apps.map(this.toAll);
  }
}

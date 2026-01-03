import NotificationRepository from "../../repositories/notification.repository";
import { NotificationDocument } from "../../models/mongodb/NotificationDocument";

export class ListNotificationService {
  constructor(private repo = NotificationRepository) {}

  public async execute(userId: string, limit = 20, lastId?: string, appId?: string, deviceId?: string): Promise<{ items: NotificationDocument[]; nextCursor?: string }> {
    return this.repo.listNotifications(userId, limit, lastId, appId, deviceId);
  }
}

export default new ListNotificationService();

import NotificationRepository from "../../repositories/notification.repository";
import { NotificationDocument } from "../../models/mongodb/NotificationDocument";

export class UpdateNotificationService {
  constructor(private repo = NotificationRepository) {}

  public async execute(notificationId: string, data: Partial<NotificationDocument>): Promise<NotificationDocument | null> {
    return this.repo.updateNotification(notificationId, data);
  }
}

export default new UpdateNotificationService();

import NotificationRepository from "../../repositories/notification.repository";
import { NotificationDocument } from "../../models/mongodb/NotificationDocument";

export class InsertNotificationService {
  constructor(private repo = NotificationRepository) {}

  public async execute(data: Partial<NotificationDocument>): Promise<NotificationDocument> {
    return this.repo.insertNotification(data);
  }
}

export default new InsertNotificationService();

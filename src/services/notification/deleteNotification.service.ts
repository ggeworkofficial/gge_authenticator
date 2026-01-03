import NotificationRepository from "../../repositories/notification.repository";

export class DeleteNotificationService {
  constructor(private repo = NotificationRepository) {}

  public async execute(notificationId: string): Promise<boolean> {
    return this.repo.deleteNotification(notificationId);
  }
}

export default new DeleteNotificationService();

import NotificationRepository from "../../repositories/notification.repository";

export class GetUnreadCountService {
  constructor(private repo = NotificationRepository) {}

  public async execute(userId: string, appId?: string, deviceId?: string): Promise<number> {
    const doc = await this.repo.getUnreadCounter(userId, appId, deviceId);
    return doc ? doc.unreadCount : 0;
  }
}

export default new GetUnreadCountService();

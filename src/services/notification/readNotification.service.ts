import { NotificationNotFoundError } from "../../errors/notification.error";
import NotificationRepository from "../../repositories/notification.repository";

export class UpdateReadService {
  constructor(private repo = NotificationRepository) {}

  public async execute(notificationId: string, read: boolean): Promise<Boolean> {

    try {
      const res = await this.repo.updateRead(notificationId, read);
      if (!res) throw new NotificationNotFoundError(`Notification with id ${notificationId} not found or already read`);
      return res;
    } catch (err) {
        throw err;
    }

  }
}

export default new UpdateReadService();

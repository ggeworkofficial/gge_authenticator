import { NotificationDocument } from "../../models/mongodb/NotificationDocument";
import { NotificationRepository } from "../../repositories/notification.repository";
import { Observer } from "./observers/observer.interface";
import ListNotificationService from "./listNotification.service";
import UpdateReadService from "./readNotification.service";
import UpdateNotificationService from "./updateNotification.service";
import DeleteNotificationService from "./deleteNotification.service";
import GetUnreadCountService from "./getUnreadCount.service";
interface Subject {
    addObserver(observer: Observer): void;
    removeObserver(observer: Observer): void;
    notifyObservers(data: any): void;
    clearObservers(): void;
}

export class NotificationService implements Subject {
    private observers: Observer[] = [];
    private notificationRepo: NotificationRepository = new NotificationRepository();
    private changeStream: any;

    constructor(
        private listSvc = ListNotificationService,
        private updateReadSvc = UpdateReadService,
        private updateSvc = UpdateNotificationService,
        private deleteSvc = DeleteNotificationService,
        private unreadCountSvc = GetUnreadCountService
    ) {}

    addObserver(observer: Observer): void {
         if (!this.observers.includes(observer)) this.observers.push(observer);
         console.log("Observer added. Total observers:", this.observers.length);
    }

    removeObserver(observer: Observer): void {
        if (this.observers.includes(observer)) this.observers = this.observers.filter(obs => obs !== observer);
    }

    clearObservers(): void {
        this.observers = [];
    }

    notifyObservers(data: any): void {
        this.observers.forEach(observer => observer.update(data));
    }

    async insertNotification(data: Partial<NotificationDocument>): Promise<NotificationDocument> {
        const inserted = await this.notificationRepo.insertNotification(data);
        return inserted; 
    }

    async startWatching(): Promise<void> {
        this.changeStream = await this.notificationRepo.watchInserts((notification) => {
            this.notifyObservers(notification);
        });
    }

    stopWatching(): void {
        if (this.changeStream) this.notificationRepo.closeChangeStream(this.changeStream);
    }

    public async listNotifications(userId: string, limit = 20, lastId?: string, appId?: string, deviceId?: string) {
        const result = await this.listSvc.execute(userId, limit, lastId, appId, deviceId);
        const items = result.items || [];

        return { items, nextCursor: result.nextCursor };
    }

    public async updateRead(notificationId: string, read: boolean) {
        return this.updateReadSvc.execute(notificationId, read);
    }

    public async updateNotification(notificationId: string, data: Partial<NotificationDocument>) {
        return this.updateSvc.execute(notificationId, data);
    }

    public async deleteNotification(notificationId: string) {
        return this.deleteSvc.execute(notificationId);
    }

    public async getUnreadCount(userId: string, appId?: string, deviceId?: string) {
        return this.unreadCountSvc.execute(userId, appId, deviceId);
    }
}
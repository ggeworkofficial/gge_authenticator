import { NotificationDocument } from "../../models/mongodb/NotificationDocument";
import { NotificationRepository } from "../../repositories/notification.repository";
import { Observer } from "./observers/observer.interface";
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

    addObserver(observer: Observer): void {
        this.observers.push(observer);
    }

    removeObserver(observer: Observer): void {
        this.observers = this.observers.filter(obs => obs !== observer);
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

    startWatching(): void {
        this.changeStream = this.notificationRepo.watchInserts((notification) => {
            this.notifyObservers(notification);
        });
    }

    stopWatching(): void {
        if (this.changeStream) this.notificationRepo.closeChangeStream(this.changeStream);
    }
}
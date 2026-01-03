import { MainError } from "./main.error";

export class NotificationError extends MainError {
  constructor(message = "Notification error", details?: any) {
    super(message, 400, details);
    this.name = "NotificationError";
  }
}

export class NotificationNotFoundError extends MainError {
  constructor(message = "Notification not found", details?: any) {
    super(message, 404, details);
    this.name = "NotificationNotFoundError";
  }
}

export class InvalidNotificationIdError extends MainError {
  constructor(message = "Invalid notification id", details?: any) {
    super(message, 400, details);
    this.name = "InvalidNotificationIdError";
  }
}

export class NotificationRepositoryError extends MainError {
  constructor(message = "Notification repository error", details?: any) {
    super(message, 500, details);
    this.name = "NotificationRepositoryError";
  }
}

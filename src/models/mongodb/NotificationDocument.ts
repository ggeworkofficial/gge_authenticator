import { MongoDB } from "../../connections/mongodb";

const mongodb = MongoDB.getInstance();

export interface NotificationDocument {
    _id?: string;                  
    userId: string;                
    type: "info" | "warning" | "error" | "success" | "2FA" | string; 
    title: string;                 
    message: string;              
    metadata?: Record<string, any>; 
    read: boolean;                 
    delivered: boolean;           
    createdAt: Date;               
    expiresAt?: Date;              
};

export const Notification = mongodb.getDB().collection<NotificationDocument>("notifications");

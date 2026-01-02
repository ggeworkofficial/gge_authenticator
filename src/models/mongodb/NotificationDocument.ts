import { ObjectId } from "mongodb";
import { MongoDB } from "../../connections/mongodb";

const mongodb = MongoDB.getInstance();

export interface NotificationDocument {
    _id?: ObjectId;                  
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


export function getNotificationCollection() {
    return mongodb.getDB().collection<NotificationDocument>("notifications");
}
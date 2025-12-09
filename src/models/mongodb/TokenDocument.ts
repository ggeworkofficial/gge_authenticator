import { MongoDB } from "../../connections/mongodb";

const mongodb = MongoDB.getInstance();

export interface TokenDocument {
    _id?: string;                 // Mongo adds this automatically
    userId: string;
    appId: string;
    clientType: "browser" | "mobile" | "desktop";
    deviceId: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
    createdAt: Date;
    expiresAt: Date;
};

export const Token = mongodb.getDB().collection<TokenDocument>("tokens");
import { NextFunction, Request, Response } from "express";
import { AppService } from "../services/app.service";
import { UserApp } from "../models/postgres/UserApp";


export const appCreateController = async (req: Request, res: Response, next: NextFunction) => {
    const appData = req.body;

    try {
        const appService = new AppService();
        const newApp = await appService.createApp(appData);
        res.status(201).json({ newApp});
    } catch (error) {
        next(error);
    }
}

export const appListController = async (req: Request, res: Response, next: NextFunction) => {
    const filter = req.query || {};
    try {
        const appService = new AppService();
        const apps = await appService.getApps(filter as any);
        res.status(200).json({ apps });
    } catch (error) {
        next(error);
    }
};

export const appGetController = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const appService = new AppService();
        const app = await appService.getAppById(id);
        res.status(200).json({ app });
    } catch (error) {
        next(error);
    }
};

export const appUpdateController = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const appService = new AppService();
        const updated = await appService.updateApp(id, data);
        res.status(200).json({ updated });
    } catch (error) {
        next(error);
    }
};

export const appDeleteController = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const appService = new AppService();
        await appService.deleteApp(id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const appCreateUserController = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id, app_id } = req.body;
    try {
        const appService = new AppService();
        const userApp: UserApp = await appService.createUserApp(user_id, app_id);
        res.status(201).json({ userApp });
    } catch (error) {
        next(error);
    }
};
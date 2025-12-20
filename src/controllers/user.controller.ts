import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/user.service";
import { returnCodeChallange } from "./auth.controller";
import { AuthError } from "../errors/auth.error";

export const userCreateController = async (req: Request, res: Response, next: NextFunction) => {
  const userData = req.body;

  const code_challange = req.auth?.code_challenger;
  try {
    const service = new UserService();
    const user = await service.createUser(userData);
    const codeChallangeSecret = await returnCodeChallange(null, user, code_challange);
    res.status(201).json(codeChallangeSecret ?? user);
  } catch (error) {
    next(error);
  }
};

export const userListController = async (req: Request, res: Response, next: NextFunction) => {
  const filter = req.query || {};

  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  
  try {
    const service = new UserService();
    const users = await service.getUsers(filter as any);
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

export const userGetController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  try {
    const service = new UserService();
    const user = await service.getUserById(id);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const userUpdateController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const data = req.body;

  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  try {
    const service = new UserService();
    const updated = await service.updateUser(id, data);
    res.status(200).json({ updated });
  } catch (error) {
    next(error);
  }
};

export const userDeleteController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!req.auth) throw new AuthError("Authentication was not provided", 401);
  try {
    const service = new UserService();
    await service.deleteUser(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

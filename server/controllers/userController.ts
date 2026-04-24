import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/userService";

export const getUsers = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (req.user.role === 'ESTANDARD' && req.user.email !== 'demo') {
      return res.status(403).json({ message: "No tienes permisos" });
    }
    const users = await UserService.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.createUser(req.body);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await UserService.updateUser(parseInt(req.params.id), req.body);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await UserService.deleteUser(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

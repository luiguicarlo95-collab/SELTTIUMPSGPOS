import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboardService";

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await DashboardService.getStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    next(error);
  }
};

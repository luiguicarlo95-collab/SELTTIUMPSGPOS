import { Request, Response, NextFunction } from "express";
import { EntityService } from "../services/entityService";

// CATEGORIES
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await EntityService.getAllCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await EntityService.createCategory(req.body);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await EntityService.updateCategory(parseInt(req.params.id), req.body);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await EntityService.deleteCategory(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// SUPPLIERS
export const getSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const suppliers = await EntityService.getAllSuppliers();
    res.json(suppliers);
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await EntityService.createSupplier(req.body);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await EntityService.updateSupplier(parseInt(req.params.id), req.body);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await EntityService.deleteSupplier(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// CUSTOMERS
export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await EntityService.getAllCustomers();
    res.json(customers);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await EntityService.createCustomer(req.body);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await EntityService.updateCustomer(parseInt(req.params.id), req.body);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await EntityService.deleteCustomer(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/productService";

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await ProductService.getAllProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const getProductItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await ProductService.getProductItems(parseInt(req.params.id));
    res.json(items);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProductService.createProduct(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProductService.updateProduct(parseInt(req.params.id), req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProductService.deleteProduct(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getBySerial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProductService.getBySerial(req.params.serial);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

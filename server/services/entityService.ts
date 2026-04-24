
import { CategoryRepository, SupplierRepository, CustomerRepository } from "../repositories/entityRepository";
import { query } from "../config/db";
import db from "../config/db";
import { ApiError } from "../middleware/errorHandler";

export class EntityService {
  // Categories
  static async getAllCategories() {
    return CategoryRepository.findAll();
  }

  static async createCategory(data: any) {
    return CategoryRepository.create(data);
  }

  static async updateCategory(id: number, data: any) {
    return CategoryRepository.update(id, data);
  }

  static async deleteCategory(id: number) {
    if (id === 0) throw new ApiError(400, "No se puede eliminar la categoría 'Varios'.");
    
    const transaction = db.transaction(() => {
      query.run("UPDATE products SET category_id = 0 WHERE category_id = ?", id);
      CategoryRepository.delete(id);
    });
    return transaction();
  }

  // Suppliers
  static async getAllSuppliers() {
    return SupplierRepository.findAll();
  }

  static async createSupplier(data: any) {
    return SupplierRepository.create(data);
  }

  static async updateSupplier(id: number, data: any) {
    return SupplierRepository.update(id, data);
  }

  static async deleteSupplier(id: number) {
    try {
      return SupplierRepository.delete(id);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new ApiError(400, "No se puede eliminar el proveedor porque tiene productos asociados.");
      }
      throw error;
    }
  }

  // Customers
  static async getAllCustomers() {
    return CustomerRepository.findAll();
  }

  static async createCustomer(data: any) {
    try {
      return CustomerRepository.create(data);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new ApiError(400, "El DNI ya está registrado");
      }
      throw error;
    }
  }

  static async updateCustomer(id: number, data: any) {
    try {
      return CustomerRepository.update(id, data);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new ApiError(400, "El DNI ya está registrado");
      }
      throw error;
    }
  }

  static async deleteCustomer(id: number) {
    return CustomerRepository.delete(id);
  }
}

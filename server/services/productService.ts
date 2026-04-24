
import { ProductRepository, IProduct } from "../repositories/productRepository";
import { query } from "../config/db";
import db from "../config/db";
import { ApiError } from "../middleware/errorHandler";

export class ProductService {
  static async getAllProducts() {
    const products = ProductRepository.findAll() as any[];
    return products.map(p => {
      let stock = p.has_serials ? p.dynamic_stock : p.stock;
      return { ...p, stock };
    });
  }

  static async getProductItems(productId: number) {
    return ProductRepository.findItemsByProductId(productId);
  }

  static async createProduct(data: any) {
    const { category_id, has_serials, serial_numbers } = data;
    
    // Generate code
    const category = query.get("SELECT prefix FROM categories WHERE id = ?", category_id) as any;
    const prefix = category ? category.prefix : "PR";
    const lastProduct = ProductRepository.findLastByCategoryPrefix(prefix) as any;
    let nextNum = 1;
    if (lastProduct && lastProduct.code) {
      const numericPart = lastProduct.code.substring(prefix.length);
      const lastNum = parseInt(numericPart);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const code = `${prefix}${nextNum.toString().padStart(3, '0')}`;

    const transaction = db.transaction(() => {
      if (has_serials && Array.isArray(serial_numbers)) {
        for (const sn of serial_numbers) {
          if (sn && sn.trim()) {
            const existing = query.get("SELECT serial_number FROM product_items WHERE serial_number = ?", sn.trim());
            if (existing) throw new ApiError(400, `El número de serie '${sn.trim()}' ya está registrado.`);
          }
        }
      }

      const productData: IProduct = {
        ...data,
        code,
        stock: has_serials ? 0 : data.stock,
        has_serials: has_serials ? 1 : 0
      };

      const info = ProductRepository.create(productData);
      const productId = info.lastInsertRowid as number;

      if (has_serials && Array.isArray(serial_numbers)) {
        for (const sn of serial_numbers) {
          if (sn && sn.trim()) ProductRepository.addSerialItem(productId, sn.trim());
        }
      }
      
      return { id: productId, code };
    });

    return transaction();
  }

  static async updateProduct(id: number, data: any) {
    const { category_id, has_serials, serial_numbers } = data;
    const currentProduct = ProductRepository.findById(id) as any;
    if (!currentProduct) throw new ApiError(404, "Producto no encontrado");

    let code = currentProduct.code;

    // Recalculate code if category changed
    if (currentProduct.category_id !== category_id) {
      const category = query.get("SELECT prefix FROM categories WHERE id = ?", category_id) as any;
      const prefix = category ? category.prefix : "PR";
      const lastProduct = ProductRepository.findLastByCategoryPrefix(prefix) as any;
      let nextNum = 1;
      if (lastProduct && lastProduct.code) {
        const numericPart = lastProduct.code.substring(prefix.length);
        const lastNum = parseInt(numericPart);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
      code = `${prefix}${nextNum.toString().padStart(3, '0')}`;
    }

    const transaction = db.transaction(() => {
      if (has_serials && Array.isArray(serial_numbers)) {
        for (const sn of serial_numbers) {
          if (sn && sn.trim()) {
            const existing = query.get("SELECT product_id FROM product_items WHERE serial_number = ?", sn.trim()) as any;
            if (existing && existing.product_id !== id) {
              throw new ApiError(400, `El número de serie '${sn.trim()}' ya está registrado en otro producto.`);
            }
          }
        }
      }

      const updateData: Partial<IProduct> = {
        ...data,
        code,
        stock: has_serials ? 0 : data.stock,
        has_serials: has_serials ? 1 : 0
      };

      ProductRepository.update(id, updateData);

      if (has_serials && Array.isArray(serial_numbers)) {
        const currentItems = ProductRepository.findItemsByProductId(id) as any[];
        const currentSerials = currentItems.map(i => i.serial_number);
        const newSerials = serial_numbers.map((s: string) => s.trim()).filter(s => s !== "");
        
        const toDelete = currentSerials.filter(s => !newSerials.includes(s));
        if (toDelete.length > 0) {
          for (const sn of toDelete) ProductRepository.deleteSerialItem(id, sn);
        }
        
        const toAdd = newSerials.filter(s => !currentSerials.includes(s));
        for (const sn of toAdd) ProductRepository.addSerialItem(id, sn);
      } else if (!has_serials) {
        ProductRepository.deleteAllSerialItems(id);
      }
    });

    transaction();
    return { success: true, code };
  }

  static async deleteProduct(id: number) {
    try {
      ProductRepository.delete(id);
      return { success: true };
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new ApiError(400, "No se puede eliminar el producto porque tiene registros asociados.");
      }
      throw error;
    }
  }

  static async getBySerial(serial: string) {
    const item = ProductRepository.findItemBySerial(serial) as any;
    if (!item) throw new ApiError(404, "Número de serie no encontrado o ya vendido");
    
    const stock = item.has_serials ? item.dynamic_stock : item.stock;
    return { ...item, stock };
  }
}

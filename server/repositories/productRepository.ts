
import { query } from "../config/db";
import db from "../config/db";

export interface IProduct {
  id?: number;
  code: string;
  name: string;
  image?: string;
  description?: string;
  category_id: number;
  purchase_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  unit: string;
  brand?: string;
  supplier_id?: number;
  has_serials: number;
  parent_id?: number;
  units_per_package?: number;
}

export class ProductRepository {
  static findAll() {
    return query.all(`
      SELECT p.*, c.name as category_name,
      (SELECT COUNT(*) FROM product_items WHERE product_id = p.id AND status = 'available') as dynamic_stock
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `);
  }

  static findById(id: number) {
    return query.get("SELECT * FROM products WHERE id = ?", id);
  }

  static findByCode(code: string) {
    return query.get("SELECT * FROM products WHERE code = ?", code);
  }

  static findLastByCategoryPrefix(prefix: string) {
    return query.get("SELECT code FROM products WHERE code LIKE ? ORDER BY code DESC LIMIT 1", `${prefix}%`);
  }

  static create(product: IProduct) {
    const { code, name, category_id, purchase_price, sale_price, stock, min_stock, unit, brand, supplier_id, image, has_serials } = product;
    return query.run(`
      INSERT INTO products (code, name, category_id, purchase_price, sale_price, stock, min_stock, unit, brand, supplier_id, image, has_serials)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, code, name, category_id, purchase_price, sale_price, stock, min_stock, unit, brand, supplier_id, image, has_serials);
  }

  static update(id: number, product: Partial<IProduct>) {
    const fields = Object.keys(product).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(product), id];
    return query.run(`UPDATE products SET ${fields} WHERE id = ?`, ...values);
  }

  static delete(id: number) {
    return query.run("DELETE FROM products WHERE id = ?", id);
  }

  // Serial items
  static findItemsByProductId(productId: number) {
    return query.all("SELECT * FROM product_items WHERE product_id = ?", productId);
  }

  static findItemBySerial(serial: string) {
    return query.get(`
      SELECT p.*, c.name as category_name, pi.serial_number,
      (SELECT COUNT(*) FROM product_items WHERE product_id = p.id AND status = 'available') as dynamic_stock
      FROM product_items pi
      JOIN products p ON pi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pi.serial_number = ? AND pi.status = 'available'
    `, serial);
  }

  static addSerialItem(productId: number, serial: string) {
    return query.run("INSERT INTO product_items (product_id, serial_number) VALUES (?, ?)", productId, serial);
  }

  static deleteSerialItem(productId: number, serial: string) {
    return query.run("DELETE FROM product_items WHERE product_id = ? AND serial_number = ?", productId, serial);
  }

  static deleteAllSerialItems(productId: number) {
    return query.run("DELETE FROM product_items WHERE product_id = ?", productId);
  }
}

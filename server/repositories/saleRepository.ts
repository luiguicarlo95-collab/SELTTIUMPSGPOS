
import { query } from "../config/db";

export class SaleRepository {
  static findAll(start?: string, end?: string, paymentMethod?: string) {
    let sql = `
      SELECT s.*, c.first_name, c.last_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (start && end) {
      sql += " AND s.created_at >= ? AND s.created_at <= ?";
      params.push(`${start} 00:00:00`, `${end} 23:59:59`);
    }

    if (paymentMethod && paymentMethod !== 'all') {
      sql += " AND s.payment_method LIKE ?";
      params.push(`%${paymentMethod}%`);
    }
    
    sql += " ORDER BY s.created_at DESC";
    return query.all(sql, ...params);
  }

  static findById(id: number) {
    return query.get(`
      SELECT s.*, c.first_name, c.last_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
    `, id);
  }

  static findItemsBySaleId(saleId: number) {
    return query.all(`
      SELECT si.*, COALESCE(p.name, si.custom_name) as product_name, p.code as product_code
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, saleId);
  }

  static create(sale: any) {
    const { customer_id, total, subtotal, tax, payment_method, warranty, profit, payment_status, remaining_balance } = sale;
    return query.run(`
      INSERT INTO sales (customer_id, total, subtotal, tax, payment_method, warranty, profit, payment_status, remaining_balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, customer_id, total, subtotal, tax, payment_method, warranty, profit, payment_status, remaining_balance);
  }

  static createItem(item: any) {
    const { sale_id, product_id, quantity, price, subtotal, serial_numbers, custom_name } = item;
    return query.run(`
      INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal, serial_numbers, custom_name)
      VALUES (?, ?, ?, ?, ROUND(?, 2), ?, ?)
    `, sale_id, product_id, quantity, price, subtotal, serial_numbers, custom_name);
  }
}

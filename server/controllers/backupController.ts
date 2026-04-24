import { Request, Response } from "express";
import { query } from "../config/db";
import db from "../config/db";

export const exportAll = (req: Request, res: Response) => {
  try {
    const data = {
      products: query.all('SELECT * FROM products'),
      categories: query.all('SELECT * FROM categories'),
      suppliers: query.all('SELECT * FROM suppliers'),
      customers: query.all('SELECT * FROM customers'),
      sales: query.all('SELECT * FROM sales'),
      sale_items: query.all('SELECT * FROM sale_items'),
      product_items: query.all('SELECT * FROM product_items'),
      cash_flow: query.all('SELECT * FROM cash_flow'),
      settings: query.all('SELECT * FROM settings')
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const importAll = (req: Request, res: Response) => {
  const { categories, suppliers, customers, products, sales, sale_items, product_items } = req.body;
  try {
    const transaction = db.transaction(() => {
      query.run("DELETE FROM sale_items");
      query.run("DELETE FROM sales");
      query.run("DELETE FROM product_items");
      query.run("DELETE FROM products");
      query.run("DELETE FROM customers");
      query.run("DELETE FROM suppliers");
      query.run("DELETE FROM categories");

      if (Array.isArray(categories)) {
        for (const item of categories) query.run("INSERT INTO categories (id, name, prefix) VALUES (?, ?, ?)", item.id, item.name, item.prefix);
      }

      if (Array.isArray(suppliers)) {
        const stmt = db.prepare("INSERT INTO suppliers (id, name, company, tax_id, phone, email, address, city, country, contact_person, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        for (const item of suppliers) stmt.run(item.id, item.name, item.company, item.tax_id, item.phone, item.email, item.address, item.city, item.country, item.contact_person, item.notes);
      }

      if (Array.isArray(customers)) {
        const stmt = db.prepare("INSERT INTO customers (id, first_name, last_name, dni, phone, email, address) VALUES (?, ?, ?, ?, ?, ?, ?)");
        for (const item of customers) stmt.run(item.id, item.first_name, item.last_name, item.dni, item.phone, item.email, item.address);
      }

      if (Array.isArray(products)) {
        const stmt = db.prepare("INSERT INTO products (id, code, name, category_id, purchase_price, sale_price, stock, min_stock, unit, brand, supplier_id, description, image, has_serials, parent_id, units_per_package) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        for (const item of products) stmt.run(item.id, item.code, item.name, item.category_id, item.purchase_price, item.sale_price, item.stock, item.min_stock, item.unit, item.brand, item.supplier_id, item.description, item.image || null, item.has_serials || 0, item.parent_id || null, item.units_per_package || 1);
      }

      if (Array.isArray(sales)) {
        const stmt = db.prepare("INSERT INTO sales (id, customer_id, total, subtotal, tax, payment_method, warranty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        for (const item of sales) stmt.run(item.id, item.customer_id, item.total, item.subtotal, item.tax, item.payment_method, item.warranty, item.created_at);
      }

      if (Array.isArray(sale_items)) {
        const stmt = db.prepare("INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)");
        for (const item of sale_items) stmt.run(item.id, item.sale_id, item.product_id, item.quantity, item.price);
      }

      if (Array.isArray(product_items)) {
        const stmt = db.prepare("INSERT INTO product_items (id, product_id, serial_number, status, sale_id, created_at) VALUES (?, ?, ?, ?, ?, ?)");
        for (const item of product_items) stmt.run(item.id, item.product_id, item.serial_number, item.status, item.sale_id, item.created_at);
      }
    });

    transaction();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

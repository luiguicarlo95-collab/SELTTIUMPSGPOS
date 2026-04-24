
import { query } from "../config/db";

export class CategoryRepository {
  static findAll() {
    return query.all("SELECT * FROM categories");
  }

  static findById(id: number) {
    return query.get("SELECT * FROM categories WHERE id = ?", id);
  }

  static findByPrefix(prefix: string) {
    return query.get("SELECT * FROM categories WHERE prefix = ?", prefix);
  }

  static create(data: { name: string, prefix: string, description: string }) {
    return query.run("INSERT INTO categories (name, prefix, description) VALUES (?, ?, ?)", data.name, data.prefix, data.description);
  }

  static update(id: number, data: { name: string, prefix: string, description: string }) {
    return query.run("UPDATE categories SET name = ?, prefix = ?, description = ? WHERE id = ?", data.name, data.prefix, data.description, id);
  }

  static delete(id: number) {
    return query.run("DELETE FROM categories WHERE id = ?", id);
  }
}

export class SupplierRepository {
  static findAll() {
    return query.all("SELECT * FROM suppliers");
  }

  static create(data: any) {
    const { name, company, tax_id, phone, email, address, city, country, contact_person, notes } = data;
    return query.run(`
      INSERT INTO suppliers (name, company, tax_id, phone, email, address, city, country, contact_person, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, name, company, tax_id, phone, email, address, city, country, contact_person, notes);
  }

  static update(id: number, data: any) {
    const { name, company, tax_id, phone, email, address, city, country, contact_person, notes } = data;
    return query.run(`
      UPDATE suppliers 
      SET name = ?, company = ?, tax_id = ?, phone = ?, email = ?, address = ?, city = ?, country = ?, contact_person = ?, notes = ?
      WHERE id = ?
    `, name, company, tax_id, phone, email, address, city, country, contact_person, notes, id);
  }

  static delete(id: number) {
    return query.run("DELETE FROM suppliers WHERE id = ?", id);
  }
}

export class CustomerRepository {
  static findAll() {
    return query.all("SELECT * FROM customers");
  }

  static findByDni(dni: string) {
    return query.get("SELECT * FROM customers WHERE dni = ?", dni);
  }

  static create(data: any) {
    const { first_name, last_name, dni, phone, email, address } = data;
    return query.run(`
      INSERT INTO customers (first_name, last_name, dni, phone, email, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `, first_name, last_name, dni, phone, email, address);
  }

  static update(id: number, data: any) {
    const { first_name, last_name, dni, phone, email, address } = data;
    return query.run(`
      UPDATE customers 
      SET first_name = ?, last_name = ?, dni = ?, phone = ?, email = ?, address = ?
      WHERE id = ?
    `, first_name, last_name, dni, phone, email, address, id);
  }

  static delete(id: number) {
    return query.run("DELETE FROM customers WHERE id = ?", id);
  }
}

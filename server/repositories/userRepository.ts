
import { query } from "../config/db";

export class UserRepository {
  static findAll() {
    return query.all("SELECT id, email, name, role, created_at FROM users");
  }

  static findById(id: number) {
    return query.get("SELECT * FROM users WHERE id = ?", id);
  }

  static findByEmail(email: string) {
    return query.get("SELECT * FROM users WHERE email = ?", email);
  }

  static count() {
    const result = query.get("SELECT COUNT(*) as count FROM users") as { count: number };
    return result.count;
  }

  static create(data: any) {
    const { email, password, name, role } = data;
    return query.run("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)", email, password, name, role);
  }

  static update(id: number, data: any) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    return query.run(`UPDATE users SET ${fields} WHERE id = ?`, ...values);
  }

  static delete(id: number) {
    return query.run("DELETE FROM users WHERE id = ?", id);
  }
}

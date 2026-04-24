import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db";
import { getJWTSecret } from "../middleware/auth";

export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = query.get("SELECT * FROM users WHERE email = ?", email) as any;

  if (user && bcrypt.compareSync(password, user.password)) {
    if (user.email === 'demo') {
      const demoStart = query.get("SELECT value FROM settings WHERE key = 'demo_start_date'") as any;
      if (!demoStart || !demoStart.value) {
        query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "demo_start_date", new Date().toISOString());
      }
    }

    const userData = { id: user.id, email: user.email, name: user.name, role: user.role };
    const token = jwt.sign(userData, getJWTSecret(), { expiresIn: '24h' });
    res.json({ success: true, user: userData, token });
  } else {
    res.status(401).json({ success: false, message: "Credenciales incorrectas" });
  }
};

export const register = (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const userCount = query.get("SELECT COUNT(*) as count FROM users") as { count: number };
  
  if (userCount.count >= 1) {
    return res.status(400).json({ success: false, message: "Ya existe un usuario registrado." });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query.run("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)", email, hashedPassword, name, 'ESTANDARD');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al registrar usuario" });
  }
};

export const getMe = (req: any, res: Response) => {
  res.json({ success: true, user: req.user });
};

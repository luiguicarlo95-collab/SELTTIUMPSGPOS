import jwt from "jsonwebtoken";
import { query } from "../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "psg-pos-secret-2026-secure-key";

export const verifyToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    // Check demo expiry
    if (user.email === 'demo') {
      const demoStart = query.get("SELECT value FROM settings WHERE key = 'demo_start_date'") as any;
      const demoDuration = query.get("SELECT value FROM settings WHERE key = 'demo_duration_hours'") as any;
      
      if (demoStart && demoStart.value) {
        const startDate = new Date(demoStart.value);
        const now = new Date();
        const diffMs = now.getTime() - startDate.getTime();
        const maxHours = parseFloat(demoDuration?.value || '168');
        
        if (diffMs > maxHours * 60 * 60 * 1000) {
          return res.status(400).json({ message: `Tu período de prueba demo ha expirado (${maxHours} horas).` });
        }
      }
    }

    req.user = user;
    next();
  });
};

export const checkRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "No tienes permisos para esta acción" });
    }
    next();
  };
};

export const isDemoBlocked = (req: any, res: any, next: any) => {
  if (req.user?.email === 'demo') {
    return res.status(400).json({ success: false, message: "El usuario demo no tiene permisos para esta acción en el servidor." });
  }
  next();
};

export const getJWTSecret = () => JWT_SECRET;

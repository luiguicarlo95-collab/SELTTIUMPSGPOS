import { Request, Response } from "express";
import { query } from "../config/db";
import db from "../config/db";

export const activateDemo = (req: Request, res: Response) => {
  const now = new Date().toISOString();
  query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "installation_date", now);
  query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "activation_status", "demo");
  res.json({ success: true, installation_date: now });
};

export const activateLicense = (req: Request, res: Response) => {
  const { type, durationMonths } = req.body;
  let expiryDate = type === 'infinite' ? "9999-12-31" : "";
  let licenseType = type;

  if (type === 'demo_7') {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    expiryDate = date.toISOString();
  } else if (type !== 'infinite') {
    const date = new Date();
    date.setMonth(date.getMonth() + durationMonths);
    expiryDate = date.toISOString();
    licenseType = `${durationMonths}_months`;
  }

  const transaction = db.transaction(() => {
    query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "activation_status", "activated");
    query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "license_expiry", expiryDate);
    query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "license_type", licenseType);
    if (type === 'infinite') query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "unlimited_users", "1");
  });
  
  transaction();
  res.json({ success: true, expiryDate, licenseType });
};

export const resetLicense = (req: Request, res: Response) => {
  const transaction = db.transaction(() => {
    query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "activation_status", "demo");
    query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "license_type", "demo");
    query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "license_expiry", "");
    query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "installation_date", "");
    query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "demo_start_date", "");
    query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "unlimited_users", "0");
  });
  transaction();
  res.json({ success: true });
};

export const resetDemo = (req: Request, res: Response) => {
  query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "demo_start_date", "");
  res.json({ success: true });
};

export const activateSystem = (req: Request, res: Response) => {
  const { code } = req.body;
  if (code === "NEXUS-POS-2024-PRO") {
    query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", "activation_status", "activated");
    res.json({ success: true, message: "Sistema activado correctamente" });
  } else {
    res.status(400).json({ success: false, message: "Código de activación inválido" });
  }
};

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database("pos.db");
db.pragma('foreign_keys = ON');

export const query = {
  all: (sql: string, ...params: any[]) => db.prepare(sql).all(...params),
  get: (sql: string, ...params: any[]) => db.prepare(sql).get(...params),
  run: (sql: string, ...params: any[]) => db.prepare(sql).run(...params),
};

export const initDB = () => {
  // Initialize Database Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      prefix TEXT NOT NULL UNIQUE,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      tax_id TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      contact_person TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT,
      dni TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      image TEXT,
      description TEXT,
      category_id INTEGER,
      purchase_price REAL,
      sale_price REAL,
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 5,
      unit TEXT DEFAULT 'unidad',
      brand TEXT,
      supplier_id INTEGER,
      status TEXT DEFAULT 'active',
      has_serials INTEGER DEFAULT 0,
      parent_id INTEGER,
      units_per_package INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (parent_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS product_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      serial_number TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'available',
      sale_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total REAL NOT NULL,
      subtotal REAL,
      tax REAL,
      payment_method TEXT,
      warranty TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      price REAL,
      subtotal REAL,
      serial_numbers TEXT,
      custom_name TEXT,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total REAL NOT NULL,
      subtotal REAL,
      tax REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      price REAL,
      subtotal REAL,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS cash_flow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      source_type TEXT,
      source_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Helper for migrations
  const safeExec = (sql: string) => {
    try {
      db.exec(sql);
    } catch (e) {
      // Ignore errors
    }
  };

  safeExec("ALTER TABLE sale_items ADD COLUMN serial_numbers TEXT;");
  safeExec("ALTER TABLE sales ADD COLUMN warranty TEXT;");
  safeExec("ALTER TABLE sales ADD COLUMN subtotal REAL;");
  safeExec("ALTER TABLE sales ADD COLUMN tax REAL;");
  safeExec("ALTER TABLE sales ADD COLUMN payment_method TEXT;");
  safeExec("ALTER TABLE sale_items ADD COLUMN custom_name TEXT;");
  safeExec("ALTER TABLE quotations ADD COLUMN subtotal REAL;");
  safeExec("ALTER TABLE quotations ADD COLUMN tax REAL;");
  safeExec("ALTER TABLE customers ADD COLUMN dni TEXT UNIQUE;");
  safeExec("ALTER TABLE products ADD COLUMN parent_id INTEGER;");
  safeExec("ALTER TABLE products ADD COLUMN units_per_package INTEGER DEFAULT 1;");
  safeExec("ALTER TABLE products ADD COLUMN has_serials INTEGER DEFAULT 0;");
  safeExec("ALTER TABLE customers ADD COLUMN points INTEGER DEFAULT 0;");
  safeExec("ALTER TABLE customers ADD COLUMN balance REAL DEFAULT 0;");
  safeExec("ALTER TABLE sales ADD COLUMN profit REAL DEFAULT 0;");
  safeExec("ALTER TABLE sales ADD COLUMN payment_status TEXT DEFAULT 'paid';");
  safeExec("ALTER TABLE sales ADD COLUMN remaining_balance REAL DEFAULT 0;");

  // Create table for customer payments
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      sale_id INTEGER,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      reference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );
  `);

  // Seed generic category and product
  db.prepare("INSERT OR IGNORE INTO categories (id, name, prefix, description) VALUES (0, 'Varios', 'VR', 'Productos no categorizados')").run();
  db.prepare("INSERT OR IGNORE INTO products (id, code, name, category_id, sale_price, stock, min_stock, status) VALUES (0, 'GENERIC', 'Producto Varios', 0, 0, 999999, 0, 'active')").run();

  // Settings seeding logic
  const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
  if (settingsCount.count === 0) {
    const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
    insertSetting.run("business_name", "Mi Tienda de Abarrotes");
    insertSetting.run("address", "Calle Principal 123");
    insertSetting.run("phone", "987654321");
    insertSetting.run("email", "contacto@mitienda.com");
    insertSetting.run("currency", "S/");
    insertSetting.run("ticket_message", "¡Gracias por su compra!");
    insertSetting.run("installation_date", "");
    insertSetting.run("activation_status", "demo");
    insertSetting.run("demo_start_date", new Date().toISOString());
    insertSetting.run("theme_mode", "light");
    insertSetting.run("primary_color", "#22c55e");
    insertSetting.run("user_name", "Admin Usuario");
    insertSetting.run("user_role", "Administrador");
    insertSetting.run("user_avatar", "https://picsum.photos/seed/admin/100/100");
    insertSetting.run("ticket_size", "80mm");
    insertSetting.run("ticket_font_family", "monospace");
    insertSetting.run("ticket_font_bold", "0");
    insertSetting.run("ticket_font_italic", "0");
    insertSetting.run("demo_voucher_limit", "10");
    insertSetting.run("demo_duration_hours", "168");
  } else {
    const checkSetting = db.prepare("SELECT COUNT(*) as count FROM settings WHERE key = ?");
    const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
    
    const defaultSettings: Record<string, string> = {
      "installation_date": "",
      "activation_status": "demo",
      "demo_start_date": new Date().toISOString(),
      "theme_mode": "light",
      "primary_color": "#22c55e",
      "ticket_size": "80mm",
      "user_name": "Admin Usuario",
      "user_role": "Administrador",
      "user_avatar": "https://picsum.photos/seed/admin/100/100",
      "business_logo": "",
      "ticket_font_family": "monospace",
      "ticket_font_bold": "0",
      "ticket_font_italic": "0",
      "demo_voucher_limit": "10",
      "demo_duration_hours": "168",
      "license_expiry": "",
      "license_type": "infinite",
      "unlimited_users": "0"
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      if ((checkSetting.get(key) as any).count === 0) {
        insertSetting.run(key, value);
      }
    }
    
    // Force some overrides if needed
    db.prepare("UPDATE settings SET value = '168' WHERE key = 'demo_duration_hours'").run();
    db.prepare("UPDATE settings SET value = 'light' WHERE key = 'theme_mode'").run();
  }

  // Seed categories
  const categories = [
    ["Bebidas", "BD", "Aguas, gaseosas, jugos, energizantes y bebidas refrescantes."],
    ["Lácteos", "LC", "Leches, yogures, quesos, mantequillas y derivados refrigerados."],
    ["Snacks", "SN", "Galletas, papas fritas, chocolates, caramelos y piqueos."],
    ["Abarrotes", "AB", "Productos básicos: arroz, azúcar, aceites, fideos y menestras."],
    ["Limpieza", "LM", "Detergentes, jabones, desinfectantes y útiles de aseo hogar."],
    ["Panadería", "PN", "Panes frescos, pasteles, queques y productos de panificación."],
    ["Embutidos", "EM", "Jamones, salchichas, chorizos y carnes procesadas."],
    ["Frutas y Verduras", "FV", "Frutas frescas de estación y verduras seleccionadas."],
    ["Cuidado Personal", "CP", "Shampoo, desodorantes, cremas y artículos de aseo personal."],
    ["Mascotas", "MS", "Alimentos para perros, gatos y accesorios para mascotas."],
    ["Licores", "LI", "Vinos, piscos, cervezas y licores variados."],
    ["Congelados", "CG", "Helados, nuggets, hamburguesas y productos congelados."],
    ["Desayunos y Cereales", "DC", "Avenas, cereales, mermeladas y complementos para el desayuno."],
    ["Bebés", "BB", "Pañales, fórmulas, toallitas y cuidado para el bebé."],
    ["Ferretería y Hogar", "FH", "Pilas, focos, herramientas básicas y artículos para el hogar."]
  ];

  const insertCategory = db.prepare("INSERT OR IGNORE INTO categories (name, prefix, description) VALUES (?, ?, ?)");
  categories.forEach(c => insertCategory.run(c[0], c[1], c[2]));

  // Seed suppliers
  const suppliers = [
    ["Arca Continental", "Arca Continental Lindley S.A.", "01 311 3000", "ventas@arcacontal.com", "Av. Javier Prado Este 796"],
    ["Backus", "Backus y Johnston S.A.A.", "01 311 3000", "contacto@backus.com", "Av. Nicolás de Piérola 400"],
    ["Gloria S.A.", "Leche Gloria S.A.", "01 470 7170", "atencion@gloria.com.pe", "Av. República de Panamá 2461"],
    ["Laive S.A.", "Laive S.A.", "01 614 2000", "contacto@laive.com.pe", "Av. Nicolás de Piérola 601"],
    ["Nestlé Perú", "Nestlé Perú S.A.", "01 800 10210", "servicio@nestle.com.pe", "Calle Luis Galvani 492"],
    ["PepsiCo", "PepsiCo Alimentos Perú S.R.L.", "01 614 2000", "ventas@pepsico.com", "Av. El Derby 250"],
    ["Alicorp", "Alicorp S.A.A.", "01 315 0800", "atencion@alicorp.com.pe", "Av. Argentina 4793"],
    ["Costeño Alimentos", "Costeño Alimentos S.A.C.", "01 617 3700", "ventas@costeno.com.pe", "Av. Industrial 123"],
    ["P&G", "Procter & Gamble Perú S.R.L.", "01 614 2000", "contacto@pg.com", "Av. El Derby 250"],
    ["Clorox", "Clorox Perú S.A.", "01 614 2000", "ventas@clorox.com", "Av. El Derby 250"],
    ["San Fernando", "San Fernando S.A.", "01 213 5300", "ventas@san-fernando.com.pe", "Av. República de Panamá 4295"],
    ["Kimberly-Clark", "Kimberly-Clark Perú S.R.L.", "01 211 4000", "contacto@kcc.com", "Av. Canaval y Moreyra 480"],
    ["Molitalia", "Molitalia S.A.", "01 513 9000", "ventas@molitalia.com.pe", "Av. Venezuela 2850"],
    ["Mars", "Mars Perú S.A.", "01 614 2000", "contacto@mars.com", "Av. El Derby 250"],
    ["Bimbo", "Bimbo del Perú S.A.", "01 415 1200", "ventas@bimbo.com.pe", "Av. Venezuela 4560"],
    ["Pernod Ricard", "Pernod Ricard Perú S.A.", "01 614 2000", "contacto@pernod-ricard.com", "Av. El Derby 250"],
    ["Frialsa", "Frialsa Logística Perú S.A.C.", "01 617 3700", "ventas@frialsa.com.pe", "Av. Industrial 123"],
    ["Kellogg's", "Kellogg de Perú S.R.L.", "01 614 2000", "contacto@kelloggs.com", "Av. El Derby 250"],
    ["Johnson & Johnson", "Johnson & Johnson del Perú S.A.", "01 211 4000", "atencion@jnj.com", "Av. Canaval y Moreyra 480"],
    ["Sodimac", "Sodimac Perú S.A.", "01 615 6000", "ventas@sodimac.com.pe", "Av. Javier Prado Este 796"]
  ];

  const insertSupplier = db.prepare("INSERT OR IGNORE INTO suppliers (name, company, phone, email, address) VALUES (?, ?, ?, ?, ?)");
  suppliers.forEach(s => insertSupplier.run(s[0], s[1], s[2], s[3], s[4]));

  // Seed default users
  const adminPassword = bcrypt.hashSync('1475369', 10);
  const demoPassword = bcrypt.hashSync('demo', 10);

  const adminExists = query.get("SELECT * FROM users WHERE email = ?", 'admin@psg.la');
  if (!adminExists) {
    query.run("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)", 'admin@psg.la', adminPassword, 'PSG Admin', 'DESARROLLADOR');
  } else {
    query.run("UPDATE users SET password = ?, role = 'DESARROLLADOR' WHERE email = ?", adminPassword, 'admin@psg.la');
  }

  const demoExists = query.get("SELECT * FROM users WHERE email = ?", 'demo');
  if (!demoExists) {
    query.run("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)", 'demo', demoPassword, 'Usuario Demo', 'ESTANDARD');
  } else {
    query.run("UPDATE users SET password = ? WHERE email = ?", demoPassword, 'demo');
  }
};

export default db;

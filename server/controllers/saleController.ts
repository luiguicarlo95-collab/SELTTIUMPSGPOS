import { Request, Response, NextFunction } from "express";
import { SaleService } from "../services/saleService";
import { query } from "../config/db";
import db from "../config/db";

// SALES
export const getSales = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end, paymentMethod } = req.query;
    const sales = await SaleService.getAllSales(start as string, end as string, paymentMethod as string);
    res.json(sales);
  } catch (error) {
    next(error);
  }
};

export const getSaleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await SaleService.getSaleById(parseInt(req.params.id));
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

export const createSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const saleId = await SaleService.createSale(req.body);
    res.json({ id: saleId });
  } catch (error) {
    next(error);
  }
};

// QUOTATIONS (Placeholder for future service)
export const getQuotations = (req: Request, res: Response) => {
  res.json(query.all(`
    SELECT q.*, c.first_name, c.last_name 
    FROM quotations q 
    LEFT JOIN customers c ON q.customer_id = c.id
    ORDER BY q.created_at DESC
  `));
};

export const createQuotation = (req: Request, res: Response) => {
  const { customer_id, items, total, subtotal, tax } = req.body;
  const transaction = db.transaction(() => {
    const quotationInfo = query.run(`
      INSERT INTO quotations (customer_id, total, subtotal, tax)
      VALUES (?, ?, ?, ?)
    `, customer_id, total, subtotal, tax);
    const quotationId = quotationInfo.lastInsertRowid;
    for (const item of items) {
      query.run(`
        INSERT INTO quotation_items (quotation_id, product_id, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ROUND(?, 2))
      `, quotationId, item.id, item.quantity, item.price, item.quantity * item.price);
    }
    return quotationId;
  });
  res.json({ id: transaction() });
};

// CASH FLOW (Placeholder for future service)
export const getTransactions = (req: Request, res: Response) => {
  res.json(query.all("SELECT * FROM cash_flow ORDER BY created_at DESC"));
};

export const createTransaction = (req: Request, res: Response) => {
  const { type, amount, description } = req.body;
  query.run(`
    INSERT INTO cash_flow (type, amount, description, source_type)
    VALUES (?, ?, ?, 'manual')
  `, type, amount, description);
  res.json({ success: true });
};

export const deleteTransaction = (req: Request, res: Response) => {
  query.run("DELETE FROM cash_flow WHERE id = ?", req.params.id);
  res.json({ success: true });
};

// CUSTOMER PAYMENTS
export const recordPayment = (req: Request, res: Response) => {
  const { customer_id, sale_id, amount, method, reference } = req.body;
  const transaction = db.transaction(() => {
    // Record payment
    query.run(`
      INSERT INTO customer_payments (customer_id, sale_id, amount, method, reference)
      VALUES (?, ?, ?, ?, ?)
    `, customer_id, sale_id, amount, method, reference);

    // Update customer balance
    query.run("UPDATE customers SET balance = balance - ? WHERE id = ?", amount, customer_id);

    // If linked to a sale, update sale remaining balance
    if (sale_id) {
      query.run("UPDATE sales SET remaining_balance = remaining_balance - ? WHERE id = ?", amount, sale_id);
      
      // Check if sale is fully paid
      const sale = query.get("SELECT remaining_balance FROM sales WHERE id = ?", sale_id) as any;
      if (sale && sale.remaining_balance <= 0) {
        query.run("UPDATE sales SET payment_status = 'paid', remaining_balance = 0 WHERE id = ?", sale_id);
      } else {
        query.run("UPDATE sales SET payment_status = 'partial' WHERE id = ?", sale_id);
      }
    }

    // Add to cash flow if method is cash
    if (method === 'cash') {
      query.run(`
        INSERT INTO cash_flow (type, amount, description, source_type, source_id)
        VALUES ('income', ?, ?, 'payment', ?)
      `, amount, `Abono Cliente #${customer_id}`, customer_id);
    }

    return true;
  });
  res.json({ success: transaction() });
};

export const getCustomerPayments = (req: Request, res: Response) => {
  const { customerId } = req.params;
  res.json(query.all("SELECT * FROM customer_payments WHERE customer_id = ? ORDER BY created_at DESC", customerId));
};

// SETTINGS (Placeholder for future service)
export const getSettings = (req: Request, res: Response) => {
  const settings = query.all("SELECT * FROM settings");
  const settingsObj = settings.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  const voucherCount = query.get("SELECT COUNT(*) as count FROM sales") as { count: number };
  settingsObj.voucher_count = voucherCount.count;
  res.json(settingsObj);
};

export const updateSettings = (req: Request, res: Response) => {
  const updates = req.body;
  const transaction = db.transaction(() => {
    const currentLicense = query.get("SELECT value FROM settings WHERE key = 'license_type'") as { value: string };
    const isInfinite = currentLicense?.value === 'infinite';
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'installation_date' || key === 'activation_status') continue;
      if (key === 'unlimited_users' && isInfinite) continue;
      query.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", key, String(value));
    }
  });
  transaction();
  res.json({ success: true });
};

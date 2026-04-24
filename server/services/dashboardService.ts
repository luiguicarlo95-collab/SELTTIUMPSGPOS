
import { query } from "../config/db";

export class DashboardService {
  static async getStats() {
    const today = new Date().toISOString().split('T')[0];
    
    const dailySales = query.get("SELECT ROUND(SUM(total), 2) as total FROM sales WHERE date(created_at) = ?", today) as any;
    const weeklySales = query.get("SELECT ROUND(SUM(total), 2) as total FROM sales WHERE created_at >= date('now', '-7 days')") as any;
    const monthlySales = query.get("SELECT ROUND(SUM(total), 2) as total FROM sales WHERE created_at >= date('now', 'start of month')") as any;
    const lowStock = query.get(`
      SELECT COUNT(*) as count 
      FROM (
        SELECT p.id, 
        CASE WHEN p.has_serials = 1 
          THEN (SELECT COUNT(*) FROM product_items WHERE product_id = p.id AND status = 'available') 
          ELSE p.stock 
        END as current_stock, 
        p.min_stock 
        FROM products p
      ) 
      WHERE current_stock <= min_stock
    `) as any;
    const totalProducts = query.get("SELECT COUNT(*) as count FROM products") as any;

    const totalProfit = query.get("SELECT ROUND(SUM(profit), 2) as total FROM sales WHERE date(created_at) = ?", today) as any;
    const monthlyProfit = query.get("SELECT ROUND(SUM(profit), 2) as total FROM sales WHERE created_at >= date('now', 'start of month')") as any;
    const outstandingCredit = query.get("SELECT ROUND(SUM(balance), 2) as total FROM customers") as any;

    const salesTrend = query.all(`
      SELECT date(created_at) as date, SUM(total) as sales 
      FROM sales 
      WHERE created_at >= date('now', '-7 days') 
      GROUP BY date(created_at) 
      ORDER BY date(created_at) ASC
    `);

    const salesByCategory = query.all(`
      SELECT 
        COALESCE(c.name, 'Sin Categoría') as name, 
        SUM(si.subtotal) as value
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= date('now', '-90 days')
      GROUP BY COALESCE(c.name, 'Sin Categoría')
      ORDER BY value DESC
      LIMIT 10
    `);

    const recentSales = query.all(`
      SELECT s.id, s.total, s.created_at, s.payment_method, c.first_name, c.last_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    const lowStockProducts = (query.all(`
      SELECT * FROM (
        SELECT id, name, min_stock,
        CASE WHEN has_serials = 1 
          THEN (SELECT COUNT(*) FROM product_items WHERE product_id = p.id AND status = 'available') 
          ELSE stock 
        END as current_stock
        FROM products p
      )
      WHERE current_stock <= min_stock 
      ORDER BY current_stock ASC 
      LIMIT 5
    `) as any[]).map((p: any) => ({ ...p, stock: p.current_stock }));

    const cashBalance = query.get("SELECT ROUND(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 2) as balance FROM cash_flow") as any;

    return {
      dailySales,
      weeklySales,
      monthlySales,
      lowStock,
      totalProducts,
      salesTrend: salesTrend.map((t: any) => ({ ...t, sales: Math.round((t.sales + Number.EPSILON) * 100) / 100 })),
      salesByCategory: salesByCategory.map((c: any) => ({ ...c, value: Math.round((c.value + Number.EPSILON) * 100) / 100 })),
      recentSales,
      lowStockProducts,
      cashBalance,
      totalProfit,
      monthlyProfit,
      outstandingCredit
    };
  }
}

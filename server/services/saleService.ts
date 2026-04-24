
import { SaleRepository } from "../repositories/saleRepository";
import { ProductRepository } from "../repositories/productRepository";
import { query } from "../config/db";
import db from "../config/db";
import { ApiError } from "../middleware/errorHandler";

export class SaleService {
  static async getAllSales(start?: string, end?: string, paymentMethod?: string) {
    return SaleRepository.findAll(start, end, paymentMethod);
  }

  static async getSaleById(id: number) {
    const sale = SaleRepository.findById(id) as any;
    if (!sale) throw new ApiError(404, "Venta no encontrada");
    
    const items = SaleRepository.findItemsBySaleId(id);
    return { ...sale, items };
  }

  static async createSale(data: any) {
    const { customer_id, items, total, subtotal, tax, payment_method, warranty, points_redeemed } = data;
    
    const transaction = db.transaction(() => {
      let totalProfit = 0;
      let totalPurchasePrice = 0;

      // Pre-calculate profit and validate stock
      for (const item of items) {
        if (item.id !== null && item.id !== undefined) {
          const product = ProductRepository.findById(item.id) as any;
          if (product) {
            totalPurchasePrice += (product.purchase_price || 0) * item.quantity;
          }
        }
      }
      totalProfit = total - totalPurchasePrice;

      // Handle payment method parsing
      let payments: any[] = [];
      try {
        payments = JSON.parse(payment_method);
      } catch (e) {
        if (typeof payment_method === 'string') {
          payments = [{ method: payment_method, amount: total }];
        }
      }

      const creditPayment = payments.find((p: any) => p.method === 'credit');
      const isCredit = !!creditPayment && creditPayment.amount > 0;
      const paymentStatus = isCredit ? (creditPayment.amount === total ? 'pending' : 'partial') : 'paid';
      const remainingBalance = isCredit ? creditPayment.amount : 0;

      const saleInfo = SaleRepository.create({
        customer_id, 
        total, 
        subtotal, 
        tax, 
        payment_method, 
        warranty,
        profit: totalProfit,
        payment_status: paymentStatus,
        remaining_balance: remainingBalance
      });
      
      const saleId = saleInfo.lastInsertRowid as number;
      
      for (const item of items) {
        SaleRepository.createItem({
          sale_id: saleId,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
          serial_numbers: JSON.stringify(item.serial_numbers || []),
          custom_name: item.name
        });
        
        if (item.id !== null && item.id !== undefined) {
          const product = ProductRepository.findById(item.id) as any;
          
          if (product && product.has_serials) {
            if (Array.isArray(item.serial_numbers) && item.serial_numbers.length > 0) {
              for (const sn of item.serial_numbers) {
                ProductRepository.deleteSerialItem(item.id, sn);
              }
            } else {
              const availableItems = query.all("SELECT id FROM product_items WHERE product_id = ? AND status = 'available' LIMIT ?", item.id, item.quantity) as any[];
              if (availableItems.length < item.quantity) throw new ApiError(400, `Stock insuficiente para: ${item.name}`);
              for (const pi of availableItems) query.run("DELETE FROM product_items WHERE id = ?", pi.id);
            }
          } else {
            query.run("UPDATE products SET stock = stock - ? WHERE id = ?", item.quantity, item.id);
          }
        }
      }
      
      // Points System
      if (customer_id) {
        const settings = query.all("SELECT * FROM settings");
        const settingsObj = settings.reduce((acc: any, curr: any) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {});
        
        const pointsPerUnit = parseFloat(settingsObj.points_per_unit || "0.1"); // Default: 1 point per 10 pesos/soles
        const earnedPoints = Math.floor(total * pointsPerUnit);
        
        if (earnedPoints > 0) {
          query.run("UPDATE customers SET points = points + ? WHERE id = ?", earnedPoints, customer_id);
        }

        if (points_redeemed && points_redeemed > 0) {
          query.run("UPDATE customers SET points = points - ? WHERE id = ?", points_redeemed, customer_id);
        }

        // Credit System
        if (isCredit) {
          query.run("UPDATE customers SET balance = balance + ? WHERE id = ?", remainingBalance, customer_id);
        }
      }

      // Cash Flow Integration
      this.handleCashFlow(saleId, total, payment_method);
      
      return saleId;
    });

    return transaction();
  }

  private static handleCashFlow(saleId: number, total: number, payment_method: string) {
    try {
      const payments = JSON.parse(payment_method);
      if (Array.isArray(payments)) {
        const cashPayment = payments.find((p: any) => p.method === 'cash');
        if (cashPayment && cashPayment.amount > 0) {
          query.run(`
            INSERT INTO cash_flow (type, amount, description, source_type, source_id)
            VALUES ('income', ?, ?, 'sale', ?)
          `, cashPayment.amount, `Venta #${saleId}`, saleId);
        }
      }
    } catch (e) {
      if (payment_method === 'cash') {
        query.run(`
          INSERT INTO cash_flow (type, amount, description, source_type, source_id)
          VALUES ('income', ?, ?, 'sale', ?)
        `, total, `Venta #${saleId}`, saleId);
      }
    }
  }
}

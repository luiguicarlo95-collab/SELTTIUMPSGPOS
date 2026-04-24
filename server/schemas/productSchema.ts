
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  category_id: z.number().int(),
  purchase_price: z.number().nonnegative("El precio de compra no puede ser negativo"),
  sale_price: z.number().nonnegative("El precio de venta no puede ser negativo"),
  stock: z.number().int().optional().default(0),
  min_stock: z.number().int().optional().default(5),
  unit: z.string().optional().default('unidad'),
  brand: z.string().optional(),
  supplier_id: z.number().int().optional(),
  image: z.string().optional(),
  has_serials: z.boolean().optional().default(false),
  serial_numbers: z.array(z.string()).optional()
});

export const updateProductSchema = productSchema.partial();

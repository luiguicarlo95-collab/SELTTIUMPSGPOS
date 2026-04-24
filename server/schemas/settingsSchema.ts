import { z } from 'zod';

export const settingsSchema = z.record(z.string(), z.any()).superRefine((data, ctx) => {
  if (data.email) {
    const emailResult = z.string().email("El formato del correo electrónico del negocio no es válido").safeParse(data.email);
    if (!emailResult.success) {
      emailResult.error.issues.forEach(issue => {
        ctx.addIssue({
          ...issue,
          path: ['email']
        });
      });
    }
  }
  if (data.phone) {
    const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/;
    if (!phoneRegex.test(data.phone) || data.phone.replace(/[^0-9]/g, '').length < 7) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: "El formato del número de teléfono no es válido"
      });
    }
  }
});

// A simpler way for updateSettings where we might only send some keys
export const updateSettingsSchema = z.object({
  email: z.string().email("El formato del correo electrónico no es válido").optional(),
  phone: z.string().min(7, "El número de teléfono debe tener al menos 7 dígitos").regex(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/, "Formato de teléfono inválido").optional(),
  business_name: z.string().min(1, "El nombre del negocio es obligatorio").optional(),
  address: z.string().optional(),
  currency: z.string().optional(),
  ticket_message: z.string().optional(),
  primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color inválido").optional(),
}).passthrough();

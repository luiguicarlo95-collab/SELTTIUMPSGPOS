
import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email("El formato del correo electrónico no es válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(2, "el nombre debe tener al menos 2 caracteres"),
  role: z.enum(['ESTANDARD', 'ADMINISTRADOR', 'DESARROLLADOR']).optional().default('ESTANDARD')
});

export const updateUserSchema = z.object({
  email: z.string().email("El formato del correo electrónico no es válido").optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  role: z.enum(['ESTANDARD', 'ADMINISTRADOR', 'DESARROLLADOR']).optional()
});

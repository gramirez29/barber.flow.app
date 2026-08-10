import { z } from 'zod';

const phoneField = (requiredMessage: string) =>
  z
    .string()
    .min(1, requiredMessage)
    .regex(/^\d{4}-\d{4}$/, 'Formato de teléfono inválido (XXXX-XXXX)');

// Create Barber Schema (usuario de aplicación)
export const createBarberSchema = z.object({
  userName: z.string().min(1, 'El usuario es requerido'),
  userPhone: phoneField('El teléfono del usuario es requerido'),
  userEmail: z.string().min(1, 'El correo es requerido').email('Correo inválido'),
  barberName: z.string().min(1, 'El nombre del barbero es requerido'),
  barberPhone: phoneField('El teléfono del barbero es requerido'),
  barberShopName: z.string().min(1, 'El nombre de la barbería es requerido'),
  barberShopPhone: phoneField('El teléfono de la barbería es requerido'),
  address: z.string().min(1, 'La dirección es requerida'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type CreateBarberFormData = z.infer<typeof createBarberSchema>;

// Update Barber Schema: password opcional (solo se envía si se quiere cambiar)
export const updateBarberSchema = createBarberSchema.extend({
  password: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type UpdateBarberFormData = z.infer<typeof updateBarberSchema>;

// Report Calculation Settings Schema
export const reportCalculationSettingsSchema = z.object({
  commissionPercentage: z
    .number()
    .min(0, 'La comisión debe ser entre 0 y 100')
    .max(100, 'La comisión debe ser entre 0 y 100'),
  fixedDailyExpense: z.number().min(0, 'El gasto fijo diario debe ser mayor o igual a 0'),
});

export type ReportCalculationSettingsFormData = z.infer<typeof reportCalculationSettingsSchema>;

import { z } from 'zod';

// Create Client Schema
export const createClientSchema = z.object({
  firstName: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  lastName: z
    .string()
    .min(1, 'El apellido es requerido')
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100, 'El apellido no puede exceder 100 caracteres'),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .regex(/^\d{4}-\d{4}$/, 'Formato de teléfono inválido (XXXX-XXXX)'),
  email: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.length >= 3,
      'La dirección debe tener al menos 3 caracteres'
    ),
  birthday: z
    .string()
    .optional()
    .refine(
      (value) => !value || new Date(value) < new Date(),
      'La fecha de cumpleaños debe ser en el pasado'
    ),
  paymentMethod: z
    .enum(['cash', 'sinpe_movil', 'transfer', 'none'], {
      errorMap: () => ({ message: 'Método de pago inválido' }),
    })
    .optional(),
});

export type CreateClientFormData = z.infer<typeof createClientSchema>;

// Update Client Schema
export const updateClientSchema = createClientSchema;

export type UpdateClientFormData = z.infer<typeof updateClientSchema>;

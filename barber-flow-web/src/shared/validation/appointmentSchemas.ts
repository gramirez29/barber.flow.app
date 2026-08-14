import { z } from 'zod';

/**
 * Combina date ("yyyy-MM-dd") + time ("HH:mm") y valida que el resultado
 * sea estrictamente posterior al momento actual. Comparar solo `date` (sin
 * hora) siempre rechaza "hoy", ya que se parsea a medianoche.
 */
export const isFutureAppointmentDateTime = (date: string, time: string): boolean => {
  const combined = new Date(`${date}T${time}`);
  return !Number.isNaN(combined.getTime()) && combined > new Date();
};

const appointmentObjectSchema = z.object({
  clientName: z
    .string()
    .min(1, 'El nombre del cliente es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .regex(/^\d{4}-\d{4}$/, 'Formato de teléfono inválido (XXXX-XXXX)'),
  date: z.string().min(1, 'La fecha es requerida'),
  time: z
    .string()
    .min(1, 'La hora es requerida')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  serviceName: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.length >= 3,
      'El servicio debe tener al menos 3 caracteres'
    ),
  price: z
    .number()
    .optional()
    .refine(
      (value) => !value || value > 0,
      'El precio debe ser mayor a 0'
    ),
  notes: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.length <= 500,
      'Las notas no pueden exceder 500 caracteres'
    ),
  paymentMethod: z
    .enum(['cash', 'sinpeMovil', 'transfer'], {
      errorMap: () => ({ message: 'Método de pago inválido' }),
    })
    .optional(),
  status: z
    .enum(['scheduled', 'confirmed', 'completed', 'cancelled'], {
      errorMap: () => ({ message: 'Estado inválido' }),
    })
    .optional(),
});

// Create Appointment Schema
export const createAppointmentSchema = appointmentObjectSchema.refine(
  (data) => isFutureAppointmentDateTime(data.date, data.time),
  { message: 'La fecha y hora deben ser en el futuro', path: ['date'] }
);

export type CreateAppointmentFormData = z.infer<typeof appointmentObjectSchema>;

// Update Appointment Schema
export const updateAppointmentSchema = appointmentObjectSchema
  .omit({ date: true, time: true })
  .extend({
    date: z.string().optional(),
    time: z.string().optional(),
  });

export type UpdateAppointmentFormData = z.infer<typeof updateAppointmentSchema>;

// Search Appointments Schema
export const searchAppointmentsSchema = z.object({
  query: z.string().optional(),
  date: z.string().optional(),
  status: z
    .enum(['scheduled', 'confirmed', 'completed', 'cancelled'])
    .optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
});

export type SearchAppointmentsFormData = z.infer<typeof searchAppointmentsSchema>;

// Move Appointment Schema
export const moveAppointmentSchema = z
  .object({
    appointmentId: z.string().min(1, 'ID de cita requerido'),
    newDate: z.string().min(1, 'La nueva fecha es requerida'),
    newTime: z
      .string()
      .min(1, 'La nueva hora es requerida')
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  })
  .refine((data) => isFutureAppointmentDateTime(data.newDate, data.newTime), {
    message: 'La fecha y hora deben ser en el futuro',
    path: ['newDate'],
  });

export type MoveAppointmentFormData = z.infer<typeof moveAppointmentSchema>;

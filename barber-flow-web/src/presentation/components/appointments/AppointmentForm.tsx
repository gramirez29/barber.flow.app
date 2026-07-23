import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import { FormTextField } from '@presentation/components/shared/FormTextField';
import { useForm } from '@presentation/hooks/useForm';
import {
  createAppointmentSchema,
  CreateAppointmentFormData,
} from '@shared/validation/appointmentSchemas';
import { Appointment } from '@domain/entities/Appointment';
import { APPOINTMENT_CONSTANTS } from '@shared/constants/appointments';

interface AppointmentFormProps {
  open: boolean;
  title: string;
  appointment?: Appointment | null;
  onSubmit: (data: CreateAppointmentFormData) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

/**
 * AppointmentForm: Diálogo para crear/editar citas
 *
 * Features:
 * - Validación con Zod
 * - Modo crear y editar
 * - Campos opcionales (servicio, precio, notas)
 * - Selección de método de pago
 */
export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  open,
  title,
  appointment,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const initialValues: CreateAppointmentFormData = appointment || {
    clientName: '',
    phone: '',
    date: '',
    time: '',
    serviceName: '',
    price: undefined,
    notes: '',
    paymentMethod: APPOINTMENT_CONSTANTS.DEFAULT_PAYMENT_METHOD,
  };

  const form = useForm(initialValues, createAppointmentSchema);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await form.validate();
    if (!isValid) return;

    try {
      await onSubmit(form.values);
      form.reset();
      onClose();
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <form id="appointment-form">
          <Stack spacing={3}>
            {/* Cliente */}
            <FormTextField
              id="clientName"
              label="Nombre del Cliente"
              placeholder="Ej: Juan Pérez"
              value={form.values.clientName}
              onChange={(e) => form.setFieldValue('clientName', e.target.value)}
              onBlur={() => form.setFieldTouched('clientName', true)}
              error={form.errors.clientName}
              isTouched={form.touched.has('clientName')}
              disabled={isLoading}
              autoFocus
            />

            {/* Teléfono */}
            <FormTextField
              id="phone"
              label="Teléfono"
              placeholder="1234-5678"
              value={form.values.phone}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 4) {
                  value = value.slice(0, 4) + '-' + value.slice(4, 8);
                }
                form.setFieldValue('phone', value);
              }}
              onBlur={() => form.setFieldTouched('phone', true)}
              error={form.errors.phone}
              isTouched={form.touched.has('phone')}
              disabled={isLoading}
              inputProps={{ maxLength: 9 }}
            />

            <Divider />

            {/* Fecha */}
            <FormTextField
              id="date"
              label="Fecha"
              type="date"
              value={form.values.date}
              onChange={(e) => form.setFieldValue('date', e.target.value)}
              onBlur={() => form.setFieldTouched('date', true)}
              error={form.errors.date}
              isTouched={form.touched.has('date')}
              disabled={isLoading}
              InputLabelProps={{ shrink: true }}
            />

            {/* Hora */}
            <FormTextField
              id="time"
              label="Hora"
              type="time"
              value={form.values.time}
              onChange={(e) => form.setFieldValue('time', e.target.value)}
              onBlur={() => form.setFieldTouched('time', true)}
              error={form.errors.time}
              isTouched={form.touched.has('time')}
              disabled={isLoading}
              InputLabelProps={{ shrink: true }}
            />

            <Divider />

            {/* Servicio */}
            <FormTextField
              id="serviceName"
              label="Servicio (Opcional)"
              placeholder="Ej: Corte + Afeitado"
              value={form.values.serviceName || ''}
              onChange={(e) => form.setFieldValue('serviceName', e.target.value || undefined)}
              onBlur={() => form.setFieldTouched('serviceName', true)}
              error={form.errors.serviceName}
              isTouched={form.touched.has('serviceName')}
              disabled={isLoading}
            />

            {/* Precio */}
            <FormTextField
              id="price"
              label="Precio (Opcional)"
              type="number"
              placeholder="0.00"
              value={form.values.price ?? ''}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : undefined;
                form.setFieldValue('price', value);
              }}
              onBlur={() => form.setFieldTouched('price', true)}
              error={form.errors.price}
              isTouched={form.touched.has('price')}
              disabled={isLoading}
              inputProps={{ step: '0.01', min: '0' }}
            />

            {/* Método de Pago */}
            <FormTextField
              id="paymentMethod"
              label="Método de Pago"
              select
              value={form.values.paymentMethod || APPOINTMENT_CONSTANTS.DEFAULT_PAYMENT_METHOD}
              onChange={(e) => form.setFieldValue('paymentMethod', e.target.value as any)}
              onBlur={() => form.setFieldTouched('paymentMethod', true)}
              disabled={isLoading}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">- Seleccionar -</option>
              <option value="cash">Efectivo</option>
              <option value="sinpe_movil">SINPE Móvil</option>
              <option value="transfer">Transferencia</option>
            </FormTextField>

            {/* Notas */}
            <FormTextField
              id="notes"
              label="Notas (Opcional)"
              placeholder="Comentarios o observaciones..."
              multiline
              rows={3}
              value={form.values.notes || ''}
              onChange={(e) => form.setFieldValue('notes', e.target.value || undefined)}
              onBlur={() => form.setFieldTouched('notes', true)}
              error={form.errors.notes}
              isTouched={form.touched.has('notes')}
              disabled={isLoading}
            />

            {/* Contador de caracteres para notas */}
            {form.values.notes && (
              <Typography variant="caption" color="textSecondary">
                {form.values.notes.length}/500 caracteres
              </Typography>
            )}
          </Stack>
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || form.isValidating}
          form="appointment-form"
        >
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

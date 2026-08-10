import React, { useState } from 'react';
import { Box, Dialog, DialogContent, Typography, InputAdornment } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import { FormTextField } from '@presentation/components/shared/FormTextField';
import { useForm } from '@presentation/hooks/useForm';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  isFutureAppointmentDateTime,
  CreateAppointmentFormData,
} from '@shared/validation/appointmentSchemas';
import { Appointment, AppointmentStatus, AppointmentPaymentMethod } from '@domain/entities/Appointment';
import { APPOINTMENT_CONSTANTS } from '@shared/constants/appointments';
import { appColors } from '@presentation/theme/appColors';
import { scrollbarSx } from '@presentation/theme/scrollbarSx';
import { useConfirmDialog } from '@presentation/context/ConfirmDialogContext';

interface AppointmentFormProps {
  open: boolean;
  title: string;
  appointment?: Appointment | null;
  defaultDate?: string;
  onSubmit: (data: CreateAppointmentFormData) => Promise<void>;
  onMove?: (appointmentId: string, newDate: string, newTime: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const MOVABLE_STATUSES: AppointmentStatus[] = ['scheduled', 'confirmed'];

const STATUS_OPTIONS: AppointmentStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled'];
const PAYMENT_OPTIONS: AppointmentPaymentMethod[] = ['cash', 'sinpeMovil', 'transfer'];

// Normaliza valores previos a la migración de PaymentMethod (p. ej. 'sinpe_movil', 'none')
// para que citas antiguas sigan siendo editables sin fallar la validación del enum actual.
const normalizePaymentMethod = (value?: string | null): AppointmentPaymentMethod | undefined => {
  if (value === 'sinpe_movil') return 'sinpeMovil';
  if ((PAYMENT_OPTIONS as string[]).includes(value ?? '')) return value as AppointmentPaymentMethod;
  return undefined;
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: appColors.surfaceElevated,
    borderRadius: '12px',
    fontSize: '15px',
    color: appColors.textPrimary,
    '& fieldset': { borderColor: appColors.border },
    '&:hover fieldset': { borderColor: appColors.accent },
    '&.Mui-focused fieldset': { borderColor: appColors.accent },
  },
  '& .MuiInputLabel-root': {
    color: appColors.textSecondary,
    '&.Mui-focused': { color: appColors.accent },
  },
};

const Pill: React.FC<{ label: string; active: boolean; onClick: () => void; disabled?: boolean }> = ({
  label,
  active,
  onClick,
  disabled,
}) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    disabled={disabled}
    sx={{
      cursor: disabled ? 'default' : 'pointer',
      border: `1px solid ${active ? appColors.accent : appColors.border}`,
      backgroundColor: active ? appColors.accent : appColors.surfaceElevated,
      borderRadius: '20px',
      px: 1.75,
      py: 0.875,
      mr: 1,
      mb: 1,
      opacity: disabled ? 0.5 : 1,
      fontSize: 13,
      fontWeight: active ? 700 : 500,
      color: active ? appColors.onAccent : appColors.textSecondary,
    }}
  >
    {label}
  </Box>
);

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  open,
  title,
  appointment,
  defaultDate,
  onSubmit,
  onMove,
  onClose,
  isLoading = false,
}) => {
  const { confirm } = useConfirmDialog();
  const [moveDate, setMoveDate] = useState(appointment?.date ?? '');
  const [moveTime, setMoveTime] = useState(appointment?.time ?? '');
  const [isMoving, setIsMoving] = useState(false);

  const canMove = Boolean(appointment?.id) && MOVABLE_STATUSES.includes(appointment!.status);
  const isMoveDateTimeValid = !moveDate || !moveTime || isFutureAppointmentDateTime(moveDate, moveTime);

  const handleMove = async () => {
    if (!appointment?.id || !onMove || !isMoveDateTimeValid) return;

    const confirmed = await confirm({
      title: 'Mover cita',
      message: '¿Seguro que querés mover esta cita a la nueva fecha y hora?',
      confirmText: 'Mover',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;

    setIsMoving(true);
    try {
      await onMove(appointment.id, moveDate, moveTime);
    } catch {
      // El error ya se muestra vía notificación en useAppointments.moveAppointment
    } finally {
      setIsMoving(false);
    }
  };

  const initialValues: CreateAppointmentFormData = appointment
    ? {
        clientName: appointment.clientName,
        phone: appointment.phone,
        date: appointment.date,
        time: appointment.time,
        serviceName: appointment.serviceName,
        price: appointment.servicePrice ?? undefined,
        notes: appointment.notes,
        paymentMethod: normalizePaymentMethod(appointment.paymentMethodUsed),
        status: appointment.status,
      }
    : {
        clientName: '',
        phone: '',
        date: defaultDate || '',
        time: '',
        serviceName: '',
        price: undefined,
        notes: '',
        paymentMethod: APPOINTMENT_CONSTANTS.DEFAULT_PAYMENT_METHOD,
        status: 'scheduled',
      };

  const form = useForm(initialValues, appointment ? updateAppointmentSchema : createAppointmentSchema);
  const isReadOnly = appointment?.status === 'completed' || appointment?.status === 'cancelled';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await form.validate();
    if (!isValid) return;

    try {
      await onSubmit(form.values);
      form.reset();
      onClose();
    } catch {
      // Error already handled by hook
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: appColors.surface,
          borderRadius: '20px',
          border: `1px solid ${appColors.border}`,
        },
      }}
    >
      <DialogContent sx={{ p: 3, ...scrollbarSx }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: appColors.accent,
            mb: 0.5,
          }}
        >
          {appointment ? 'Editar cita' : 'Nueva cita'}
        </Typography>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: appColors.textPrimary, mb: 3 }}>
          {title}
        </Typography>

        <form id="appointment-form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Estado */}
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: appColors.textSecondary, mb: 1 }}>
                Estado de la cita
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map((status) => (
                  <Pill
                    key={status}
                    label={APPOINTMENT_CONSTANTS.STATUS_LABELS[status]}
                    active={form.values.status === status}
                    disabled={isLoading || isReadOnly}
                    onClick={() => form.setFieldValue('status', status)}
                  />
                ))}
              </Box>
            </Box>

            {/* Cliente */}
            <FormTextField
              id="clientName"
              label="Nombre del cliente"
              placeholder="Ej: Juan Pérez"
              value={form.values.clientName}
              onChange={(e) => form.setFieldValue('clientName', e.target.value)}
              onBlur={() => form.setFieldTouched('clientName', true)}
              error={form.errors.clientName}
              isTouched={form.touched.has('clientName')}
              disabled={isLoading}
              autoFocus
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: appColors.textSecondary }} />
                  </InputAdornment>
                ),
              }}
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
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneOutlinedIcon sx={{ color: appColors.textSecondary }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
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
                sx={{ ...inputSx, flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventOutlinedIcon sx={{ color: appColors.textSecondary }} />
                    </InputAdornment>
                  ),
                }}
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
                sx={{ ...inputSx, flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeIcon sx={{ color: appColors.textSecondary }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Servicio */}
            <FormTextField
              id="serviceName"
              label="Servicio"
              placeholder="Corte clásico, barba, combo..."
              value={form.values.serviceName || ''}
              onChange={(e) => form.setFieldValue('serviceName', e.target.value || undefined)}
              onBlur={() => form.setFieldTouched('serviceName', true)}
              error={form.errors.serviceName}
              isTouched={form.touched.has('serviceName')}
              disabled={isLoading}
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ContentCutIcon sx={{ color: appColors.textSecondary }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Precio */}
            <FormTextField
              id="price"
              label="Precio del servicio"
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
              sx={inputSx}
              InputProps={{
                startAdornment: <InputAdornment position="start">CRC</InputAdornment>,
              }}
            />

            {/* Método de pago */}
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: appColors.textSecondary, mb: 1 }}>
                Método de pago
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {PAYMENT_OPTIONS.map((method) => (
                  <Pill
                    key={method}
                    label={APPOINTMENT_CONSTANTS.PAYMENT_METHOD_LABELS[method]}
                    active={form.values.paymentMethod === method}
                    disabled={isLoading}
                    onClick={() => form.setFieldValue('paymentMethod', method)}
                  />
                ))}
              </Box>
            </Box>

            {/* Notas */}
            <FormTextField
              id="notes"
              label="Notas"
              placeholder="Indicaciones, preferencias o recordatorios"
              multiline
              rows={3}
              value={form.values.notes || ''}
              onChange={(e) => form.setFieldValue('notes', e.target.value || undefined)}
              onBlur={() => form.setFieldTouched('notes', true)}
              error={form.errors.notes}
              isTouched={form.touched.has('notes')}
              disabled={isLoading}
              sx={inputSx}
            />

            {/* Acciones */}
            <Box sx={{ display: 'flex', gap: 1.25, mt: 1 }}>
              <Box
                component="button"
                type="submit"
                form="appointment-form"
                disabled={isLoading || form.isValidating}
                sx={{
                  flex: 1,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: appColors.accent,
                  color: appColors.onAccent,
                  borderRadius: '12px',
                  py: 1.5,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                  opacity: isLoading ? 0.6 : 1,
                  '&:hover': { backgroundColor: appColors.accentLight },
                }}
              >
                {isLoading ? 'Guardando...' : appointment ? 'Guardar cambios' : 'Guardar cita'}
              </Box>
              <Box
                component="button"
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                sx={{
                  flex: 1,
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: appColors.textSecondary,
                  border: `1px solid ${appColors.border}`,
                  borderRadius: '12px',
                  py: 1.5,
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '0.4px',
                  '&:hover': { borderColor: appColors.accent },
                }}
              >
                Cancelar
              </Box>
            </Box>
          </Box>
        </form>

        {canMove && (
          <Box
            sx={{
              mt: 2.5,
              backgroundColor: appColors.surfaceElevated,
              borderRadius: '14px',
              border: `1px solid ${appColors.border}`,
              p: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: appColors.accent,
              }}
            >
              Mover cita
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: appColors.textPrimary, mt: 0.5 }}>
              Reasignar fecha y hora
            </Typography>
            <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.25, mb: 2 }}>
              Mueve esta cita a otro día u hora.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormTextField
                id="moveDate"
                label="Nueva fecha"
                type="date"
                value={moveDate}
                onChange={(e) => setMoveDate(e.target.value)}
                disabled={isMoving}
                InputLabelProps={{ shrink: true }}
                sx={{ ...inputSx, flex: 1 }}
              />
              <FormTextField
                id="moveTime"
                label="Nueva hora"
                type="time"
                value={moveTime}
                onChange={(e) => setMoveTime(e.target.value)}
                disabled={isMoving}
                InputLabelProps={{ shrink: true }}
                sx={{ ...inputSx, flex: 1 }}
              />
            </Box>

            {!isMoveDateTimeValid && (
              <Typography sx={{ fontSize: 12, color: appColors.error, mb: 2, mt: -1 }}>
                La fecha y hora deben ser en el futuro
              </Typography>
            )}

            <Box
              component="button"
              type="button"
              onClick={handleMove}
              disabled={isMoving || !moveDate || !moveTime || !isMoveDateTimeValid}
              sx={{
                width: '100%',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: appColors.accent,
                color: appColors.onAccent,
                borderRadius: '12px',
                py: 1.5,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.4px',
                opacity: isMoving ? 0.6 : 1,
                '&:hover': { backgroundColor: appColors.accentLight },
              }}
            >
              {isMoving ? 'Moviendo...' : 'Mover cita'}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

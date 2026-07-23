import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Divider,
  MenuItem,
  TextField,
} from '@mui/material';
import { FormTextField } from '@presentation/components/shared/FormTextField';
import { useForm } from '@presentation/hooks/useForm';
import { createClientSchema, CreateClientFormData } from '@shared/validation/clientSchemas';
import { Client } from '@domain/entities/Client';
import { CLIENT_CONSTANTS } from '@shared/constants/clients';

interface ClientFormProps {
  open: boolean;
  title: string;
  client?: Client | null;
  onSubmit: (data: CreateClientFormData) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

/**
 * ClientForm: Diálogo para crear/editar clientes
 *
 * Features:
 * - Validación con Zod
 * - Modo crear y editar
 * - Campos opcionales (email, dirección, cumpleaños)
 * - Selección de método de pago
 */
export const ClientForm: React.FC<ClientFormProps> = ({
  open,
  title,
  client,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const initialValues: CreateClientFormData = client || {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    birthday: '',
    paymentMethod: 'none',
  };

  const form = useForm(initialValues, createClientSchema);

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
        <form id="client-form">
          <Stack spacing={3}>
            {/* Nombre */}
            <FormTextField
              id="firstName"
              label="Nombre"
              placeholder="Ej: Juan"
              value={form.values.firstName}
              onChange={(e) => form.setFieldValue('firstName', e.target.value)}
              onBlur={() => form.setFieldTouched('firstName', true)}
              error={form.errors.firstName}
              isTouched={form.touched.has('firstName')}
              disabled={isLoading}
              autoFocus
            />

            {/* Apellido */}
            <FormTextField
              id="lastName"
              label="Apellido"
              placeholder="Ej: Pérez"
              value={form.values.lastName}
              onChange={(e) => form.setFieldValue('lastName', e.target.value)}
              onBlur={() => form.setFieldTouched('lastName', true)}
              error={form.errors.lastName}
              isTouched={form.touched.has('lastName')}
              disabled={isLoading}
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

            {/* Email */}
            <FormTextField
              id="email"
              label="Email"
              placeholder="ejemplo@correo.com"
              type="email"
              value={form.values.email}
              onChange={(e) => form.setFieldValue('email', e.target.value)}
              onBlur={() => form.setFieldTouched('email', true)}
              error={form.errors.email}
              isTouched={form.touched.has('email')}
              disabled={isLoading}
            />

            {/* Dirección */}
            <FormTextField
              id="address"
              label="Dirección"
              placeholder="Ej: Calle Principal 123"
              value={form.values.address}
              onChange={(e) => form.setFieldValue('address', e.target.value)}
              onBlur={() => form.setFieldTouched('address', true)}
              error={form.errors.address}
              isTouched={form.touched.has('address')}
              disabled={isLoading}
              multiline
              rows={2}
            />

            {/* Cumpleaños */}
            <FormTextField
              id="birthday"
              label="Fecha de Cumpleaños"
              type="date"
              value={form.values.birthday}
              onChange={(e) => form.setFieldValue('birthday', e.target.value)}
              onBlur={() => form.setFieldTouched('birthday', true)}
              error={form.errors.birthday}
              isTouched={form.touched.has('birthday')}
              disabled={isLoading}
              InputLabelProps={{ shrink: true }}
            />

            {/* Método de Pago */}
            <TextField
              id="paymentMethod"
              label="Método de Pago Preferido"
              select
              value={form.values.paymentMethod}
              onChange={(e) => form.setFieldValue('paymentMethod', e.target.value as any)}
              onBlur={() => form.setFieldTouched('paymentMethod', true)}
              disabled={isLoading}
              fullWidth
              variant="outlined"
            >
              {Object.entries(CLIENT_CONSTANTS.PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          type="submit"
          form="client-form"
        >
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

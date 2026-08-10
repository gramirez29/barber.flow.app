import React from 'react';
import { Box, Dialog, DialogContent, Typography, InputAdornment, Switch } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import { FormTextField } from '@presentation/components/shared/FormTextField';
import { useForm } from '@presentation/hooks/useForm';
import { createClientSchema, CreateClientFormData } from '@shared/validation/clientSchemas';
import { Client, ClientPaymentMethod } from '@domain/entities/Client';
import { CLIENT_CONSTANTS } from '@shared/constants/clients';
import { appColors } from '@presentation/theme/appColors';
import { scrollbarSx } from '@presentation/theme/scrollbarSx';
import { ClientAppointmentHistory } from './ClientAppointmentHistory';

interface ClientFormProps {
  open: boolean;
  title: string;
  client?: Client | null;
  onSubmit: (data: CreateClientFormData) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const PAYMENT_OPTIONS: ClientPaymentMethod[] = ['Cash', 'Sinpe Movil', 'Transfer', 'None'];

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

const SectionTitle: React.FC<{ children: React.ReactNode; subtitle?: string }> = ({ children, subtitle }) => (
  <Box sx={{ mb: 2 }}>
    <Typography sx={{ fontSize: 16, fontWeight: 700, color: appColors.textPrimary }}>{children}</Typography>
    {subtitle && (
      <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.25 }}>{subtitle}</Typography>
    )}
  </Box>
);

const getInitials = (firstName: string, lastName: string) => {
  const first = firstName?.trim()?.[0] ?? '';
  const last = lastName?.trim()?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || 'CL';
};

export const ClientForm: React.FC<ClientFormProps> = ({
  open,
  title,
  client,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const initialValues: CreateClientFormData = client
    ? {
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        email: client.email || '',
        address: client.address || '',
        birthday: client.birthday || '',
        preferences: client.preferences || '',
        paymentMethod: client.paymentMethod ?? 'None',
        active: client.active ?? true,
      }
    : {
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        birthday: '',
        preferences: '',
        paymentMethod: 'None',
        active: true,
      };

  const form = useForm(initialValues, createClientSchema);
  const isEditing = Boolean(client?.id);
  const fullName = `${form.values.firstName} ${form.values.lastName}`.trim() || 'Nuevo cliente';
  const isActive = form.values.active ?? true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await form.validate();
    if (!isValid) return;

    try {
      await onSubmit({
        ...form.values,
        birthday: form.values.birthday || undefined,
      });
      form.reset();
      onClose();
    } catch {
      // Error ya manejado por el hook
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
        {/* Hero */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              flexShrink: 0,
              borderRadius: '50%',
              border: `2px solid ${appColors.accent}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: appColors.background,
            }}
          >
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.accent }}>
              {getInitials(form.values.firstName, form.values.lastName)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
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
              {isEditing ? 'Editar cliente' : 'Nuevo cliente'}
            </Typography>
            <Typography noWrap sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary }}>
              {title || fullName}
            </Typography>
            {isEditing && (
              <Box
                sx={{
                  display: 'inline-flex',
                  mt: 0.5,
                  borderRadius: '999px',
                  px: 1.25,
                  py: 0.375,
                  backgroundColor: isActive ? appColors.accent : appColors.border,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isActive ? appColors.onAccent : appColors.textSecondary,
                  }}
                >
                  {isActive ? 'Activo' : 'Inactivo'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <form id="client-form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Identidad */}
            <Box>
              <SectionTitle subtitle="Datos básicos de contacto">Identidad</SectionTitle>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
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
                    sx={{ ...inputSx, flex: 1 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon sx={{ color: appColors.textSecondary }} />
                        </InputAdornment>
                      ),
                    }}
                  />
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
                    sx={{ ...inputSx, flex: 1 }}
                  />
                </Box>

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
                  sx={inputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon sx={{ color: appColors.textSecondary }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>

            {/* Detalles de perfil */}
            <Box>
              <SectionTitle subtitle="Información adicional del cliente">Detalles de perfil</SectionTitle>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  sx={inputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HomeOutlinedIcon sx={{ color: appColors.textSecondary }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <FormTextField
                  id="birthday"
                  label="Fecha de cumpleaños"
                  type="date"
                  value={form.values.birthday}
                  onChange={(e) => form.setFieldValue('birthday', e.target.value)}
                  onBlur={() => form.setFieldTouched('birthday', true)}
                  error={form.errors.birthday}
                  isTouched={form.touched.has('birthday')}
                  disabled={isLoading}
                  InputLabelProps={{ shrink: true }}
                  sx={inputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CakeOutlinedIcon sx={{ color: appColors.textSecondary }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <FormTextField
                  id="preferences"
                  label="Preferencias"
                  placeholder="Notas sobre estilo, alergias, preferencias..."
                  value={form.values.preferences}
                  onChange={(e) => form.setFieldValue('preferences', e.target.value)}
                  onBlur={() => form.setFieldTouched('preferences', true)}
                  error={form.errors.preferences}
                  isTouched={form.touched.has('preferences')}
                  disabled={isLoading}
                  multiline
                  rows={3}
                  sx={inputSx}
                />
              </Box>
            </Box>

            {/* Preferencias de pago y estado */}
            <Box>
              <SectionTitle subtitle="Método de pago preferido y estado del cliente">Preferencias</SectionTitle>

              <Typography sx={{ fontSize: 12, fontWeight: 600, color: appColors.textSecondary, mb: 1 }}>
                Método de pago
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
                {PAYMENT_OPTIONS.map((method) => (
                  <Pill
                    key={method}
                    label={CLIENT_CONSTANTS.PAYMENT_METHOD_LABELS[method]}
                    active={form.values.paymentMethod === method}
                    disabled={isLoading}
                    onClick={() => form.setFieldValue('paymentMethod', method)}
                  />
                ))}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: appColors.surfaceElevated,
                  border: `1px solid ${appColors.border}`,
                  borderRadius: '14px',
                  px: 2,
                  py: 1.5,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: appColors.textPrimary }}>
                    Cliente activo
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: appColors.textSecondary }}>
                    Clientes inactivos no aparecen en las búsquedas rápidas
                  </Typography>
                </Box>
                <Switch
                  checked={isActive}
                  onChange={(e) => form.setFieldValue('active', e.target.checked)}
                  disabled={isLoading}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: appColors.accent },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: appColors.accent,
                    },
                  }}
                />
              </Box>
            </Box>

            {isEditing && client?.id && <ClientAppointmentHistory clientId={client.id} />}

            {/* Acciones */}
            <Box sx={{ display: 'flex', gap: 1.25, mt: 1 }}>
              <Box
                component="button"
                type="submit"
                form="client-form"
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
                {isLoading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear cliente'}
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
      </DialogContent>
    </Dialog>
  );
};

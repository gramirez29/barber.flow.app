import React, { useState } from 'react';
import { Box, Dialog, DialogContent, Typography, InputAdornment, CircularProgress, Switch, Stack } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { FormTextField } from '@presentation/components/shared/FormTextField';
import { useForm } from '@presentation/hooks/useForm';
import {
  createBarberSchema,
  updateBarberSchema,
  CreateBarberFormData,
} from '@shared/validation/barberSchemas';
import { Barber } from '@domain/entities/Barber';
import { useBarbers } from '@presentation/hooks/useBarbers';
import { useConfirmDialog } from '@presentation/context/ConfirmDialogContext';
import { appColors } from '@presentation/theme/appColors';
import { scrollbarSx } from '@presentation/theme/scrollbarSx';

interface ApplicationUsersDialogProps {
  open: boolean;
  onClose: () => void;
}

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

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    sx={{
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.8px',
      textTransform: 'uppercase',
      color: appColors.accent,
      mb: 1.25,
      mt: 2,
    }}
  >
    {children}
  </Typography>
);

const emptyFormValues: CreateBarberFormData = {
  userName: '',
  userPhone: '',
  userEmail: '',
  barberName: '',
  barberPhone: '',
  barberShopName: '',
  barberShopPhone: '',
  address: '',
  password: '',
};

export const ApplicationUsersDialog: React.FC<ApplicationUsersDialogProps> = ({ open, onClose }) => {
  const { searchBarbers, createBarber, updateBarber, deleteBarber, setBlocked } = useBarbers();
  const { confirm } = useConfirmDialog();

  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingIsBlocked, setEditingIsBlocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(false);
  const [blockToggleLoading, setBlockToggleLoading] = useState(false);

  const form = useForm<CreateBarberFormData>(emptyFormValues, mode === 'edit' ? updateBarberSchema : createBarberSchema);

  const resetForm = () => {
    form.reset(emptyFormValues);
    setMode('create');
    setEditingId(null);
    setEditingUserId(null);
    setEditingIsBlocked(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  const loadBarberIntoForm = (barber: Barber) => {
    form.reset({
      userName: barber.userName,
      userPhone: barber.userPhone,
      userEmail: barber.userEmail,
      barberName: barber.barberName,
      barberPhone: barber.barberPhone,
      barberShopName: barber.barberShopName ?? '',
      barberShopPhone: barber.barberShopPhone ?? '',
      address: barber.address ?? '',
      password: '',
    });
    setMode('edit');
    setEditingId(barber.id);
    setEditingUserId(barber.userId ?? null);
    setEditingIsBlocked(barber.isBlocked ?? false);
  };

  // Hint de UI únicamente (mismo username de fallback que usa el backend) — el
  // rechazo real de bloquear a la cuenta admin siempre se enforce del lado del servidor.
  const isAdminAccount = form.values.userName.trim().toLowerCase() === 'admin';

  const handleToggleBlocked = async () => {
    if (!editingUserId) return;
    const nextValue = !editingIsBlocked;
    setBlockToggleLoading(true);
    try {
      await setBlocked(editingUserId, nextValue);
      setEditingIsBlocked(nextValue);
    } catch {
      // El error ya se notificó vía useNotification dentro de setBlocked.
    } finally {
      setBlockToggleLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const results = await searchBarbers(searchQuery.trim());
      setSearchResults(results);
      if (results.length === 1) {
        loadBarberIntoForm(results[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (barber: Barber) => {
    loadBarberIntoForm(barber);
    setSearchResults([barber]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await form.validate();
    if (!isValid) return;

    setLoading(true);
    try {
      const { password, ...rest } = form.values;
      const request = {
        ...rest,
        ...(password ? { password } : {}),
      };

      if (mode === 'edit' && editingId) {
        await updateBarber(editingId, request);
      } else {
        await createBarber(request);
        resetForm();
        setLoading(false);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (mode !== 'edit' || !editingId) return;
    const confirmed = await confirm({
      title: 'Eliminar usuario de aplicación',
      message: '¿Eliminar este usuario de aplicación? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteBarber(editingId);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
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
          Herramientas de administración
        </Typography>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary, mb: 2 }}>
          Administrar usuarios de la aplicación
        </Typography>

        {/* Buscador */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: appColors.surfaceElevated,
            borderRadius: '12px',
            border: `1px solid ${appColors.border}`,
            px: 1.5,
            mb: 1.5,
          }}
        >
          <SearchIcon sx={{ color: appColors.textSecondary, fontSize: 20, mr: 1 }} />
          <Box
            component="input"
            placeholder="Buscar por ID de barbero, correo o teléfono"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSearch();
              }
            }}
            sx={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              py: 1.25,
              fontSize: 15,
              color: appColors.textPrimary,
              fontFamily: 'inherit',
            }}
          />
          <Box
            component="button"
            type="button"
            onClick={() => void handleSearch()}
            disabled={loading}
            sx={{
              border: 'none',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: appColors.accent,
              fontSize: 13,
              fontWeight: 700,
              py: 1,
            }}
          >
            Buscar
          </Box>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={18} sx={{ color: appColors.accent }} />
          </Box>
        )}

        {searchResults.length > 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
            {searchResults.slice(0, 3).map((result) => (
              <Box
                key={result.id}
                component="button"
                type="button"
                onClick={() => handleSelectResult(result)}
                sx={{
                  textAlign: 'left',
                  border: `1px solid ${appColors.border}`,
                  backgroundColor: appColors.surfaceElevated,
                  borderRadius: '10px',
                  px: 1.5,
                  py: 1,
                  cursor: 'pointer',
                  color: appColors.textPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {result.id} — {result.barberName}
              </Box>
            ))}
          </Box>
        )}

        <form id="barber-form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <SectionLabel>Perfil del barbero</SectionLabel>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {editingId && (
                <FormTextField
                  id="barberId"
                  label="ID del barbero"
                  value={editingId}
                  disabled
                  sx={inputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeOutlinedIcon sx={{ color: appColors.textSecondary }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <FormTextField
                id="barberName"
                label="Nombre completo del barbero"
                value={form.values.barberName}
                onChange={(e) => form.setFieldValue('barberName', e.target.value)}
                onBlur={() => form.setFieldTouched('barberName', true)}
                error={form.errors.barberName}
                isTouched={form.touched.has('barberName')}
                disabled={loading}
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: appColors.textSecondary }} />
                    </InputAdornment>
                  ),
                }}
              />

              <FormTextField
                id="barberPhone"
                label="Teléfono del barbero"
                placeholder="1234-5678"
                value={form.values.barberPhone}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length > 4) value = value.slice(0, 4) + '-' + value.slice(4, 8);
                  form.setFieldValue('barberPhone', value);
                }}
                onBlur={() => form.setFieldTouched('barberPhone', true)}
                error={form.errors.barberPhone}
                isTouched={form.touched.has('barberPhone')}
                disabled={loading}
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
                id="userEmail"
                label="Correo"
                type="email"
                value={form.values.userEmail}
                onChange={(e) => form.setFieldValue('userEmail', e.target.value)}
                onBlur={() => form.setFieldTouched('userEmail', true)}
                error={form.errors.userEmail}
                isTouched={form.touched.has('userEmail')}
                disabled={loading}
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: appColors.textSecondary }} />
                    </InputAdornment>
                  ),
                }}
              />

              <FormTextField
                id="userPhone"
                label="Teléfono de contacto"
                placeholder="1234-5678"
                value={form.values.userPhone}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length > 4) value = value.slice(0, 4) + '-' + value.slice(4, 8);
                  form.setFieldValue('userPhone', value);
                }}
                onBlur={() => form.setFieldTouched('userPhone', true)}
                error={form.errors.userPhone}
                isTouched={form.touched.has('userPhone')}
                disabled={loading}
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
            </Box>

            <SectionLabel>Información de la barbería</SectionLabel>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormTextField
                id="barberShopName"
                label="Nombre de la barbería"
                value={form.values.barberShopName}
                onChange={(e) => form.setFieldValue('barberShopName', e.target.value)}
                onBlur={() => form.setFieldTouched('barberShopName', true)}
                error={form.errors.barberShopName}
                isTouched={form.touched.has('barberShopName')}
                disabled={loading}
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <StorefrontOutlinedIcon sx={{ color: appColors.textSecondary }} />
                    </InputAdornment>
                  ),
                }}
              />

              <FormTextField
                id="barberShopPhone"
                label="Teléfono de la barbería"
                placeholder="1234-5678"
                value={form.values.barberShopPhone}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length > 4) value = value.slice(0, 4) + '-' + value.slice(4, 8);
                  form.setFieldValue('barberShopPhone', value);
                }}
                onBlur={() => form.setFieldTouched('barberShopPhone', true)}
                error={form.errors.barberShopPhone}
                isTouched={form.touched.has('barberShopPhone')}
                disabled={loading}
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
                id="address"
                label="Dirección"
                value={form.values.address}
                onChange={(e) => form.setFieldValue('address', e.target.value)}
                onBlur={() => form.setFieldTouched('address', true)}
                error={form.errors.address}
                isTouched={form.touched.has('address')}
                disabled={loading}
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
            </Box>

            <SectionLabel>Información de acceso</SectionLabel>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormTextField
                id="userName"
                label="Usuario"
                value={form.values.userName}
                onChange={(e) => form.setFieldValue('userName', e.target.value)}
                onBlur={() => form.setFieldTouched('userName', true)}
                error={form.errors.userName}
                isTouched={form.touched.has('userName')}
                disabled={loading}
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: appColors.textSecondary }} />
                    </InputAdornment>
                  ),
                }}
              />

              <FormTextField
                id="password"
                label={mode === 'edit' ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                type="password"
                value={form.values.password}
                onChange={(e) => form.setFieldValue('password', e.target.value)}
                onBlur={() => form.setFieldTouched('password', true)}
                error={form.errors.password}
                isTouched={form.touched.has('password')}
                disabled={loading}
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: appColors.textSecondary }} />
                    </InputAdornment>
                  ),
                }}
              />

              {mode === 'edit' && editingUserId && !isAdminAccount && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: appColors.surfaceElevated,
                    border: `1px solid ${editingIsBlocked ? appColors.error : appColors.border}`,
                    borderRadius: '12px',
                    px: 2,
                    py: 1,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: appColors.textPrimary }}>
                      Cuenta bloqueada
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: appColors.textSecondary }}>
                      {editingIsBlocked
                        ? 'Sin acceso a la app por falta de pago.'
                        : 'Bloquea el acceso a toda la app por falta de pago.'}
                    </Typography>
                  </Box>
                  <Switch
                    checked={editingIsBlocked}
                    onChange={() => void handleToggleBlocked()}
                    disabled={blockToggleLoading || loading}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: appColors.error },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: appColors.error },
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Acciones */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2.5 }}>
              <Box
                component="button"
                type="submit"
                form="barber-form"
                disabled={loading}
                sx={{
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: appColors.accent,
                  color: appColors.onAccent,
                  borderRadius: '12px',
                  py: 1.5,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                  opacity: loading ? 0.6 : 1,
                  '&:hover': { backgroundColor: appColors.accentLight },
                }}
              >
                {loading ? (
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <CircularProgress size={18} sx={{ color: appColors.onAccent }} />
                    <span>Guardando...</span>
                  </Stack>
                ) : mode === 'edit' ? (
                  'Actualizar usuario'
                ) : (
                  'Crear usuario'
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box
                  component="button"
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  sx={{
                    flex: 1,
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: appColors.textSecondary,
                    border: `1px solid ${appColors.border}`,
                    borderRadius: '12px',
                    py: 1.25,
                    fontSize: 14,
                    fontWeight: 600,
                    '&:hover': { borderColor: appColors.accent },
                  }}
                >
                  Restablecer
                </Box>
                <Box
                  component="button"
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={mode !== 'edit' || loading}
                  sx={{
                    flex: 1,
                    cursor: mode === 'edit' ? 'pointer' : 'default',
                    backgroundColor: 'transparent',
                    color: appColors.error,
                    border: `1px solid ${appColors.error}`,
                    borderRadius: '12px',
                    py: 1.25,
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: mode === 'edit' ? 1 : 0.4,
                  }}
                >
                  Eliminar
                </Box>
              </Box>
              <Box
                component="button"
                type="button"
                onClick={handleClose}
                disabled={loading}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: appColors.textSecondary,
                  border: 'none',
                  py: 1,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Cerrar
              </Box>
            </Box>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
};

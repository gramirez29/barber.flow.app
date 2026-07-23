import React, { useState } from 'react';
import {
  Container,
  Box,
  Button,
  Typography,
  Card,
  CircularProgress,
  Alert,
  Link as MuiLink,
  Stack,
  LinearProgress,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '@presentation/context/NotificationContext';
import { FormTextField } from '@presentation/components/shared/FormTextField';
import { useForm } from '@presentation/hooks/useForm';
import {
  resetPasswordSchema,
  ResetPasswordFormData,
} from '@shared/validation/authSchemas';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface LocationState {
  email?: string;
  otp?: string;
}

/**
 * ResetPasswordForm: Componente para cambiar contraseña con validación OTP
 *
 * Features:
 * - Validación de contraseña fuerte (mayúsculas, minúsculas, números)
 * - Confirmación de contraseña
 * - Indicador visual de fortaleza de contraseña
 * - Validación de OTP
 */
export const ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const state = location.state as LocationState;

  const form = useForm<ResetPasswordFormData>(
    {
      email: state?.email || '',
      otp: state?.otp || '',
      newPassword: '',
      confirmPassword: '',
    },
    resetPasswordSchema
  );

  // Calcular fortaleza de contraseña
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    let strength = 0;

    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;

    return Math.min(strength, 100);
  };

  const passwordStrength = calculatePasswordStrength(form.values.newPassword);

  const getPasswordStrengthColor = (): 'error' | 'warning' | 'success' => {
    if (passwordStrength < 50) return 'error';
    if (passwordStrength < 75) return 'warning';
    return 'success';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const isValid = await form.validate();
    if (!isValid) {
      showNotification('Por favor completa los campos correctamente', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Llamar al backend para resetear la contraseña
      // await authRepository.resetPassword(form.values);
      setResetSuccess(true);
      showNotification('Contraseña actualizada correctamente', 'success');

      // Redirigir a login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al actualizar la contraseña';
      setGeneralError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Card
          sx={{
            width: '100%',
            p: 4,
            borderRadius: 3,
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 8px 24px rgba(0, 0, 0, 0.5)'
                : '0 8px 24px rgba(0, 0, 0, 0.12)',
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              Cambiar Contraseña
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Ingresa tu nueva contraseña
            </Typography>
          </Box>

          {/* Success State */}
          {resetSuccess && (
            <Alert
              icon={<CheckCircleIcon />}
              severity="success"
              sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
            >
              <Stack sx={{ width: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  ¡Contraseña actualizada!
                </Typography>
                <Typography variant="caption">
                  Redirigiendo al login...
                </Typography>
              </Stack>
            </Alert>
          )}

          {/* Error General */}
          {generalError && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setGeneralError(null)}
            >
              {generalError}
            </Alert>
          )}

          {!resetSuccess && (
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
            >
              {/* New Password */}
              <Box>
                <FormTextField
                  id="newPassword"
                  label="Nueva Contraseña"
                  type="password"
                  placeholder="Ingresa tu nueva contraseña"
                  value={form.values.newPassword}
                  onChange={(e) => form.setFieldValue('newPassword', e.target.value)}
                  onBlur={() => form.setFieldTouched('newPassword', true)}
                  error={form.errors.newPassword}
                  isTouched={form.touched.has('newPassword')}
                  disabled={isLoading}
                  autoFocus
                  autoComplete="new-password"
                  helperText="Mín. 6 caracteres con mayúsculas, minúsculas y números"
                />

                {/* Password Strength Indicator */}
                {form.values.newPassword && (
                  <Box sx={{ mt: 1.5 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="caption" color="textSecondary">
                        Fortaleza:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {passwordStrength < 50
                          ? 'Débil'
                          : passwordStrength < 75
                            ? 'Media'
                            : 'Fuerte'}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength}
                      color={getPasswordStrengthColor()}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                )}
              </Box>

              {/* Confirm Password */}
              <FormTextField
                id="confirmPassword"
                label="Confirmar Contraseña"
                type="password"
                placeholder="Confirma tu contraseña"
                value={form.values.confirmPassword}
                onChange={(e) => form.setFieldValue('confirmPassword', e.target.value)}
                onBlur={() => form.setFieldTouched('confirmPassword', true)}
                error={form.errors.confirmPassword}
                isTouched={form.touched.has('confirmPassword')}
                disabled={isLoading}
                autoComplete="new-password"
              />

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading || form.isValidating}
                sx={{
                  py: 1.75,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {isLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={20} color="inherit" />
                    <span>Actualizando...</span>
                  </Stack>
                ) : (
                  'Actualizar Contraseña'
                )}
              </Button>

              {/* Back to Login */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <MuiLink
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                  type="button"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    color: 'primary.main',
                    fontWeight: 600,
                    transition: 'color 0.2s ease',
                    '&:hover': {
                      color: 'primary.dark',
                    },
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 18 }} />
                  Volver al login
                </MuiLink>
              </Box>
            </Box>
          )}
        </Card>
      </Box>
    </Container>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Stack, InputAdornment, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '@presentation/context/NotificationContext';
import { FormTextField } from '@presentation/components/shared/FormTextField';
import { useForm } from '@presentation/hooks/useForm';
import { resetPasswordSchema, ResetPasswordFormData } from '@shared/validation/authSchemas';
import { ForgotPasswordUseCase } from '@application/use-cases/auth';
import { AuthApi } from '@infrastructure/api/AuthApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';
import { loginColors } from './loginTheme';

interface LocationState {
  email?: string;
  otp?: string;
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: loginColors.surfaceElevated,
    borderRadius: '12px',
    fontSize: '15px',
    color: loginColors.textPrimary,
    '& fieldset': { borderColor: loginColors.border },
    '&:hover fieldset': { borderColor: loginColors.accent },
    '&.Mui-focused fieldset': { borderColor: loginColors.accent },
  },
  '& .MuiInputLabel-root': {
    color: loginColors.textSecondary,
    '&.Mui-focused': { color: loginColors.accent },
  },
};

export const ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const state = location.state as LocationState;
  const email = state?.email;
  const otp = state?.otp;

  const forgotPasswordUseCase = useMemo(() => new ForgotPasswordUseCase(new AuthApi(new AxiosHttpClient())), []);

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, otp]);

  const form = useForm<ResetPasswordFormData>(
    { email: email || '', otp: otp || '', newPassword: '', confirmPassword: '' },
    resetPasswordSchema
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const isValid = await form.validate();
    if (!isValid) {
      setGeneralError('Por favor completa los campos correctamente');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPasswordUseCase.resetPassword({
        email: form.values.email,
        otpCode: form.values.otp,
        newPassword: form.values.newPassword,
      });
      showNotification('Contraseña actualizada correctamente', 'success');
      navigate('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la contraseña';
      setGeneralError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', backgroundColor: loginColors.background, display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 520, px: 3, py: 4 }}>
        <IconButton onClick={() => navigate('/login')} sx={{ color: loginColors.textPrimary, mb: 4, ml: -1 }}>
          <ArrowBackIcon />
        </IconButton>

        <Typography sx={{ color: loginColors.textPrimary, fontSize: 28, fontWeight: 700, mb: 1 }}>
          Nueva contraseña
        </Typography>
        <Typography sx={{ color: loginColors.textSecondary, fontSize: 15, lineHeight: '22px', mb: 5 }}>
          Crea una contraseña segura para tu cuenta.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormTextField
            id="newPassword"
            label="Nueva contraseña"
            type={showPassword ? 'text' : 'password'}
            value={form.values.newPassword}
            onChange={(e) => form.setFieldValue('newPassword', e.target.value)}
            onBlur={() => form.setFieldTouched('newPassword', true)}
            error={form.errors.newPassword}
            isTouched={form.touched.has('newPassword')}
            disabled={isLoading}
            autoFocus
            autoComplete="new-password"
            sx={inputSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: loginColors.textSecondary }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    size="small"
                    sx={{ color: loginColors.textSecondary }}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormTextField
            id="confirmPassword"
            label="Confirmar contraseña"
            type={showPassword ? 'text' : 'password'}
            value={form.values.confirmPassword}
            onChange={(e) => form.setFieldValue('confirmPassword', e.target.value)}
            onBlur={() => form.setFieldTouched('confirmPassword', true)}
            error={form.errors.confirmPassword}
            isTouched={form.touched.has('confirmPassword')}
            disabled={isLoading}
            autoComplete="new-password"
            sx={inputSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: loginColors.textSecondary }} />
                </InputAdornment>
              ),
            }}
          />

          {generalError && (
            <Typography sx={{ color: loginColors.error, fontSize: 13 }}>{generalError}</Typography>
          )}

          <Button
            type="submit"
            disabled={isLoading || form.isValidating}
            sx={{
              height: 56,
              borderRadius: '12px',
              mt: 1,
              backgroundColor: loginColors.accent,
              color: loginColors.onAccent,
              fontSize: 16,
              fontWeight: 700,
              '&:hover': { backgroundColor: loginColors.accentLight },
              '&.Mui-disabled': { backgroundColor: loginColors.accent, opacity: 0.6, color: loginColors.onAccent },
            }}
          >
            {isLoading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} sx={{ color: loginColors.onAccent }} />
                <span>Guardando...</span>
              </Stack>
            ) : (
              'Guardar y entrar'
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

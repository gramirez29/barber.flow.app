import React, { useMemo, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Link as MuiLink, Stack, InputAdornment, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '@presentation/context/NotificationContext';
import { FormTextField } from '@presentation/components/shared/FormTextField';
import { useForm } from '@presentation/hooks/useForm';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@shared/validation/authSchemas';
import { ForgotPasswordUseCase } from '@application/use-cases/auth';
import { AuthApi } from '@infrastructure/api/AuthApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';
import { loginColors } from './loginTheme';

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
  '& .MuiInputBase-input::placeholder': { color: loginColors.textSecondary, opacity: 1 },
};

export const ForgotPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const forgotPasswordUseCase = useMemo(() => new ForgotPasswordUseCase(new AuthApi(new AxiosHttpClient())), []);

  const form = useForm<ForgotPasswordFormData>({ email: '' }, forgotPasswordSchema);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const isValid = await form.validate();
    if (!isValid) {
      setGeneralError('Ingresa un email válido.');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPasswordUseCase.requestOtp({ email: form.values.email });
      showNotification('Código enviado a tu email', 'success');
      navigate('/verify-otp', { state: { email: form.values.email } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al enviar el código';
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
          ¿Olvidaste tu contraseña?
        </Typography>
        <Typography sx={{ color: loginColors.textSecondary, fontSize: 15, lineHeight: '22px', mb: 5 }}>
          Introduce tu correo electrónico y te enviaremos un código para restablecerla.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormTextField
            id="email"
            label="Ingresa el correo"
            type="email"
            placeholder="tu@email.com"
            value={form.values.email}
            onChange={(e) => form.setFieldValue('email', e.target.value)}
            onBlur={() => form.setFieldTouched('email', true)}
            error={form.errors.email}
            isTouched={form.touched.has('email')}
            disabled={isLoading}
            autoFocus
            autoComplete="email"
            sx={inputSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ color: loginColors.textSecondary }} />
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
                <span>Enviando...</span>
              </Stack>
            ) : (
              'Enviar código'
            )}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2.5 }}>
            <MuiLink
              component="button"
              type="button"
              onClick={() => navigate('/login')}
              sx={{ color: loginColors.textSecondary, fontSize: 14, cursor: 'pointer', textDecoration: 'none' }}
            >
              Volver al inicio
            </MuiLink>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

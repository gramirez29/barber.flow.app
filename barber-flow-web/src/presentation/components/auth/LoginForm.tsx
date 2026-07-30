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
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@presentation/context/AuthContext';
import { useNotification } from '@presentation/context/NotificationContext';
import { FormTextField } from '@presentation/components/shared/FormTextField';
import { useForm } from '@presentation/hooks/useForm';
import { loginSchema, LoginFormData } from '@shared/validation/authSchemas';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<LoginFormData>(
    { userName: '', password: '' },
    loginSchema
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Validar formulario
    const isValid = await form.validate();
    if (!isValid) {
      showNotification('Por favor completa los campos correctamente', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await login(form.values.userName, form.values.password);
      showNotification('¡Bienvenido!', 'success');
      form.reset();
      navigate('/dashboard');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al iniciar sesión. Por favor intenta de nuevo.';
      setGeneralError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof LoginFormData, value: string) => {
    form.setFieldValue(field, value);
  };

  const handleFieldBlur = (field: keyof LoginFormData) => {
    form.setFieldTouched(field, true);
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
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                background: 'linear-gradient(135deg, #C9A84C 0%, #E5C878 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Barber Flow
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Gestiona tu barbería de forma inteligente
            </Typography>
          </Box>

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

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            <FormTextField
              id="userName"
              label="Usuario"
              type="text"
              placeholder="Ingresa tu usuario"
              value={form.values.userName}
              onChange={(e) => handleFieldChange('userName', e.target.value)}
              onBlur={() => handleFieldBlur('userName')}
              error={form.errors.userName}
              isTouched={form.touched.has('userName')}
              disabled={isLoading}
              autoFocus
              autoComplete="username"
              aria-label="Usuario"
              inputProps={{
                'aria-describedby': form.errors.userName ? 'userName-error' : undefined,
              }}
            />

            <FormTextField
              id="password"
              label="Contraseña"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={form.values.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              onBlur={() => handleFieldBlur('password')}
              error={form.errors.password}
              isTouched={form.touched.has('password')}
              disabled={isLoading}
              autoComplete="current-password"
              aria-label="Contraseña"
              inputProps={{
                'aria-describedby': form.errors.password ? 'password-error' : undefined,
              }}
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
                transition: 'all 0.3s ease',
                '&:hover:not(:disabled)': {
                  transform: 'translateY(-2px)',
                  boxShadow: (theme) => `0 12px 24px ${theme.palette.primary.main}40`,
                },
              }}
            >
              {isLoading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={20} color="inherit" />
                  <span>Iniciando sesión...</span>
                </Stack>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            {/* Forgot Password Link */}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                ¿Olvidaste tu contraseña?
              </Typography>
              <MuiLink
                href="/forgot-password"
                underline="hover"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: 'primary.dark',
                  },
                }}
              >
                Recuperar contraseña
              </MuiLink>
            </Box>
          </Box>
        </Card>
      </Box>
    </Container>
  );
};

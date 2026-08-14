import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Link as MuiLink,
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@presentation/context/AuthContext';
import { useNotification } from '@presentation/context/NotificationContext';
import { FormTextField } from '@presentation/components/shared/FormTextField';
import { useForm } from '@presentation/hooks/useForm';
import { loginSchema, LoginFormData } from '@shared/validation/authSchemas';
import { loginColors } from './loginTheme';
import heroImage from '@/assets/images/barber-flow-background-image.jpg';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: loginColors.surfaceElevated,
    borderRadius: '12px',
    fontSize: '15px',
    color: loginColors.textPrimary,
    '& fieldset': {
      borderColor: loginColors.border,
    },
    '&:hover fieldset': {
      borderColor: loginColors.accent,
    },
    '&.Mui-focused fieldset': {
      borderColor: loginColors.accent,
    },
  },
  '& .MuiInputLabel-root': {
    color: loginColors.textSecondary,
    '&.Mui-focused': {
      color: loginColors.accent,
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: loginColors.textSecondary,
    opacity: 1,
  },
};

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>(
    { userName: '', password: '' },
    loginSchema
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const isValid = await form.validate();
    if (!isValid) {
      setGeneralError('Ingresa el usuario y la contraseña.');
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
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: loginColors.background,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column' }}>
        {/* Hero */}
        <Box
          sx={{
            width: '100%',
            height: 'clamp(280px, 46vh, 380px)',
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <Box
            sx={{
              height: '100%',
              backgroundColor: loginColors.overlay,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              px: 3,
              pb: 6,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: 2.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '18px',
                  backgroundColor: loginColors.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ContentCutIcon sx={{ fontSize: 18, color: loginColors.onAccent }} />
              </Box>
              <Typography
                sx={{
                  color: loginColors.accent,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '3px',
                }}
              >
                BARBER FLOW
              </Typography>
            </Box>

            <Typography
              sx={{
                color: loginColors.textPrimary,
                fontSize: 26,
                fontWeight: 700,
                lineHeight: '33px',
                mb: 1.25,
              }}
            >
              Gestiona tu barbería con confianza.
            </Typography>

            <Typography
              sx={{
                color: loginColors.heroBodyText,
                fontSize: 14,
                lineHeight: '21px',
                mb: 2.25,
              }}
            >
              Inicia sesión para acceder a citas, fichas de clientes, notificaciones y ajustes
              operativos desde un único espacio profesional.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['Citas', 'Clientes', 'Notificaciones'].map((label) => (
                <Box
                  key={label}
                  sx={{
                    border: `1px solid ${loginColors.accent}`,
                    borderRadius: '999px',
                    px: 1.5,
                    py: 0.6,
                    backgroundColor: `${loginColors.accent}1a`,
                  }}
                >
                  <Typography
                    sx={{
                      color: loginColors.accentLight,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.4px',
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Card */}
        <Box
          sx={{
            backgroundColor: loginColors.surface,
            borderRadius: '28px 28px 0 0',
            mt: '-28px',
            px: 3,
            pt: 2,
            pb: 4,
            flex: 1,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: '2px',
              backgroundColor: loginColors.border,
              mx: 'auto',
              mb: 3,
            }}
          />

          <Typography
            sx={{
              color: loginColors.accent,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              mb: 0.75,
            }}
          >
            Acceso seguro
          </Typography>
          <Typography
            sx={{ color: loginColors.textPrimary, fontSize: 26, fontWeight: 700, mb: 0.75 }}
          >
            Bienvenido de nuevo
          </Typography>
          <Typography
            sx={{
              color: loginColors.textSecondary,
              fontSize: 14,
              lineHeight: '21px',
              mb: 3.5,
            }}
          >
            Ingresa para continuar
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2.5 }}
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
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: loginColors.textSecondary }} />
                  </InputAdornment>
                ),
              }}
            />

            <FormTextField
              id="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ingresa tu contraseña"
              value={form.values.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              onBlur={() => handleFieldBlur('password')}
              error={form.errors.password}
              isTouched={form.touched.has('password')}
              disabled={isLoading}
              autoComplete="current-password"
              aria-label="Contraseña"
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
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      sx={{ color: loginColors.textSecondary }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {generalError && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  backgroundColor: loginColors.errorBg,
                  border: `1px solid ${loginColors.error}`,
                  borderRadius: '12px',
                  p: 1.5,
                }}
              >
                <ErrorOutlineIcon sx={{ color: loginColors.error, fontSize: 20, mt: '1px' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      color: loginColors.error,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      mb: 0.25,
                    }}
                  >
                    Autenticación fallida
                  </Typography>
                  <Typography sx={{ color: loginColors.error, fontSize: 13, lineHeight: '19px' }}>
                    {generalError}
                  </Typography>
                </Box>
              </Box>
            )}

            <Button
              type="submit"
              disabled={isLoading || form.isValidating}
              sx={{
                height: 54,
                borderRadius: '14px',
                backgroundColor: loginColors.accent,
                color: loginColors.onAccent,
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                boxShadow: `0 4px 10px 0 ${loginColors.accent}66`,
                '&:hover': {
                  backgroundColor: loginColors.accentLight,
                  boxShadow: `0 4px 10px 0 ${loginColors.accent}66`,
                },
                '&.Mui-disabled': {
                  backgroundColor: loginColors.accent,
                  opacity: 0.8,
                  color: loginColors.onAccent,
                },
              }}
            >
              {isLoading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={18} sx={{ color: loginColors.onAccent }} />
                  <span>Iniciando...</span>
                </Stack>
              ) : (
                'Ingresar'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', pt: 1, pb: 1.5 }}>
              <MuiLink
                href="/forgot-password"
                underline="always"
                sx={{
                  color: loginColors.textSecondary,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                ¿Olvidaste tu contraseña?
              </MuiLink>
            </Box>
          </Box>

          <Typography
            sx={{
              color: loginColors.textSecondary,
              fontSize: 13,
              lineHeight: '18px',
              textAlign: 'center',
            }}
          >
            Tu sesión se almacena de forma segura en este dispositivo después de iniciar sesión
            correctamente.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

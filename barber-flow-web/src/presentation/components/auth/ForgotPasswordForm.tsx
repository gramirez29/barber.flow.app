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
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '@presentation/context/NotificationContext';
import { FormTextField } from '@presentation/components/shared/FormTextField';
import { useForm } from '@presentation/hooks/useForm';
import {
  forgotPasswordSchema,
  verifyOtpSchema,
  ForgotPasswordFormData,
  VerifyOtpFormData,
} from '@shared/validation/authSchemas';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

type Step = 'email' | 'otp' | 'success';

export const ForgotPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);


  // Email form
  const emailForm = useForm<ForgotPasswordFormData>(
    { email: '' },
    forgotPasswordSchema
  );

  // OTP form
  const otpForm = useForm<VerifyOtpFormData>(
    { email: '', otp: '' },
    verifyOtpSchema
  );

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const isValid = await emailForm.validate();
    if (!isValid) {
      showNotification('Por favor ingresa un email válido', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Llamar al backend para enviar OTP
      // await authRepository.sendPasswordResetOtp(emailForm.values.email);
      otpForm.setFieldValue('email', emailForm.values.email);
      setCurrentStep('otp');
      showNotification('Código OTP enviado a tu email', 'success');
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al enviar el código OTP';
      setGeneralError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const isValid = await otpForm.validate();
    if (!isValid) {
      showNotification('Por favor completa los campos correctamente', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Llamar al backend para verificar OTP
      // await authRepository.verifyPasswordResetOtp(otpForm.values);
      setCurrentStep('success');
      showNotification('Código verificado correctamente', 'success');

      // Redirigir a reset password después de 2 segundos
      setTimeout(() => {
        navigate('/reset-password', {
          state: {
            email: otpForm.values.email,
            otp: otpForm.values.otp,
          },
        });
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.message || 'Código OTP inválido o expirado';
      setGeneralError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'otp') {
      setCurrentStep('email');
      setGeneralError(null);
    } else {
      navigate('/login');
    }
  };

  const getStepIndex = () => {
    if (currentStep === 'email') return 0;
    if (currentStep === 'otp') return 1;
    if (currentStep === 'success') return 2;
    return 0;
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
              Recuperar Contraseña
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {currentStep === 'email' && 'Ingresa tu email para recibir un código'}
              {currentStep === 'otp' && 'Verifica el código enviado a tu email'}
              {currentStep === 'success' && 'Código verificado correctamente'}
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

          {/* Stepper */}
          <Stepper activeStep={getStepIndex()} orientation="vertical" sx={{ mb: 4 }}>
            {/* Paso 1: Email */}
            <Step>
              <StepLabel>Ingresa tu email</StepLabel>
              <StepContent>
                <Box
                  component="form"
                  onSubmit={handleEmailSubmit}
                  noValidate
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  <FormTextField
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="tu@email.com"
                    value={emailForm.values.email}
                    onChange={(e) => emailForm.setFieldValue('email', e.target.value)}
                    onBlur={() => emailForm.setFieldTouched('email', true)}
                    error={emailForm.errors.email}
                    isTouched={emailForm.touched.has('email')}
                    disabled={isLoading}
                    autoFocus
                    autoComplete="email"
                  />

                  <Stack direction="row" spacing={2}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={isLoading || emailForm.isValidating}
                    >
                      {isLoading ? <CircularProgress size={20} /> : 'Enviar código'}
                    </Button>
                  </Stack>
                </Box>
              </StepContent>
            </Step>

            {/* Paso 2: OTP */}
            <Step>
              <StepLabel>Verifica tu código</StepLabel>
              <StepContent>
                <Box
                  component="form"
                  onSubmit={handleOtpSubmit}
                  noValidate
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  <FormTextField
                    id="otp"
                    label="Código OTP"
                    type="text"
                    placeholder="000000"
                    value={otpForm.values.otp}
                    onChange={(e) => otpForm.setFieldValue('otp', e.target.value.slice(0, 6))}
                    onBlur={() => otpForm.setFieldTouched('otp', true)}
                    error={otpForm.errors.otp}
                    isTouched={otpForm.touched.has('otp')}
                    disabled={isLoading}
                    autoFocus
                    inputProps={{
                      maxLength: 6,
                      pattern: '[0-9]*',
                    }}
                  />

                  <Typography variant="caption" color="textSecondary">
                    Revisa tu email para el código de 6 dígitos
                  </Typography>

                  <Stack direction="row" spacing={2}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={isLoading || otpForm.isValidating}
                    >
                      {isLoading ? <CircularProgress size={20} /> : 'Verificar código'}
                    </Button>
                  </Stack>
                </Box>
              </StepContent>
            </Step>

            {/* Paso 3: Success */}
            <Step>
              <StepLabel>Listo</StepLabel>
              <StepContent>
                <Alert severity="success" sx={{ mb: 2 }}>
                  ¡Tu código ha sido verificado correctamente! Redirigiendo...
                </Alert>
              </StepContent>
            </Step>
          </Stepper>

          {/* Back Button */}
          {currentStep !== 'success' && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <MuiLink
                component="button"
                variant="body2"
                onClick={handleBack}
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
                {currentStep === 'email' ? 'Volver al login' : 'Cambiar email'}
              </MuiLink>
            </Box>
          )}
        </Card>
      </Box>
    </Container>
  );
};

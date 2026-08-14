import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '@presentation/context/NotificationContext';
import { ForgotPasswordUseCase } from '@application/use-cases/auth';
import { AuthApi } from '@infrastructure/api/AuthApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';
import { loginColors } from './loginTheme';

interface LocationState {
  email?: string;
}

const RESEND_SECONDS = 60;

export const VerifyOtpForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();

  const state = location.state as LocationState;
  const email = state?.email;

  const forgotPasswordUseCase = useMemo(() => new ForgotPasswordUseCase(new AuthApi(new AxiosHttpClient())), []);

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  useEffect(() => {
    const interval = setInterval(() => setTimer((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);

  const verifyOtp = async (code: string) => {
    if (!email) return;
    setIsLoading(true);
    setError(null);
    try {
      await forgotPasswordUseCase.verifyOtp({ email, otpCode: code });
      navigate('/reset-password', { state: { email, otp: code } });
    } catch {
      setError('El código ingresado es incorrecto o ha expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== '') && index === 5) {
      void verifyOtp(next.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !email) return;
    try {
      await forgotPasswordUseCase.requestOtp({ email });
      setTimer(RESEND_SECONDS);
      showNotification('Código reenviado a tu email', 'success');
    } catch {
      showNotification('No se pudo reenviar el código', 'error');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', backgroundColor: loginColors.background, display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 520, px: 3, py: 4 }}>
        <IconButton onClick={() => navigate('/forgot-password')} sx={{ color: loginColors.textPrimary, mb: 4, ml: -1 }}>
          <ArrowBackIcon />
        </IconButton>

        <Typography sx={{ color: loginColors.textPrimary, fontSize: 28, fontWeight: 700, mb: 1 }}>
          Verifica tu cuenta
        </Typography>
        <Typography sx={{ color: loginColors.textSecondary, fontSize: 15, lineHeight: '22px', mb: 5 }}>
          Hemos enviado un código de 6 dígitos a {email}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 3 }}>
          {digits.map((digit, index) => (
            <Box
              key={index}
              component="input"
              ref={(el: HTMLInputElement | null) => {
                inputsRef.current[index] = el;
              }}
              value={digit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, index)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, index)}
              inputMode="numeric"
              maxLength={1}
              disabled={isLoading}
              sx={{
                width: 45,
                height: 55,
                borderRadius: '8px',
                backgroundColor: loginColors.surfaceElevated,
                border: `1.5px solid ${error ? loginColors.error : digit ? loginColors.accent : loginColors.border}`,
                textAlign: 'center',
                fontSize: 22,
                fontWeight: 700,
                color: loginColors.textPrimary,
                outline: 'none',
                '&:focus': { borderColor: loginColors.accent },
              }}
            />
          ))}
        </Box>

        {error && (
          <Typography sx={{ color: loginColors.error, fontSize: 13, textAlign: 'center', mb: 2 }}>
            {error}
          </Typography>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
            <CircularProgress size={22} sx={{ color: loginColors.accent }} />
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 2.5 }}>
            <Typography sx={{ color: loginColors.textSecondary, fontSize: 13, mb: 0.5 }}>
              ¿No recibiste el código?
            </Typography>
            <Box
              component="button"
              type="button"
              onClick={handleResend}
              disabled={timer > 0}
              sx={{
                border: 'none',
                background: 'none',
                cursor: timer > 0 ? 'default' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: timer > 0 ? loginColors.textSecondary : loginColors.accent,
              }}
            >
              {timer > 0 ? `Reenviar en ${timer}s` : 'Reenviar código ahora'}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

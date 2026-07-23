import React from 'react';
import { ForgotPasswordForm } from '@presentation/components/auth/ForgotPasswordForm';

/**
 * ForgotPasswordPage: Página para recuperación de contraseña
 *
 * Flow:
 * 1. Usuario ingresa su email
 * 2. Sistema envía OTP a ese email
 * 3. Usuario ingresa el OTP
 * 4. Se valida y se redirige a reset-password
 */
export const ForgotPasswordPage: React.FC = () => {
  return <ForgotPasswordForm />;
};

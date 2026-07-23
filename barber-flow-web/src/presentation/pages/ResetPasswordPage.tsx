import React from 'react';
import { ResetPasswordForm } from '@presentation/components/auth/ResetPasswordForm';

/**
 * ResetPasswordPage: Página para cambiar contraseña
 *
 * Precondiciones:
 * - User debe haber verificado su email y OTP en forgot-password
 * - State contiene email y otp para validación
 */
export const ResetPasswordPage: React.FC = () => {
  return <ResetPasswordForm />;
};

import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  userName: z
    .string()
    .min(1, 'El usuario es requerido')
    .min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Por favor ingresa un email válido'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Verify OTP Schema
export const verifyOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Por favor ingresa un email válido'),
  otp: z
    .string()
    .min(1, 'El código OTP es requerido')
    .length(6, 'El código OTP debe tener 6 caracteres'),
});

export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

// Reset Password Schema
export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El email es requerido')
      .email('Por favor ingresa un email válido'),
    otp: z
      .string()
      .min(1, 'El código OTP es requerido')
      .length(6, 'El código OTP debe tener 6 caracteres'),
    newPassword: z
      .string()
      .min(1, 'La nueva contraseña es requerida')
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Debes confirmar la contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

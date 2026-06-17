# Plan de Implementación Técnica: Recuperación de Contraseña (OTP de 6 Dígitos)

Este documento detalla los pasos necesarios para implementar el flujo completo de recuperación de contraseña, integrando el backend (.NET Core) con el frontend (React Native / Expo), manteniendo la identidad de marca Gold & Navy.

## 1. Backend: Modelo de Datos
- **Entidad:** `PasswordResetToken` en `Barber.Flow.Domain/Entities`.
- **Propiedades:**
  - `UserId`: Referencia al usuario.
  - `OtpCode`: Código de 6 dígitos (numérico).
  - `ExpiresAt`: Fecha de expiración (recomendado: 10-15 min).
  - `CreatedAt`: Marca de tiempo de creación.
  - `IsUsed`: Boolean para evitar reutilización.

## 2. Backend: Patrón Repository
- **Interfaz:** `IPasswordResetRepository` en `Barber.Flow.Domain/Interfaces`.
- **Implementaciones:**
  - `InMemoryPasswordResetRepository`: Para pruebas rápidas y desarrollo offline.
  - `MongoPasswordResetRepository`: Implementación persistente en MongoDB.

## 3. Backend: Servicios (`AuthService`)
- **`RequestPasswordResetAsync(string email)`**:
  - Verifica si el usuario existe.
  - Genera un código de 6 dígitos aleatorio.
  - Registra el OTP en la base de datos.
  - Envía el correo electrónico al usuario.
- **`VerifyOtpAsync(string email, string code)`**:
  - Valida que el código sea correcto y no haya expirado.
  - Retorna un token temporal (sujeto a validación) para el cambio final.
- **`ResetPasswordAsync(string email, string token, string newPassword)`**:
  - Aplica el cambio de contraseña utilizando el hashing de Identity.

## 4. Backend: API Endpoints (`AuthApi.cs`)
- `POST /api/auth/forgot-password`: Inicia el proceso.
- `POST /api/auth/verify-otp`: Valida los 6 dígitos.
- `POST /api/auth/reset-password`: Finaliza el cambio.

## 5. Mobile: Navegación y Pantallas
- **`ForgotPasswordScreen.tsx`**: Entrada de email.
- **`OtpVerificationScreen.tsx`**: Interfaz de 6 cuadros para el código.
- **`ResetPasswordScreen.tsx`**: Entrada de nueva contraseña y confirmación.
- **Navegación:** Integrar en el Stack de autenticación.

## 6. Mobile: UX del Componente OTP
- Implementación de 6 `TextInput` con `autoFocus` y cambio de foco automático al escribir.
- Teclado numérico (`keyboardType="numeric"`).
- Temporizador para "Reenviar Código" (Cooldown de 60 segundos).

## 7. Integración de Email
- Interfaz `IEmailService` en Infrastructure.
- Plantilla HTML con estilos Premium (Colores `#C9A84C` y `#1A1A1A`).

## 8. Seguridad y Hardening
- **Rate Limiting:** Limitar solicitudes de OTP por IP/Email.
- **Brute Force:** Bloquear el OTP tras 3-5 intentos fallidos.
- **Expiración:** Asegurar que los tokens de recuperación sean de un solo uso y corta duración.

---
*Documento generado para el proyecto Barber Flow - Branding: Gold & Navy.*

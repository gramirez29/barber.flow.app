# Configuración de Resend en Barber Flow

El envío real de correos (recuperación de contraseña vía OTP) usa [Resend](https://resend.com) a través de su API HTTPS, no SMTP. Esto es obligatorio en Railway: los planes Free/Trial/Hobby bloquean SMTP saliente por completo (ver `docs.railway.com/networking/outbound-networking#email-delivery`).

## 1. Requisitos en Resend
1. Creá una cuenta en [resend.com](https://resend.com).
2. Verificá un dominio propio (Domains → Add Domain, agregando los registros DNS que te pidan) para poder enviar como `noreply@tudominio.com`. Sin dominio verificado, Resend solo permite enviar al correo con el que te registraste, usando `onboarding@resend.dev`.
3. Generá una API Key (API Keys → Create API Key).

## 2. Configuración
`appsettings.json` define la forma de la sección `Resend`, pero el `ApiKey` **nunca** va hardcodeado:

```json
"Resend": {
  "ApiKey": "",
  "FromName": "Barber Flow",
  "FromEmail": "noreply@tudominio.com"
}
```

- **Local**: `dotnet user-secrets set "Resend:ApiKey" "re_xxx" --project Barber.Flow.Api`
- **Railway**: variable de entorno `Resend__ApiKey` en el servicio del API.

`FromEmail`/`FromName` no son secretos y pueden ir directo en `appsettings.json` (o su override por ambiente).

## 3. Activación del servicio
En `Features`, asegurate de que `UseRealEmail` esté en `true`:

```json
"Features": {
  "UseRealEmail": true
}
```

Con `UseRealEmail: false` se usa `ConsoleEmailService` (imprime el correo por consola, no llama a Resend) — es el modo usado en tests de integración (`ApiWebApplicationFactory` fuerza esto) para no consumir cuota de Resend.

## 4. Detalles técnicos
- Implementación: `ResendEmailService.cs` (`Barber.Flow.Infrastructure/Services/`), vía `HttpClient` tipado registrado en `ApplicationExtensions.cs`.
- Endpoint: `POST https://api.resend.com/emails`.
- Si Resend responde con error, `ResendEmailService` lanza `HttpRequestException` — `AuthService.RequestPasswordResetAsync` lo captura, invalida el OTP recién generado y devuelve `false` en vez de propagar la excepción.

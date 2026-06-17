# Configuración de Gmail SMTP en Barber Flow

Para utilizar Gmail como servidor de envío de correos, se requiere una configuración específica debido a las políticas de seguridad de Google.

## 1. Requisitos de Seguridad de Google
No puedes usar tu contraseña habitual de Gmail directamente en el código. Debes generar una **Contraseña de Aplicación**.

1. Ve a tu [Cuenta de Google](https://myaccount.google.com/).
2. Entra en la sección **Seguridad**.
3. Asegúrate de que la **Verificación en dos pasos** esté activada.
4. Busca **Contraseñas de aplicaciones**.
5. Crea una nueva: elige App: "Correo" y Dispositivo: "Otro (Barber Flow API)".
6. Copia el código de **16 caracteres** generado.

## 2. Configuración en `appsettings.json`
Actualiza la sección `Email` con los siguientes valores:

```json
"Email": {
  "SmtpServer": "smtp.gmail.com",
  "SmtpPort": 587,
  "SmtpUsername": "tu-correo@gmail.com",
  "SmtpPassword": "TU_CODIGO_DE_16_CARACTERES",
  "FromName": "Barber Flow",
  "FromEmail": "tu-correo@gmail.com",
  "EnableSsl": true
}
```

## 3. Activación del Servicio
En el mismo archivo `appsettings.json`, asegúrate de que el flag de envío real esté activo:

```json
"Features": {
  "UseRealEmail": true
}
```

## 4. Detalles Técnicos
- **Host:** `smtp.gmail.com`
- **Puerto:** `587`
- **Protocolo:** TLS (implementado en `EmailService.cs` mediante `SecureSocketOptions.StartTls`).
- **Librería:** Utiliza `MailKit` para la comunicación SMTP.

> **Nota:** En entornos de producción, se recomienda mover la `SmtpPassword` a un sistema de gestión de secretos (Variables de Entorno, Azure Key Vault, etc.) para evitar exponerla en el repositorio.

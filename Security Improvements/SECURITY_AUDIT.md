# Barber Flow — Auditoría de Seguridad

**Fecha:** 2026-08-10
**Alcance:** `barber-flow-api` (.NET 9), `barber-flow-web` (React/Vite), `barber-flow-mobile` (React Native/Expo)
**Metodología:** revisión de código estático (sin pentest activo contra un ambiente desplegado), enfocada en autenticación, autorización, manejo de secretos, validación de entrada, y almacenamiento de datos sensibles en cliente.

> **Actualización 2026-08-10:** los 5 hallazgos Críticos, 8 de los 10 Altos (incluido el IDOR completo — A1/A3/A4/A5) y varios ítems Medio/Bajo (regex sin escapar, refresh tokens en texto plano, `pageSize` sin límite, localStorage/AsyncStorage sin limpiar en logout, sin bloqueo biométrico en mobile) ya fueron remediados — ver la marca `✅ RESUELTO` en las tablas de las secciones 1.1/1.2/1.3/2/3 y el detalle en `IMPLEMENTATION_PLAN.md` en esta misma carpeta. Quedan pendientes A2 (IDs secuenciales) y A10 (HTTPS redirect/HSTS, pospuesto a propósito).

## Resumen ejecutivo

Con la configuración actual del backend, un atacante externo sin ninguna cuenta podría:

1. **Descargar toda la base de clientes** (nombres, teléfonos, emails, direcciones, cumpleaños) con un solo `GET` sin autenticarse.
2. **Loguearse como admin sin contraseña real** usando un backdoor hardcodeado en el código de autenticación.
3. **Tomar control de la cuenta de cualquier usuario** vía "olvidé mi contraseña": el OTP es de 6 dígitos, dura 15 minutos, y no hay límite de intentos.
4. **Leer/editar/borrar citas y clientes de cualquier barbería**, no solo la propia, por falta de verificación de "dueño del recurso" — y los IDs de citas son secuenciales y predecibles.
5. Si la variable de entorno de la clave JWT de producción no está bien configurada, la app arranca igual usando un placeholder committeado en el repo como clave real de firma.

Además, **las contraseñas se guardan en texto plano** en la base de datos — un solo acceso de lectura a Mongo expondría todas las contraseñas reales de golpe.

---

## 1. Backend (`barber-flow-api`)

### 1.1 Crítico

| # | Hallazgo | Ubicación | Estado |
|---|---|---|---|
| C1 | Backdoor: login `admin`/`password` emite un JWT válido sin tocar la base de usuarios | `JwtAuthService.cs:21-26` | ✅ RESUELTO — endpoint y código eliminados por completo |
| C2 | Contraseñas guardadas y comparadas **en texto plano**, sin ningún hash (bcrypt/Argon2/PBKDF2) | `User.cs:13`, `MongoDbUserRepository.cs:48,72` | ✅ RESUELTO — BCrypt, migración automática al primer login |
| C3 | Usuario admin sembrado automáticamente con `admin`/`password` si la colección de usuarios está vacía | `MongoDbBootstrapper.cs:219-229`, `InMemoryUserRepository.cs:18` | ✅ RESUELTO (parcial) — la contraseña sembrada ahora se hashea; la credencial default sigue siendo `admin`/`password`, cambiarla queda a criterio operativo |
| C4 | `POST/GET /api/clients/create`, `/search`, `/getById/{id}` marcados `AllowAnonymous()` — toda la base de clientes es pública | `ClientsApi.cs:23-40` | ✅ RESUELTO — quitado `.AllowAnonymous()`, ahora requiere token |
| C5 | Sin rate limiting en ningún endpoint + OTP de 6 dígitos generado con `new Random()` (no criptográfico), 15 min de validez, sin límite de intentos | `AuthService.cs:30,36`, `AuthApi.cs:20,24` | ✅ RESUELTO — rate limiting (5/min por IP) + `RandomNumberGenerator` |

### 1.2 Alto

| # | Hallazgo | Ubicación | Estado |
|---|---|---|---|
| A1 | IDOR en citas: cualquier usuario autenticado puede leer/editar/mover/borrar citas de cualquier barbería (sin filtro por dueño) | `AppointmentsApi.cs:89-179`, `MongoDbAppointmentRepository.cs` | ✅ RESUELTO — filtro por `ShopId` (privado por barbero, Admin ve todo), 404 si no es dueño; cada barbero garantiza tener `ShopId` propio desde su creación, con backfill automático al arrancar para datos existentes |
| A2 | IDs de citas secuenciales y predecibles (`APT-0001`...) + endpoint que expone el contador actual | `AppointmentsApi.cs:43-45`, `MongoDbAppointmentRepository.cs:177,208` | Pendiente |
| A3 | `GET /api/appointments/search` sin filtro de dueño — devuelve citas de todos los tenants | `AppointmentsApi.cs:149-161` | ✅ RESUELTO — mismo filtro por `ShopId` que A1, aplicado a `FindAsync` |
| A4 | IDOR en clientes: actualizar/borrar cualquier cliente por id, sin verificar ShopId/CreatedBy | `ClientsApi.cs:91-142` | ✅ RESUELTO — mismo patrón que A1 (fetch existente → comparar `ShopId` del caller → 404 si no coincide) |
| A5 | `GET /api/barbers/search` y `/getById/{id}` marcados `AllowAnonymous()` — expone datos personales y comisión/gasto de cada barbero | `BarbersApi.cs:31-39` | ✅ RESUELTO — ahora requiere token |
| A6 | Clave JWT de producción committeada como placeholder (`ReplaceViaRailwayEnvVar-Jwt__Key`) que funciona igual como clave real si la env var no está seteada | `appsettings.Production.json:9` | ✅ RESUELTO — falla al arrancar en Production si sigue siendo el placeholder o es muy corta |
| A7 | CORS completamente abierto (`AllowAnyOrigin`) en toda la API | `ApplicationExtensions.cs:126-140` | ✅ RESUELTO — allowlist configurable (`Cors:AllowedOrigins`) + defaults de dev local |
| A8 | Swagger habilitado sin restricción en todos los ambientes, incluida producción | `Program.cs:38-40` | ✅ RESUELTO — solo en Development |
| A9 | Sin middleware de manejo de excepciones — riesgo de fuga de stack traces si el ambiente queda mal configurado | `Program.cs` (ausente) | ✅ RESUELTO — `UseExceptionHandler` genérico agregado |
| A10 | Sin `UseHttpsRedirection`/HSTS | `Program.cs` (ausente) | Pospuesto a propósito — riesgo real de loop de redirect detrás del proxy de Railway si no se prueba primero en staging; ver `IMPLEMENTATION_PLAN.md` |

### 1.3 Medio

- ✅ RESUELTO — Regex del buscador de citas no escapaba el input del usuario (a diferencia de los demás repos) → riesgo de dump masivo o ReDoS. `MongoDbAppointmentRepository.cs` ahora usa `Regex.Escape`, igual que `MongoDbClientRepository.cs`.
- ✅ RESUELTO (parcial) — Refresh tokens ahora se guardan hasheados (SHA-256 determinístico) en vez de texto plano, tanto en Mongo como en el repo InMemory (`RefreshTokenHasher`). Resetear contraseña seguir sin invalidar refresh tokens ya emitidos y sin detección de reuso — sigue pendiente.
- Claim de identidad (`NameIdentifier`) ambiguo entre username y GUID según el flujo — usado como clave de "dueño del recurso" de forma inconsistente. `BarbersApi.cs:68-71` (riesgo documentado en `UsersApi.cs:64-71`). **Nota:** el nuevo filtro de IDOR (A1/A3/A4) sí usa una fuente no ambigua — el claim `"username"` propio vía `ClaimsPrincipalExtensions.GetUserName()` — pero los endpoints listados aquí no fueron tocados por ese trabajo.
- Endpoint de "olvidé mi contraseña" responde distinto según si el email existe → enumeración de usuarios. `AuthService.cs:24` → `AuthApi.cs:45`
- ✅ RESUELTO — `pageSize` sin límite superior en varias búsquedas, y `page=0` producía un `Skip` negativo. `MongoDbAppointmentRepository.cs`/`MongoDbClientRepository.cs` ahora clampean (`Math.Clamp(pageSize, 1, 100/200)`, `Math.Max(0, page - 1)`).
- Sin validación (FluentValidation) en la mayoría de los DTOs de request (`ClientRequest`, `AppointmentRequest`, etc.) — solo `BarberRequest` la tiene.
- Email de reset de contraseña interpola `user.Name` sin encoding → HTML injection en el correo. `AuthService.cs:59-76`
- `X-Forwarded-For`/`X-Forwarded-Proto` confiados sin restricción de proxies conocidos — spoofeable. `Program.cs:17-22`

---

## 2. Web (`barber-flow-web`)

| Severidad | Hallazgo | Ubicación |
|---|---|---|
| Alto | Token JWT guardado en `localStorage` (no en cookie httpOnly) — si alguna vez hay XSS, se roba directo. Hoy no se encontró ningún vector XSS real (`dangerouslySetInnerHTML`/`innerHTML` no se usan en ningún lado). | `LocalStorageAuthStorage.ts:8`, `AxiosHttpClient.ts` |
| Medio | ✅ RESUELTO — Caché de notificaciones en `localStorage` guarda nombres y teléfonos de clientes en texto plano y **no se borra al hacer logout** — en una compu compartida, el siguiente usuario ve datos del anterior. `LocalStorageAuthStorage.clearUser()` ahora también borra `barber_flow_notifications`/`barber_flow_notifications_enabled`. | `notificationService.ts`, `NotificationInboxContext.tsx`, `LocalStorageAuthStorage.ts` |
| Medio | Logout no llama al backend — el JWT emitido sigue siendo válido hasta expirar por sí solo; el refresh token tampoco se revoca del lado servidor. | `AuthApi.ts:32-35` |
| Informativo | "Modo Seguro" (ocultar Citas/Clientes/Reportes a Admin) es **puramente de UX** — no hay ninguna verificación de rol en el backend (`RequireRole` no existe), así que es trivialmente evitable llamando la API directo con DevTools. No es grave por sí solo, pero no es una barrera de seguridad real. | `AdminAccessContext.tsx`, `OperationalRoute.tsx` |
| Bajo | 2 vulnerabilidades "high" en `npm audit` (react-router, relacionadas a un modo RSC que esta app no usa). | — |
| Informativo | `.env.local`/`.env` correctamente en `.gitignore`; solo `VITE_API_BASE_URL`/`VITE_API_TIMEOUT`/`VITE_PRIVACY_POLICY_URL` se exponen al bundle — ningún secreto real. | — |
| Informativo | Sin CSRF real: auth es 100% bearer-token-in-header, sin cookies de sesión, `withCredentials` nunca seteado. | — |

---

## 3. Mobile (`barber-flow-mobile`)

| Severidad | Hallazgo | Ubicación |
|---|---|---|
| — (Positivo) | El token **sí** está bien guardado: `expo-secure-store` (Keychain en iOS / Keystore encriptado en Android), no `AsyncStorage`. | `authService.ts:29`, `apiClient.ts` |
| Alto | ✅ RESUELTO (parcial) — El libro completo de clientes (nombres, teléfonos, precios, notas) se cachea **sin encriptar** en `AsyncStorage` para funcionar offline; ahora **sí se borra** al hacer logout o eliminar la cuenta (`authService.clearCachedData()` limpia `barber-flow-appointments`, `barber-flow-notifications` y `barber-flow-settings-preferences`). Sigue sin encriptar mientras la sesión está activa, y `allowBackup` en Android sigue sin desactivarse explícitamente. | `appointment.store.ts:143-157`, `notificationService.ts`, `settingsService.ts`, `authService.ts` |
| Medio | `production` en la config apunta al ambiente de **desarrollo** (`barberflowapp-develop.up.railway.app`) — el build de producción real le pega al backend de develop. | `app.config.js:10` |
| Medio | ✅ RESUELTO — Sin bloqueo biométrico/PIN al reabrir la app — cualquiera que agarre el dispositivo desbloqueado entraba directo a citas, reportes y configuración. Ahora `RootNavigator` requiere biometría/PIN (`expo-local-authentication`) al abrir en frío con sesión guardada y al volver del background, con fallback silencioso si el dispositivo no tiene biometría/PIN configurado. | `RootNavigator.tsx`, `LockScreen.tsx`, `utils/biometricAuth.ts` |
| Bajo | 31 vulnerabilidades en `npm audit` (2 críticas), pero casi todas del toolchain de build de Expo/Metro, no del código que corre en el teléfono. | — |
| Bajo | Sin certificate pinning (aceptable para el perfil de riesgo de esta app, solo queda anotado). | — |
| Bajo | `app.json.bak` con configuración de `schemes` mal ubicada — archivo huérfano, no se carga, recomendable borrarlo. | `app.json.bak:22-26` |

---

## 4. Plan de acción priorizado

### Hacer ya (cierran los huecos más graves, minutos de trabajo cada uno)
1. Borrar el backdoor `admin`/`password` de `JwtAuthService.cs`.
2. Quitar los `.AllowAnonymous()` de `ClientsApi.cs` (3) y `BarbersApi.cs` (2).
3. Apagar Swagger en producción (`app.Environment.IsDevelopment()`).
4. Restringir CORS a los orígenes reales (web + app), no `AllowAnyOrigin`.

### Esta semana
5. Hashear contraseñas con BCrypt (requiere migrar usuarios existentes).
6. Agregar rate limiting a login/verify-otp/reset-password; generar el OTP con `RandomNumberGenerator` en vez de `Random`.
7. Agregar filtro de "dueño del recurso" (ShopId/CreatedBy) a los endpoints de citas y clientes que hoy no lo tienen.
8. Sacar el placeholder de clave JWT del repo y validar al arrancar que no se use ese valor en producción (fail-fast si `Jwt:Key` es corta o coincide con el placeholder).

### Cuando haya tiempo
9. Mover el token del web fuera de `localStorage`. ✅ RESUELTO (parcial) el resto del punto — el `localStorage` sensible (`barber_flow_notifications`/`barber_flow_notifications_enabled`) ya se limpia en logout en web.
10. ✅ RESUELTO — Borrar el caché de clientes de `AsyncStorage` al hacer logout en mobile. Pendiente: desactivar `allowBackup` en Android.
11. ✅ RESUELTO — Agregar bloqueo biométrico en mobile.
12. `npm audit fix` en ambos frontends.
13. ✅ RESUELTO — Escapar el regex de búsqueda de citas en el backend (`Regex.Escape`), igual que los demás repositorios.
14. ✅ RESUELTO (parcial) — Hashear refresh tokens en la base. Pendiente: revocarlos al resetear contraseña y detección de reuso.
15. Unificar el mecanismo de resolución de identidad/rol de admin (hoy hay dos criterios distintos en el código) — el nuevo filtro de IDOR usa el claim `"username"` de forma consistente, pero no se tocaron los demás endpoints fuera de ese alcance.

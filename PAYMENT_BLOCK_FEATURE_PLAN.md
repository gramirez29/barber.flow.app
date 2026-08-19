# Bloqueo de cuenta por falta de pago (per-barbero)

> Documento de planificación. No implementar hasta recibir indicación explícita de proceder.

## Contexto

El negocio necesita una forma de suspender el acceso a la app de un barbero específico que no ha pagado el uso de Barber Flow, sin afectar a los demás usuarios. Hoy no existe ningún mecanismo de este tipo: `User` no tiene ningún campo de estado, no hay middleware en el backend, y ambas apps confían indefinidamente en el usuario guardado localmente (login es la única llamada de red de auth — no hay `/me` ni revalidación periódica).

Decisiones confirmadas con el usuario:
- El flag es **por cuenta individual** (no un interruptor global) — el Admin bloquea/desbloquea barberos uno por uno desde el diálogo de "Usuarios de aplicación" que ya existe en Settings.
- Cuando está bloqueado, esa cuenta ve una pantalla de bloqueo en **toda la app** (mobile y web), hasta que el Admin la desbloquea. El Admin nunca puede bloquearse a sí mismo.
- La propagación a sesiones ya activas es vía **polling ligero** (cada 24 horas) desde ambas apps, más manejo inmediato de un 403 específico en cualquier request — esto último es lo que realmente garantiza que el bloqueo sea efectivo casi de inmediato en cuanto la cuenta hace cualquier llamada al backend; el poll diario solo cubre el caso de una sesión que queda completamente inactiva (sin ninguna request) durante mucho tiempo.
- El **backend también enforce esto** con un middleware — no es solo cosmético en la UI.
- Login de una cuenta bloqueada **funciona normalmente** (autentica) y muestra la pantalla de bloqueo con mensaje claro, en vez de un error de login genérico.
- Al desbloquear, el refresh token existente **sigue siendo válido** — no se fuerza re-login.

## Backend (`barber-flow-api/Barber.Flow.Api/`)

**Modelo de datos** — `Barber.Flow.Domain/Entities/User.cs`: agregar `IsBlocked (bool)`, `BlockedAt (DateTime?)`, `BlockedBy (string?)`.

**Repositorio** — `Barber.Flow.Domain/Interfaces/IUserRepository.cs`: agregar `GetByUserNameAsync` (no existe hoy, solo hay `GetByEmailAsync`/`GetByIdAsync`) y `SetBlockedAsync(id, isBlocked, actingAdmin)`. Implementar en `Barber.Flow.Infrastructure/Services/MongoDb/MongoDbUserRepository.cs` (mismo patrón regex case-insensitive que `GetAuthenticationUserAsync`) y en el repo InMemory equivalente (mantener paridad, como indica el CLAUDE.md raíz).

**Capa de aplicación** — `Barber.Flow.Application/Services/Users/UserService.cs`/`IUserService.cs`: agregar `SetBlockedAsync`. Enforce ahí mismo (defensa en profundidad) que si el target es la cuenta admin (`UserName == adminUsername` o `Role == "Admin"`), la operación se rechaza — no solo en el endpoint.

**Endpoints nuevos** — `Barber.Flow.Api/Apis/UsersApi.cs`:
- `PATCH /api/users/{id}/block` (body `{ isBlocked: bool }`) — admin-only, mismo patrón inline de comparación de username que ya usa `BarbersApi` (`config["BARBERFLOW_ADMIN_USERNAME"] ?? config["AdminUsername"] ?? "admin"`), no el patrón basado en `Role` de `DeleteSelfAsync`. Rechaza intentos de bloquear al propio admin.
- `GET /api/users/me/status` — cualquier usuario autenticado (incluso bloqueados), responde `{ isBlocked: bool }`. Debe quedar **exento** del middleware de bloqueo (ver abajo) — es el endpoint que ambas apps usan para el polling, tiene que ser alcanzable incluso estando bloqueado.

**`UserResponse` (login/refresh)** — agregar `IsBlocked` al DTO y a los 2-3 sitios donde `UsersApi.cs` construye la respuesta de login/refresh, para que ambas apps sepan el estado justo al loguearse.

**`BarbersApi.cs` / `BarberResponse`** — extender con `IsBlocked` y `UserId` (el `Guid` del `User` vinculado), resueltos vía `GetByUserNameAsync` al armar `FindBarbersAsync`/`GetBarberAsync`. Esto le da a la UI de admin (que opera sobre barberos, no usuarios) tanto el estado actual como el id necesario para llamar al endpoint de bloqueo, sin una segunda consulta.

**Middleware nuevo** — `Barber.Flow.Api/Middleware/BlockedUserMiddleware.cs` (no existe el directorio hoy). Se registra en `Program.cs` **después** de `UseAuthentication()`/`UseAuthorization()` y **antes** de `MapControllers()`/los `Map*Api()`. Lógica: si no hay principal autenticado, pasa. Si la ruta es una de las exentas (`/api/users/authentication`, refresh, `/api/users/me/status`, OTP, swagger/health), pasa. Si no, resuelve el usuario (reutilizar/extraer el helper de resolución de claims que ya existe inline en `DeleteSelfAsync` para el Guid-vs-username ambiguo) y si `IsBlocked == true`, corta con `403` y un body `{ "code": "ACCOUNT_BLOCKED", "message": "..." }` — el código específico es lo que permite a los interceptores de ambas apps distinguirlo de un 403 genérico de autorización. Sin capa de caché (no existe hoy ninguna `IMemoryCache` en el proyecto) — se acepta el costo de una consulta por request, dado el tamaño esperado del negocio.

**Tests** — agregar casos en `UsersApiTests.cs` (bloquear/desbloquear, 403 no-admin, rechazo al intentar bloquear al admin, `me/status`) y en `BarbersApiTests.cs` (respuesta incluye `isBlocked`/`userId`); un test de middleware (blocked→403 con código, rutas exentas siguen funcionando).

## Web (`barber-flow-web/src`)

- **Dominio/DTOs**: `domain/entities/User.ts` y `Barber.ts` ganan `isBlocked?: boolean` (Barber también `userId?: string`). Nuevo cliente `infrastructure/api/UsersApi.ts` con `setBlocked(id, isBlocked)` y `getStatus()`.
- **Pantalla de bloqueo**: nueva `presentation/pages/BlockedPage.tsx` — sin `ProtectedLayout` (sin sidebar/appbar), mensaje claro, botón de cerrar sesión. Ruta pública-ish `/blocked` en `presentation/routes/Router.tsx`.
- **Guard**: `presentation/components/shared/ProtectedRoute.tsx` — extender la cadena `isLoading → !isAuthenticated → children` a `... → isBlocked → children`, redirigiendo a `/blocked`. Como `ProtectedRoute` ya envuelve cada ruta protegida individualmente, este único cambio cubre toda la app.
- **Propagación en vivo**: `presentation/context/AuthContext.tsx` agrega un `setInterval` de 24h (mientras `isAuthenticated`) llamando `UsersApi.getStatus()`, actualiza `user.isBlocked` si cambia. `infrastructure/http/AxiosHttpClient.ts` — en el interceptor de respuesta que ya maneja 401, agregar rama para `403` con `code === 'ACCOUNT_BLOCKED'` → redirigir a `/blocked` de inmediato (sin esperar el próximo poll).
- **Toggle de admin**: `presentation/components/settings/ApplicationUsersDialog.tsx` — agregar un switch "Cuenta bloqueada" en la sección de acceso del formulario (visible en modo edición), que llama `UsersApi.setBlocked` de inmediato al cambiar (no como parte del submit del formulario), deshabilitado si el registro cargado es la cuenta admin. Nueva acción `setBlocked` en `presentation/hooks/useBarbers.ts` siguiendo el patrón de `deleteBarber`/`updateBarber` (notificaciones vía `useNotification()`).

## Mobile (`barber-flow-mobile/Barber.Flow.Mobile/src`)

- **Tipos**: `types/applicationUser.ts` y `types/settings.ts` (`BarberApiResponse`) ganan `isBlocked?: boolean` (y `userId` en el de barbero).
- **Pantalla de bloqueo**: nueva `screens/BlockedScreen.tsx`, mismo patrón de override de pantalla completa que ya usa `LockScreen`. En `navigation/RootNavigator.tsx`, el check de bloqueado va **antes** que el de `LockScreen` (un usuario bloqueado no debería ni pasar por el prompt biométrico).
- **Propagación en vivo**: nuevo método en `services/settingsService.ts` (o servicio nuevo) para `GET /api/users/me/status`. Polling de 24h mientras haya `user` (en `RootNavigator.tsx` o un hook nuevo), más un check inmediato al volver a foreground (reusar el listener de `AppState` que ya existe para el re-arm del lock screen) — esto último es lo que realmente cubre el caso típico de mobile (app resumida tras haber estado en background), el poll diario es solo el respaldo. `services/apis/apiClient.ts` — igual que en web, además del manejo existente de 401/`SessionExpiredError`, agregar rama para 403 con `code === 'ACCOUNT_BLOCKED'` que actualiza el store y dispara el render de `BlockedScreen`.
- **Toggle de admin**: en el flujo de gestión de usuarios de aplicación (`ManageApplicationUsersForm.tsx` dentro de `ApplicationUsersModal.tsx`), agregar un `Switch` de react-native-paper "Cuenta bloqueada" junto al campo de contraseña, mismo criterio que web (solo en edición, deshabilitado para la cuenta admin), llamando al servicio de inmediato.

## Verificación

1. Backend: `dotnet test` en verde con los nuevos casos.
2. Bloquear un barbero de prueba desde `ApplicationUsersDialog` (web) → confirmar que el toggle persiste y que `dotnet`/logs muestran el `PATCH` con `200`.
3. Con esa cuenta logueada en otra pestaña/dispositivo antes del bloqueo: confirmar que al hacer cualquier request es redirigida a `/blocked` de inmediato (el poll diario no es práctico de esperar en esta verificación manual, pero puede simularse llamando `getStatus()` a mano desde la consola).
4. Intentar loguear con la cuenta bloqueada desde cero → login exitoso, pantalla de bloqueo inmediata (no error de credenciales).
5. Intentar pegarle a un endpoint protegido directamente (curl/Postman) con el token de la cuenta bloqueada → `403` con `code: "ACCOUNT_BLOCKED"`.
6. Desbloquear → confirmar que sin volver a loguear, el siguiente poll/request restaura el acceso normal.
7. Repetir 2-3 en mobile (Expo) con `BlockedScreen`.
8. Confirmar que la cuenta `admin` no tiene el toggle disponible / el endpoint la rechaza si se fuerza vía API directa.

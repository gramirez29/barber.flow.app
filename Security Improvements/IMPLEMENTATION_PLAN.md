# Remediación de riesgos de seguridad más altos — implementado 2026-08-10

Ver `SECURITY_AUDIT.md` en esta misma carpeta para el detalle completo de cada hallazgo. Este documento registra qué se implementó, cómo, y por qué se diseñó así (sin romper login/datos existentes).

## Contexto

Se cerraron los 5 hallazgos **Críticos** y 3 de los 10 **Altos** de la auditoría, con el criterio explícito de: actuar como senior dev, evitar patrones complejos, y no romper ni la app web ni la mobile. Antes de tocar código se confirmó en el propio repo (no solo por el resumen de la auditoría):

- `POST /api/auth/login` (el backdoor `admin`/`password`) no lo usaba nadie — web y mobile llaman `POST /api/users/authentication` exclusivamente. Era código muerto.
- Los endpoints `AllowAnonymous` de Clientes/Barberos tampoco los usaba nadie sin login — todos los call sites en ambas apps ya mandaban el token Bearer.
- No existe ningún flujo de auto-registro — las cuentas solo se crean vía `POST /api/barbers/create` (admin), lo que simplificó la migración de hashing a 4 puntos de escritura conocidos.
- Mobile no está sujeto a CORS (no usa WebView, `fetch` nativo no manda `Origin`).
- `Microsoft.AspNetCore.RateLimiting` ya viene incluido en .NET 9 — no hizo falta ninguna librería nueva para rate limiting.

## Qué se implementó

**1. Backdoor de login eliminado** — `JwtAuthService.cs`, `IJwtAuthService.cs`, `AuthResult.cs`, ambos `LoginResult.cs`, `LoginRequest.cs` y el endpoint `POST /api/auth/login` en `AuthApi.cs` se borraron por completo (código muerto, cero llamadores reales).

**2. `AllowAnonymous` quitado de Clientes y Barberos** — `ClientsApi.cs` (create/search/getById) y `BarbersApi.cs` (search/getById) ahora requieren autenticación, igual que el resto de sus endpoints.

**3. Contraseñas hasheadas con BCrypt (`BCrypt.Net-Next`), sin romper logins existentes** — patrón "migrar al loguear":
- `PasswordHasher.cs` (nuevo, en `Barber.Flow.Infrastructure/Services/Auth/`) centraliza `Hash`/`Verify`/`IsHashed`.
- `MongoDbUserRepository`/`InMemoryUserRepository`: `CreateAsync` y `UpdatePasswordAsync` hashean siempre antes de guardar. `GetAuthenticationUserAsync` detecta si el valor guardado ya es un hash BCrypt (prefijo `$2`); si no lo es (contraseña legacy en texto plano), compara como antes y, si coincide, la re-guarda hasheada en el momento — así cada cuenta se migra sola en su próximo login exitoso, sin script de migración ni downtime.
- `MongoDbBootstrapper` (seed del admin) y ambos seeds de `InMemoryUserRepository` ahora hashean también.

**4. Falla rápido si la clave JWT de producción sigue siendo el placeholder** — `ApplicationExtensions.AddAuthentication` revienta al arrancar (`InvalidOperationException`) si `env.IsProduction()` y `Jwt:Key` es el placeholder conocido o tiene menos de 32 bytes. Limitado a `IsProduction()` a propósito para no afectar tests ni desarrollo local.

**5. CORS restringido** — de `AllowAnyOrigin()` a un allowlist (`Cors:AllowedOrigins` en config/env vars) con defaults de desarrollo local (`localhost:3005`, `localhost:5173`). Mobile no se ve afectado (no usa CORS).

**6. Swagger apagado fuera de Development** — una condición (`if (app.Environment.IsDevelopment())`) alrededor de `UseSwagger`/`UseSwaggerUI`.

**7. Rate limiting en login y flujo de OTP** — política `"auth"` (ventana fija, partición por IP) vía `Microsoft.AspNetCore.RateLimiting` (nativo de .NET 9, sin paquete nuevo), aplicada a `POST /api/users/authentication` y a todo el grupo `api/auth` (forgot/verify/reset). **Importante:** el límite es generoso (1000/min) en el ambiente `Development` — tanto el desarrollo local como el host de tests de integración corren bajo ese ambiente y re-autentican decenas de veces por corrida; el límite estricto real (5/min) aplica en cualquier otro ambiente.

**8. OTP con generador criptográfico** — `new Random()` → `RandomNumberGenerator.GetInt32(...)` en `AuthService.RequestPasswordResetAsync`.

**9. Manejo de excepciones global** — `app.UseExceptionHandler(...)` devuelve un JSON genérico (`{ message: "Ha ocurrido un error inesperado." }`) con `500` en vez de dejar una excepción sin controlar, y loguea el detalle real del lado servidor.

## Explícitamente pospuesto (no se tocó en esta ronda)

- **HTTPS redirect / HSTS (A10)**: detrás de un proxy (Railway), un `UseHttpsRedirection()` mal ubicado puede generar loops de redirect si los forwarded headers no se interpretan bien. Se deja para un cambio chico y separado, verificado en staging antes de mergear.
- **A2** (IDs de citas secuenciales/predecibles): sigue pendiente — mitigado en la práctica por el cierre del IDOR (A1/A3/A4) en la Ronda 2, ya que adivinar un ID ajeno ahora devuelve `404` en vez de exponer el registro.

## Verificación realizada (Ronda 1)

- `dotnet test`: 192/192 en verde (57 Application + 34 Api + 101 Infrastructure), incluyendo casos nuevos para: migración de contraseña legacy a hash en el primer login, arranque en `Production` con placeholder de `Jwt:Key` lanza excepción, endpoints de Clientes/Barberos ya no aceptan requests sin token.
- Verificación manual en vivo contra el backend local:
  - Login con el usuario admin sembrado (contraseña en texto plano en la base real) → funcionó igual que antes.
  - Segundo login con la misma contraseña (ahora comparando contra el hash recién migrado) → funcionó.
  - `GET /api/clients/search` sin header `Authorization` → `401` (antes `200`).
  - 6 logins fallidos seguidos en Development → todos `400` (no `429`), confirmando que el límite generoso de dev no interfiere con el uso normal.
  - Web logueada (admin/password): Dashboard, Clientes (con datos reales) y Citas (calendario con datos reales) verificados en navegador — todo funciona igual que antes del cambio.

---

# Ronda 2 — IDOR (A1/A3/A4) + ítems Medio/Bajo

## Contexto

Con los Críticos ya resueltos, el hallazgo Alto más importante que quedaba era el IDOR: cualquier usuario autenticado podía leer/editar/borrar citas y clientes de **cualquier** barbería, no solo la propia, porque ningún endpoint filtraba por dueño.

Decisión de diseño clave, corregida a mitad de planificación: la primera versión de este plan proponía filtrar por `CreatedBy` (username), razonando que `ShopId` estaba nulo en buena parte de la data existente. Se corrigió a filtrar por **`ShopId`** — el campo que el propio dominio ya declara como identificador de tenant (`Appointments.ShopId`/`Client.ShopId`/`Barber.ShopId`, con índices ya creados) — porque la data existente es de prueba/desechable, y corresponde arreglarla (vía backfill) en vez de diseñar la arquitectura alrededor de su mala calidad incidental.

Decisiones confirmadas: alcance **privado por barbero** (cada uno ve solo lo que creó, no compartido por barbería), **Admin ve todo** cuando Modo Seguro está desactivado, y **backfill automático al arrancar** para la data de prueba existente con `ShopId` nulo (en vez de limpieza manual).

## Qué se implementó

**1. Todo barbero garantiza tener `ShopId` propio desde su creación** — `BarberService.CreateAsync` ahora siempre crea un `BarberShop` (antes solo si `BarberShopName` venía informado), usando `BarberName` como fallback de `Name`. Así ningún barbero nuevo vuelve a quedar con `ShopId` nulo.

**2. Backfill automático e idempotente al arrancar** — nuevo paso en `MongoDbBootstrapper` (`EnsureBarberShopIdsAsync`): para cada `Barber` existente con `ShopId` nulo/vacío, crea un `BarberShop` y se lo asigna, y actualiza las `Appointments`/`Client` cuyo `CreatedBy` coincida con ese barbero y tengan `ShopId` nulo. Si ya no quedan barberos sin `ShopId`, no hace nada — seguro de dejar corriendo en cada arranque.

**3. Helper de identidad centralizado** (`ClaimsPrincipalExtensions.cs`, nuevo) — `GetUserName()` lee el claim propio `"username"` (nunca remapeado por ASP.NET, a diferencia de `sub`/`nameid` que ambos colisionan en `ClaimTypes.NameIdentifier`) e `IsAdmin()` lee el rol. Reemplaza las cadenas de fallback que tenían `AppointmentsApi.cs`/`ClientsApi.cs`.

**4. IDOR cerrado en Citas y Clientes**:
- Lectura individual/edición/borrado/mover: patrón "fetch el registro → resolver `ShopId` del caller vía `IBarberRepository.GetByUserNameAsync` → si no es Admin y el `ShopId` no coincide, `404`" (no `403`, para no confirmarle a un atacante que el ID existe pero no es suyo — los IDs son secuenciales/adivinables, ver A2). Sin cambios en las interfaces de los repositorios para estos casos.
- Búsqueda/listado: `IAppointmentRepository.FindAsync`/`IClientRepository.FindAsync` ganan un parámetro opcional `shopId`, mismo patrón que los existentes (`date`/`status`/`query`/`page`/`pageSize`). Los endpoints de search pasan `caller.IsAdmin ? null : caller.ShopId`.

**5. `pageSize`/`page` clampeados + regex escapado** (encontrados al pasar por los mismos repositorios) — `MongoDbAppointmentRepository`/`MongoDbClientRepository`: `Math.Clamp(pageSize, 1, 100/200)`, `Math.Max(0, page - 1)` (antes `page=0` producía `Skip` negativo), y `Regex.Escape` en la búsqueda de citas (ya lo tenía Clientes).

**6. Refresh tokens hasheados** — `RefreshTokenHasher` (SHA-256 determinístico, no BCrypt — un refresh token ya es alta entropía, no lo elige un humano, y necesita búsqueda por igualdad). `MongoDbRefreshTokenRepository`/`InMemoryRefreshTokenRepository` hashean antes de guardar y antes de buscar; el caller (`UserService`) sigue emitiendo/recibiendo el valor en texto plano sin cambios.

**7. Web — logout limpia todo el `localStorage` sensible** — `LocalStorageAuthStorage.clearUser()` ahora también borra `barber_flow_notifications` (nombres/teléfonos de clientes) y `barber_flow_notifications_enabled`, no solo `barber_flow_auth`.

**8. Mobile — logout/eliminar cuenta limpia el caché de `AsyncStorage`** — `authService.clearCachedData()` (nuevo) borra `barber-flow-appointments`, `barber-flow-notifications` y `barber-flow-settings-preferences`; se llama desde `clearStoredUser()` (logout) y `deleteSelf()`.

**9. Mobile — bloqueo biométrico/PIN al reabrir la app** — `expo-local-authentication` (nuevo, instalado vía `expo install`), plugin agregado a `app.config.js` con el texto de permiso de Face ID. `RootNavigator.tsx` chequea disponibilidad de biometría/PIN una vez al arrancar; si el dispositivo la soporta, bloquea con `LockScreen.tsx` tanto en frío (sesión restaurada desde `SecureStore`) como al volver del background (`AppState` listener). Fallback silencioso (no bloquea) si el dispositivo no tiene biometría/PIN configurado. `LockScreen` reintenta la autenticación al montar y ofrece un link de "Cerrar sesión" como salida si el usuario no puede/quiere autenticarse.

## Verificación realizada (Ronda 2)

- `dotnet test`: 205/205 en verde (57 Application + 40 Api + 108 Infrastructure) — incluye casos nuevos de IDOR en `AppointmentsApiTests.cs`/`ClientsApiTests.cs` (barbero B no puede ver/editar/borrar/mover un registro de barbero A → `404`; Admin sí puede; `search` solo devuelve lo propio), de `shopId`/paginación en los tests de repositorio, del backfill idempotente en `MongoDbBootstrapperTests.cs`, y del hasheo de refresh tokens en `MongoDbRefreshTokenRepositoryTests.cs`.
- `npm run lint` + `npm run build` en `barber-flow-web`: sin errores.
- `npx tsc --noEmit` + `npm run lint` en `barber-flow-mobile`: sin errores nuevos (las 4 warnings preexistentes de variables `err` sin usar no están relacionadas con este trabajo).
- Pendiente de verificación manual (no realizada en esta ronda, requiere navegador/dispositivo real): dos cuentas de barbero de prueba confirmando `404` cruzado en la UI; backfill corriendo contra Mongo de dev real; bloqueo biométrico en un dispositivo/emulador real.

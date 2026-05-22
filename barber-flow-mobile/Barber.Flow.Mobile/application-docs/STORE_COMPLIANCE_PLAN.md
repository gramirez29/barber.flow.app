# Plan: Play Store / App Store Compliance

## TL;DR
8 items pendientes para publicación en tiendas. Organizados en 4 fases independientes: identidad del app, seguridad/debug, privacidad y eliminación de cuenta. La fase 4 requiere cambios en backend (ASP.NET) y frontend.

---

## Phase 1 — App Identity (app.config.js only)
*Todos los cambios en un solo archivo. Paralelos entre sí.*

1. Cambiar `name` de `"Barber.Flow.Mobile"` → `"Barber Flow"` 
2. Cambiar Android `package` de `"com.anonymous.Barber.Flow.Mobile"` → `"com.guillermoramirez.barberflow"`
3. Agregar iOS `bundleIdentifier: "com.guillermoramirez.barberflow"` dentro de la sección `ios`
4. Agregar `ios.buildNumber: "1"` y `android.versionCode: 1`
5. Cambiar `ios.supportsTablet: true` → `false`

**Archivo:** `barber-flow-mobile/Barber.Flow.Mobile/app.config.js`

---

## Phase 2 — Remove Debug Alert (config.ts)
*Independiente de las demás fases.*

6. Eliminar el bloque `if (APP_ENV === "development" || APP_ENV === "testing") { alert(...) }` de `src/config.ts`
   - El `alert()` se dispara en cada inicio de app en ambientes testing/dev — inaceptable en producción

**Archivo:** `barber-flow-mobile/Barber.Flow.Mobile/src/config.ts`

---

## Phase 3 — Privacy Policy (in-app link)
*Depende de que el usuario PRIMERO hostee una política de privacidad (URL externa).*

7. Agregar `PRIVACY_POLICY_URL` en `app.config.js` dentro de `extra` (configurable por ambiente)
8. Leer la URL en `src/config.ts` desde `expoExtra.PRIVACY_POLICY_URL`
9. Agregar botón "Política de Privacidad" en la sección "About" de `SettingsScreen.tsx` que llama `Linking.openURL(PRIVACY_POLICY_URL)` — usar el patrón existente de `contactActions.ts` (direct `Linking.openURL` sin `canOpenURL`)
10. Agregar strings de localización en `es.ts` y `en.ts`:
    - `settings.privacyPolicy` → "Política de privacidad" / "Privacy Policy"
    - `settings.privacyPolicyDescription` → "Lee cómo manejamos tus datos" / "Read how we handle your data"

**Archivos:**
- `app.config.js`
- `src/config.ts`
- `src/screens/SettingsScreen.tsx`
- `src/localization/es.ts`
- `src/localization/en.ts`

**Prerequisito externo:** El usuario debe crear y hostear la política de privacidad (Google Docs, GitHub Pages, Notion, etc.) antes de este paso.

---

## Phase 4 — Account Deletion (backend + frontend)
*Requisito de Apple App Store 5.1.1(v) y Google Play (desde agosto 2023). Más complejo — cambios en 8 archivos.*

### 4a. Backend (ASP.NET Core)

11. **`IUserService.cs`**: Agregar método `Task<bool> DeleteAsync(string id, CancellationToken cancellation = default)` — `IUserRepository.DeleteAsync` ya existe en el dominio.

12. **`UserService.cs`**: Implementar `DeleteAsync` delegando a `_repo.DeleteAsync(id, cancellation)`.

13. **`UsersApi.cs`**: Agregar endpoint `DELETE /api/users/me` con `.RequireAuthorization()`:
    - Lee el claim `sub` (User ID) del JWT via `HttpContext.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value` o `ClaimTypes.NameIdentifier`
    - Llama `userService.DeleteAsync(userId)`
    - Si hay Barber data asociada, verificar si `IUserRepository.DeleteAsync` ya la maneja en cascada (revisar infrastructure). Si no, también llamar `barberService.DeleteAsync` buscando primero por userId
    - Retorna `204 NoContent` o `404 NotFound`

    > **Nota de riesgo**: El Admin no debe poder auto-eliminarse accidentalmente. Agregar validación `if (user.Role == "Admin") return TypedResults.Forbid()`.

### 4b. Frontend (React Native / Expo)

14. **`src/services/authService.ts`**: Agregar método `deleteSelf()` que llama `apiFetch("/api/users/me", { method: "DELETE" })`, luego `SecureStore.deleteItemAsync("applicationUser")`.

15. **`src/components/ui/AppDrawerContent.tsx`**: Agregar acción destructiva "Eliminar mi cuenta" en la sección `support` (ya tiene `renderAction`), visible SOLO para usuarios no-Admin (`user?.role !== "Admin"`):
    - `icon: "trash-outline"`
    - `destructive: true`
    - On press: `showAlert` con mensaje de advertencia fuerte (acción irreversible), en confirm: llama `authService.deleteSelf()`, luego `clearUser()`, luego cierra drawer

16. **`src/localization/es.ts` y `en.ts`**: Agregar bajo `drawer`:
    - `deleteAccount` → "Eliminar mi cuenta" / "Delete My Account"
    - `deleteAccountDescription` → "Elimina permanentemente tu cuenta y datos" / "Permanently delete your account and data"
    - `deleteAccountTitle` → "Eliminar cuenta" / "Delete Account"
    - `deleteAccountMessage` → "Esta acción es permanente e irreversible. Se eliminarán todos tus datos." / "This action is permanent and irreversible. All your data will be deleted."
    - `deleteAccountConfirm` → "Eliminar" / "Delete"

---

## Relevant Files

### Frontend
- `barber-flow-mobile/Barber.Flow.Mobile/app.config.js` — Phases 1 & 3
- `barber-flow-mobile/Barber.Flow.Mobile/src/config.ts` — Phases 2 & 3
- `barber-flow-mobile/Barber.Flow.Mobile/src/screens/SettingsScreen.tsx` — Phase 3
- `barber-flow-mobile/Barber.Flow.Mobile/src/services/authService.ts` — Phase 4b
- `barber-flow-mobile/Barber.Flow.Mobile/src/components/ui/AppDrawerContent.tsx` — Phase 4b
- `barber-flow-mobile/Barber.Flow.Mobile/src/localization/es.ts` — Phases 3 & 4
- `barber-flow-mobile/Barber.Flow.Mobile/src/localization/en.ts` — Phases 3 & 4

### Backend
- `barber-flow-api/Barber.Flow.Api/Barber.Flow.Application/Services/Users/IUserService.cs` — Phase 4a
- `barber-flow-api/Barber.Flow.Api/Barber.Flow.Application/Services/Users/UserService.cs` — Phase 4a
- `barber-flow-api/Barber.Flow.Api/Barber.Flow.Api/Apis/UsersApi.cs` — Phase 4a

---

## Verification
1. EAS build `testing` profile: confirmar que el package ID nuevo no tiene conflicto en EAS dashboard
2. `npx expo config --type introspect` para verificar que `bundleIdentifier` y `package` están seteados
3. Probar en Android: la app no debe mostrar el `alert()` al iniciar
4. Probar "Política de privacidad": el link abre el navegador correctamente
5. Probar "Eliminar mi cuenta" (usuario no-admin): flujo completo → login screen
6. Verificar que el Admin NO ve el botón "Eliminar mi cuenta"
7. Verificar en backend: `DELETE /api/users/me` retorna 401 sin JWT, 204 con JWT válido

---

## Decisions
- **Package ID**: `com.guillermoramirez.barberflow` (consistente con el nombre del developer en Settings About — "Guillermo Ramirez")
- **supportsTablet**: `false` — app está diseñada para móvil, no hay layout iPad
- **Delete account visibility**: Solo para no-Admin (el admin puede auto-eliminarse desde la gestión de usuarios si es necesario)
- **Privacy policy hosting**: Responsabilidad del usuario — el plan solo agrega el link in-app
- **Scope excluido**: No se cambia el nombre en `package.json` (es el nombre npm, no afecta las tiendas). No se implementa web-based account deletion form (Play Store también lo requiere, pero el in-app es el mínimo para pasar la revisión inicial).

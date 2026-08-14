# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> This is the `barber-flow-mobile/Barber.Flow.Mobile/` subproject of the Barber Flow monorepo. See the root `CLAUDE.md` for cross-app context (backend, web, deployment). This file covers only what's specific to the mobile app.

## Commands

```bash
npm start                # Expo dev server
npm run android          # Android emulator/device
npm run ios              # iOS simulator (Mac only)
npm run web              # Expo web (react-native-web)
npm run lint             # eslint .
npm test                 # jest
npm run dev              # APP_ENV=development expo start
npm run build:testing    # EAS build, Android, testing profile (apk, hits Railway/Atlas)
npm run build:prod       # EAS build, Android, production profile
```

There's no `test -- <pattern>` script wired up; run Jest directly for a single file/suite: `npx jest src/features/appointments/__tests__/foo.test.ts`.

## Environment / API base URL

`src/config.ts` resolves `BASE_URL` in this order: `process.env.BARBERFLOW_API_URL` → `Constants.expoConfig.extra.BASE_URL` (set in `app.config.js`) → a hardcoded per-`APP_ENV` fallback. The `development` fallback is a developer's local LAN IP (currently `http://192.168.68.56:7016` in `app.config.js`) — **update this to your own machine's IP** when running the API locally, or set `BARBERFLOW_API_URL`/`.env` instead of editing the fallback.

`app.config.js`'s `URL_BY_ENV` maps the three `APP_ENV` values used across `eas.json`'s build profiles and the `dev` npm script: `development` → local LAN IP (local API + local Docker Mongo), `testing` → the Railway `develop` deployment (MongoDB Atlas) via the `testing` EAS profile (`buildType: apk`, for installing on a physical phone), `production` → the same Railway `develop` URL for now (`buildType: app-bundle`; update this once a dedicated production Railway environment exists).

`ADMIN_USERNAME` in `config.ts` is a hardcoded username used to gate the admin-only "manage users" section in Settings — prefer checking `user.role === "Admin"` (already present on `ApplicationUser`) over adding new username-based checks if you touch this area.

## Architecture

Provider order in `App.tsx` matters and is not arbitrary:
```
SafeAreaProvider > DialogProvider > ThemeProvider > LanguageProvider > NotificationProvider > NavigationContainer > RootNavigator
```
`DialogProvider` wraps `ThemeProvider` because dialogs need theme access; `NotificationProvider` sits inside `LanguageProvider` because notification text needs translation.

### Navigation nesting
```
RootNavigator (Stack, auth gate)
├── Login / ForgotPassword / OtpVerification / ResetPassword  (unauthenticated)
└── DrawerNavigator → AppNavigator (bottom tabs)
    ├── CalendarNavigator (stack): CalendarScreen → AppointmentFormScreen
    ├── ClientsNavigator (stack): ClientsScreen → ClientFormScreen
    ├── DailyReportScreen
    ├── NotificationScreen
    └── SettingsScreen
```
`RootNavigator` restores the session from `expo-secure-store` on mount (via `authService.getStoredUser()`) and renders `null` until that resolves, to avoid a login-screen flash. There is no explicit logout call in the navigator — `authService.clearStoredUser()` (called from `SettingsScreen`) clears the Zustand auth store, and the tree re-renders to `Login` automatically because `user` becomes `null`.

Note: a `BarberShopSelectorScreen` and `barberShopService` (`/api/barbershops/*`) exist in `src/screens` / `src/services` for multi-shop support, alongside a `clientHistoryService`; these are newer additions not yet reflected in `application-docs/FRONTEND_ARCHITECTURE.md` — check the actual source when working in those areas rather than trusting that doc for anything shop/history-related.

### State: Zustand stores vs. React Context
- `store/auth.store.ts` — auth user, **no persistence** (session restore happens once in `RootNavigator` via SecureStore, not via Zustand `persist`).
- `features/appointments/appointment.store.ts` — appointments, **persisted** via `zustand/middleware/persist` + AsyncStorage. `fetchAppointmentsByDateRange` merges fetched results with out-of-range appointments already in the store (rather than replacing the whole array) so navigating months doesn't drop previously-loaded data. Selectors `getAppointmentsByDate` / `getCompletedAppointmentsByDate` are synchronous, local-only filters — they don't hit the network.
- React Context (`context/`) is used instead of Zustand for `LanguageContext`, `ThemeContext`, `NotificationContext`, `DialogContext` — state that many components need but doesn't require Zustand's render-optimization, or that has provider-mount-time setup logic.
- `NotificationContext` derives its list from `notificationService`, which is **entirely local**: it has no backend calls and computes notifications (next-day summaries, "client hasn't been in N+ days") from the appointments already in the Zustand store, persisting the result to AsyncStorage.

### Services layer
Everything in `src/services/` goes through `apiFetch` in `services/apis/apiClient.ts`, which attaches the JWT from `useAuthStore` (or SecureStore), auto-serializes `options.json`, and forces logout on a `401`. There is no refresh-token flow — a 401 always ends the session.

Backend responses aren't guaranteed to be consistently cased; services normalize with `response.id ?? response.Id` (and similarly for other fields) rather than assuming camelCase.

### Theming
`theme/themes.ts` defines `lightTheme`/`darkTheme` (accessed via `useAppTheme()` from `ThemeContext`), which also drive `react-native-paper` (MD3) and React Navigation's theme simultaneously — don't set MD3 or navigation theme colors independently of this file. `LoginScreen` is the one screen that intentionally does *not* use the theme system (its own local `COLORS` constant), since it must look identical regardless of light/dark mode.

### i18n
Custom `i18n-js` setup in `src/localization/` (`en.ts`, `es.ts`, default locale `es`), driven by `LanguageContext`, not `react-i18next` (that's web-only — see root CLAUDE.md). Adding a string means adding the key to both `en.ts` and `es.ts`.

## Known architectural debt (from `application-docs/FRONTEND_ARCHITECTURE.md` §18)

Worth checking before touching these areas — the doc has the full rationale:
- `appointment.store.ts` persist config has no `version`/`migrate` — changing the `Appointment` type shape can break existing installs' AsyncStorage data silently.
- `commissionPercentage`/`fixedDailyExpense` (used by `useDailyReport`) live only in AsyncStorage, not synced with the backend equivalent.
- No refresh-token support in `apiClient.ts`; a `401` always forces logout, no retry.

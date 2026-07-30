# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Barber Flow is a barbershop management system built as three independent apps in one repo, all talking to the same .NET API:

- **`barber-flow-api/Barber.Flow.Api/`** — .NET 9 backend (Clean Architecture, MongoDB, JWT auth). Under active development.
- **`barber-flow-mobile/Barber.Flow.Mobile/`** — React Native (Expo) app. Largely complete; the reference implementation for UI/UX parity.
- **`barber-flow-web/`** — React + TypeScript (Vite) web app, mirroring the mobile app's Clean Architecture layering. Newer, actively being built out.

Each subproject has its own `package.json`/`.csproj` and must be worked on from within its own directory — there is no shared root build.

## Backend — `barber-flow-api/Barber.Flow.Api/`

### Commands
```bash
# Run (from the Barber.Flow.Api/ solution folder)
dotnet run --project Barber.Flow.Api
dotnet watch run --project Barber.Flow.Api   # hot reload

# Tests
dotnet test                                                    # all tests
dotnet test --filter FullyQualifiedName~BarberRepositoryTests   # single class
dotnet test --collect:"XPlat Code Coverage"

# EF Core migrations (legacy — see note below)
dotnet ef migrations add <Name> --project Barber.Flow.Infrastructure --startup-project Barber.Flow.Api
dotnet ef database update --project Barber.Flow.Infrastructure --startup-project Barber.Flow.Api
```
Target framework: **net9.0** across all four projects (despite README/marketing copy saying .NET 8).

### Architecture
Strict Clean Architecture with dependency flowing inward:
```
Barber.Flow.Api            Controllers/minimal APIs (Apis/*.cs), Middleware, Program.cs, Swagger
Barber.Flow.Application    Use-case services (Services/<Feature>/<Feature>Service.cs + I<Feature>Service.cs), DTOs
Barber.Flow.Infrastructure MongoDB repository implementations, JWT (JwtAuthService), email (MailKit)
Barber.Flow.Domain         Entities, ValueObjects, repository interfaces — no external dependencies
```
Persistence is **MongoDB** (`MongoDB.Driver`), not the SQL/EF setup the README describes — that doc is stale. Repository interfaces live in `Barber.Flow.Domain/Interfaces/`, implementations in `Barber.Flow.Infrastructure/Services/MongoDb/`; there are also `InMemory*` fallback implementations used for tests/early dev.

Rules to follow when adding a feature:
1. Interface goes in `Barber.Flow.Application` (or `Barber.Flow.Domain` for repositories), implementation in `Barber.Flow.Infrastructure` — never the reverse.
2. MongoDB access uses typed `IMongoCollection<T>` with `Builders<T>.Filter` or LINQ — no raw string queries.
3. Secrets/JWT keys/MailKit credentials are never hardcoded — bind via `IOptions<T>` from `appsettings.json` (`Settings/EmailSettings.cs`, `MongoDbSettings.cs`, `FeatureFlags.cs`).
4. Controllers return `ActionResult<T>` with explicit status codes (`Ok`, `BadRequest`, `NotFound`, `CreatedAtAction`).
5. API request/response shapes must mirror the DTOs/types consumed by both frontends (`barber-flow-mobile/src/types` + `services/`, `barber-flow-web/src/application/dtos`).

Swagger: `https://localhost:5001/swagger` when running locally.

## Mobile — `barber-flow-mobile/Barber.Flow.Mobile/`

### Commands
```bash
npm start              # Expo dev server
npm run android         # Android emulator/device
npm run ios             # iOS simulator (Mac only)
npm run lint
npm test
npm run build:preview   # EAS preview build
npm run build:prod      # EAS production build (Android)
```
`npm test` is currently broken: `jest` isn't listed in `package.json` `devDependencies` (despite the `test` script invoking it) and there are no `*.test.*` files anywhere in the project — running it fails with `'jest' is not recognized`. This is pre-existing, not a regression; `npx tsc --noEmit` + `npm run lint` are the only working verification commands for this app today. Pending: install `jest`/`jest-expo` and add real coverage if mobile tests become a priority.

### Architecture
Feature-organized React Native app:
- `src/navigation/` — `RootNavigator` → `DrawerNavigator` → feature stack navigators (`CalendarNavigator`, `ClientsNavigator`).
- `src/features/<feature>/` — Zustand stores + form hooks colocated per feature (e.g. `appointments/appointment.store.ts`, `useAppointmentForm.ts`).
- `src/services/` — one file per backend resource (`authService.ts`, `clientService.ts`, ...), all routed through `services/apis/apiClient.ts` (Axios).
- `src/theme/` — `ThemeContext` + `themes.ts` drive light/dark mode; kept in sync conceptually with the web app's MUI theme.
- `src/localization/` — custom i18n (`en.ts`, `es.ts`) via `LanguageContext`, not `react-i18next` (that's web-only).

This app is the UX reference: when building the equivalent web screen, check the mobile screen/component first for expected behavior and copy.

## Web — `barber-flow-web/`

### Commands
```bash
npm run dev       # Vite dev server
npm run build      # tsc -b && vite build
npm run lint       # eslint --max-warnings 0
npm test           # vitest
npm test -- <pattern>   # single test file/suite
npm run test:ui    # vitest UI
```
Env vars come from `.env.local` (see `.env.example`): `VITE_API_BASE_URL`, `VITE_API_TIMEOUT`, `VITE_APP_ENV`.

### Architecture
Clean Architecture layering, stricter/more explicit than the mobile app's feature-folder style:
```
src/domain/           entities, repository interfaces (IAuthRepository, IClientRepository, ...), domain types — no framework deps
src/application/      use-cases/<feature>/*UseCase.ts (business logic, no React), dtos/{requests,responses}
src/infrastructure/   http/AxiosHttpClient (implements HttpClient interface), api/*Api.ts (implement domain interfaces), storage/
src/presentation/     React: components/, pages/, hooks/, context/ (AuthContext, ThemeContext, NotificationContext), routes/, theme/
src/shared/           constants, shared types, zod validation schemas, utils, localization (en.json/es.json via i18next)
```
Data flow for a new feature: `domain` entity/interface → `application` DTOs + use case → `infrastructure` API implementation (wraps `HttpClient`, maps response DTOs to domain entities) → `presentation` hook/component/page → wire into `presentation/routes/Router.tsx`. Also update both `shared/localization/{en,es}.json`.

Key conventions (see `ARCHITECTURE_DECISIONS.md` / `DEVELOPMENT_BEST_PRACTICES.md` for full rationale):
- Components are typed `React.FC<Props>`, not bare function declarations.
- UI library is **MUI v6** (Material Design 3) — chosen specifically for visual parity with the mobile app's React Native Paper components.
- Form state goes through the `useForm` hook (Zod schema + values/errors/touched), not ad-hoc `useState` per field.
- API error handling goes through `useApiError`, not raw try/catch per component.
- `AxiosHttpClient` is the only place that knows about Axios; everything else depends on the `HttpClient` interface, so swapping HTTP libraries touches one file.
- Global state: React Context for auth/theme/notifications; Zustand is intended for future complex/derived state, not yet used here.

## Cross-cutting notes

- Source code (types, methods, entities) is written in English across all three apps; the backend's existing `claude.md` notes that chat/explanation text there has historically been in Spanish — the web app's own docs (`ARCHITECTURE_DECISIONS.md`, `DEVELOPMENT_BEST_PRACTICES.md`) are also written in Spanish.
- Deployment target is **Railway**, via Dockerfiles in `barber-flow-api/` and `barber-flow-web/`; CI/CD is GitHub Actions (`.github/workflows/`).
- When changing API contracts, update DTOs in both `barber-flow-mobile` (`src/types`, `src/services`) and `barber-flow-web` (`src/application/dtos`) so all three apps stay in sync.

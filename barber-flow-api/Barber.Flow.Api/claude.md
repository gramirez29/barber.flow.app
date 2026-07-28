# System Context: BarberFlow

## Project Status
- Frontend (barber-flow-mobile): Practically completed using React Native + Expo. Fully structured UI components, navigators, and local stores.
- Backend (barber-flow-api): Under active development. MongoDB persistence pipeline exists for Client/BarberShop/Appointment/PasswordReset/Barber/User, but `Features:UseMongoDb` is still `false` in every `appsettings*.json` — nothing runs against real Mongo yet, pending manual verification before flipping the flag. Unit testing rollout is complete: 144 tests passing across all 4 test projects (see `UNIT_TESTING_PROGRESS.md`).
- Development Pace: Modular (4 to 5 hours per week). Chat interactions must be direct, optimized, and focused on solving specific tasks per layer.

## Backend Architecture (.NET 9)
The backend follows Clean Architecture principles, divided into 4 key projects under the net9.0 TargetFramework:

barber-flow-api/
├── Barber.Flow.Domain/          # Pure entities, business logic, and aggregates (No external dependencies).
├── Barber.Flow.Application/     # Use cases, DTOs, service interfaces, and application logic (References Domain only).
├── Barber.Flow.Infrastructure/  # Persistence implementation (MongoDB), MailKit, and security (JWT).
└── Barber.Flow.Api/             # Controllers, Middleware, FluentValidation, and Swagger setup.

### Key Project Mapping (Backend)
When working on features, reference the following existing structures in the workspace:
- API Endpoints (Barber.Flow.Api/Apis/): AppointmentsApi.cs, AuthApi.cs, BarbersApi.cs, BarberShopsApi.cs, ClientsApi.cs, UsersApi.cs, ReportsApi.cs.
- Application Services (Barber.Flow.Application/Services/): AppointmentService.cs, AuthService.cs, BarberService.cs, ClientService.cs, UserService.cs, ReportService.cs.
- Domain Interfaces (Barber.Flow.Domain/Interfaces/): IAppointmentRepository.cs, IBarberRepository.cs, IBarberShopRepository.cs, IClientRepository.cs, IUserRepository.cs, IReportRepository.cs, IEmailService.cs.
- Infrastructure Implementations (Barber.Flow.Infrastructure/Services/): MongoDbAppointmentRepository.cs, MongoDbBarberShopRepository.cs, MongoDbClientRepository.cs, MongoDbBarberRepository.cs, MongoDbUserRepository.cs, MongoDbPasswordResetRepository.cs, MongoDbBootstrapper.cs (registers BSON class maps, creates indexes, seeds the initial admin user), EmailService.cs, JwtAuthService.cs.
- `IBarberRepository`/`IUserRepository` are registered per-flag in `ApplicationExtensions.cs` (Mongo when `Features:UseMongoDb=true`, InMemory otherwise) — same pattern as Client/BarberShop/Appointment/PasswordReset.

### Key Dependencies & Frameworks
- Persistence: MongoDB (via MongoDB.Driver 3.9.0).
- Security / Auth: JWT Bearer (Microsoft.AspNetCore.Authentication.JwtBearer and System.IdentityModel.Tokens.Jwt 8.16.0). Note: `JwtAuthService.GetJsonWebTokenAsync` still hardcodes `admin`/`password` (marked `TODO` in source) — the real, working login path used by mobile is `POST /api/users/authentication` → `UserService` → `IUserRepository.GetAuthenticationUserAsync`, not `AuthApi`'s `/api/auth/login`.
- Messaging: MailKit 4.17.0 (OTP credential recovery implementation).
- Validation: FluentValidation 11.11.0 (Injected into the API layer for payload control).
- Testing: xUnit across 4 projects under `tests/` (`Barber.Flow.Domain.Tests`, `Barber.Flow.Application.Tests`, `Barber.Flow.Infrastructure.Tests`, `Barber.Flow.Api.Tests`), all registered in `Barber.Flow.Api.slnx` — **144 tests passing** (35 Application / 80 Infrastructure / 29 Api). `Barber.Flow.Application.Tests` uses Moq; `Barber.Flow.Infrastructure.Tests` uses Mongo2Go (embedded mongod, shared via `MongoDbFixture`/`ICollectionFixture`) for the `MongoDb*` repository tests plus plain instantiation for the `InMemory*` ones; `Barber.Flow.Api.Tests` uses `Microsoft.AspNetCore.Mvc.Testing` (pinned to 9.0.9 — the 10.x default only supports net10.0) via `ApiWebApplicationFactory`, which forces `Features:UseMongoDb=false` and `Features:UseRealEmail=false` so integration tests never touch real Mongo/SMTP. `Program.cs` has a trailing `public partial class Program { }` solely so `WebApplicationFactory<Program>` can reference it from the test assembly. See `UNIT_TESTING_IMPLEMENTATION_PLAN.md` and `UNIT_TESTING_PROGRESS.md` at the repo root for the full plan and per-layer breakdown.
- CI: the workflow GitHub Actions actually runs is `.github/workflows/ci-cd.yml` at the **repo root** — `barber-flow-api/Barber.Flow.Api/.github/workflows/api-ci.yml` is dead code (nested `.github` folders aren't picked up by Actions) and was left in place but not wired up. `ci-cd.yml`'s `backend` job now restores/builds/tests the whole `Barber.Flow.Api.slnx` (previously it only built the bare `Barber.Flow.Api.csproj` and pointed the test step at a path that didn't exist). There are also two parallel deploy workflows triggered by the same push events (`ci-cd.yml`'s SSH+docker-compose `deploy` job, and `dotnet-develop-api.yml`'s Railway CLI deploy) — unclear if both are still intentional; worth confirming before assuming either is the "real" one.

## Frontend Client Context
- Stack: React Native 0.81.5 + Expo ~54.0.33 | TypeScript ^6.0.2 (Strict Mode).
- State Management: Zustand 5.0.11 (auth.store.ts, appointment.store.ts).
- Localization: Custom i18n implementation (en.ts, es.ts) managed via LanguageContext.
- Navigation Structure: React Navigation 7 managed by RootNavigator, DrawerNavigator, and feature sub-navigators (CalendarNavigator, ClientsNavigator).

### Key Frontend Mapping (Workspace Structure)
- Navigation Layouts: AppNavigator.tsx, CalendarNavigator.tsx, ClientsNavigator.tsx, DrawerNavigator.tsx, RootNavigator.tsx.
- Core Screens:
  * Authentication: LoginScreen.tsx, ForgotPasswordScreen.tsx, OtpVerificationScreen.tsx, ResetPasswordScreen.tsx.
  * Application Flow: BarberShopSelectorScreen.tsx, CalendarScreen.tsx, AppointmentFormScreen.tsx, ClientsScreen.tsx, ClientFormScreen.tsx, DailyReportScreen.tsx, NotificationScreen.tsx, SettingsScreen.tsx.
- Features & Custom Hooks: UseAppointmentForm.ts, clientForm.ts, dailyReport.ts, reportCalculationsForm.ts, settingsForm.ts.
- Local Services & API Clients: apiClient.ts (Axios wrapper), appointmentService.ts, authService.ts, barberShopService.ts, clientService.ts, clientHistoryService.ts, notificationService.ts, settingsService.ts.
- Critical UI Components: ClientSelectorModal.tsx, AppointmentCard.tsx, CalendarView.tsx, ClientAppointmentHistory.tsx, AppDrawerContent.tsx.

## Execution Environment & Development Rules
- Docker: Configured for Linux-based targets using Azure Containers tooling.
- Deployment: Prepared for automated hosting on Railway.
- Languages: Source code (classes, variables, methods, and entities) structured in English. Chat explanations, internal method documentation, and prompt interactions in Spanish.

## Strict Rules for the AI Assistant (Claude Code / Chat)
1. Dependency Inversion Flow: When creating a repository or service, always declare the interface inside Barber.Flow.Application and implement it inside Barber.Flow.Infrastructure.
2. MongoDB Queries: Prioritize typed usage of IMongoCollection<T> using filter builders (Builders<T>.Filter) or native LINQ expressions. Avoid raw string-based queries.
3. Security Management: Under no circumstances propose hardcoding secrets, JWT tokens, or MailKit credentials in the code. Use abstractions via IOptions<T> mapped to appsettings.json.
4. HTTP Responses: Ensure that controllers in Barber.Flow.Api return clean action types (ActionResult<T>) with corresponding status codes (Ok, BadRequest, NotFound, CreatedAtAction).
5. API Contract Alignment: Ensure that endpoints built in the .NET backend directly mirror the expected payloads and structures declared in the frontend's 'types/' and 'services/' directory.

## Short-Term Development Roadmap (Pending)
1. [x] Configure the initial MongoDB dependency injection pipeline in Program.cs and bind appsettings.json.
2. [x] Audit existing domain models (User.cs, Client.cs, Appointments.cs) to ensure alignment with MongoDB NoSQL structures.
3. [x] Connect application services to MongoDb data repositories (Client, BarberShop, Appointment, PasswordReset, Barber, User all have Mongo implementations now).
4. [x] Unit testing rollout — 144 tests across Application/Infrastructure/Api, CI (`ci-cd.yml`) now actually builds and runs them. Full breakdown in `UNIT_TESTING_PROGRESS.md`.
5. [ ] Implement global exception handling middleware in the API layer.
6. [ ] Flip `Features:UseMongoDb` to `true` (Development first, then Production) and manually verify login/CRUD survive a process restart.
7. [ ] Decide whether `barber-flow-api/Barber.Flow.Api/.github/workflows/api-ci.yml` should be deleted (it's dead — not read by GitHub Actions) and confirm whether both deploy workflows (`ci-cd.yml`'s SSH deploy vs. `dotnet-develop-api.yml`'s Railway deploy) are still supposed to run in parallel.
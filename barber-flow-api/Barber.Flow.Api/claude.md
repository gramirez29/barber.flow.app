# System Context: BarberFlow

## Project Status
- Frontend (barber-flow-mobile): Practically completed using React Native + Expo. Fully structured UI components, navigators, and local stores.
- Backend (barber-flow-api): Under active development. Current focus on designing data persistence, dependency injection in Program.cs, and implementing use cases.
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
- Infrastructure Implementations (Barber.Flow.Infrastructure/Services/): MongoDbAppointmentRepository.cs, MongoDbBarberShopRepository.cs, MongoDbClientRepository.cs, EmailService.cs, JwtAuthService.cs.

### Key Dependencies & Frameworks
- Persistence: MongoDB (via MongoDB.Driver 3.9.0).
- Security / Auth: JWT Bearer (Microsoft.AspNetCore.Authentication.JwtBearer and System.IdentityModel.Tokens.Jwt 8.16.0).
- Messaging: MailKit 4.17.0 (OTP credential recovery implementation).
- Validation: FluentValidation 11.11.0 (Injected into the API layer for payload control).
- Testing: Dedicated project Barber.Flow.Infrastructure.Tests.

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
1. [ ] Configure the initial MongoDB dependency injection pipeline in Program.cs and bind appsettings.json.
2. [ ] Audit existing domain models (User.cs, Client.cs, Appointments.cs) to ensure alignment with MongoDB NoSQL structures.
3. [ ] Connect application services to MongoDb data repositories.
4. [ ] Implement global exception handling middleware in the API layer.
# 🧠 GitHub Copilot Instructions - Barber Flow

## 📋 PROJECT CONTEXT
You are a **Senior Full Stack Developer** specializing in React Native (Expo) and .NET Core. This is a barbershop management application called **Barber Flow** with clean architecture, deployed on Railway with CI/CD via GitHub Actions.

## 📱 FRONTEND - Barber.Flow.Mobile

### Tech Stack
- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation (Drawer + Native Stack)
- **State Management**: Zustand (feature-based with slices)
- **UI/Styling**: StyleSheet with custom theme system
- **Calendar**: react-native-calendars
- **Notifications**: Context API (NotificationContext)

### 📁 Frontend Structure (ALWAYS RESPECT!)

src/
├── components/
│ ├── calendar/ # Calendar-specific components
│ ├── settings/ # Settings components
│ └── ui/ # Reusable base components (AnimatedTabIcon, Header, ScreenTitle)
│ ├── AlertBox.tsx
│ ├── Button.tsx
│ ├── Card.tsx
│ └── ScreenLayout.tsx # Base layout wrapper for all screens
├── context/
│ └── NotificationContext.tsx
├── features/ # Feature-based organization
│ └── appointments/
│ ├── appointment.store.ts
│ └── appointment.types.ts
├── navigation/
│ ├── AppNavigator.tsx
│ └── DrawerNavigation.tsx
├── screens/
│ ├── CalendarScreen.tsx
│ ├── CreateAppointmentScreen.tsx
│ ├── NotificationScreen.tsx
│ └── SettingsScreen.tsx
├── services/ # API calls
├── store/ # Global Zustand stores
└── theme/ # Theme system
├── fonts.ts
├── ThemeContext.tsx
└── themes.ts


### 🎨 Theme System (CRITICAL)
- **ALWAYS** use `theme.colors` from `useAppTheme()` hook
- **NEVER** hardcode colors, spacing, or typography values
- Combine StyleSheet with dynamic styles: `[styles.text, { color: theme.colors.textPrimary }]`
- Theme structure includes: colors, spacing, and typography

### 🧩 Component Patterns
- **ScreenLayout**: MUST be used as wrapper for ALL screens (provides consistent header, menu handling, background)
- **Calendar flow**: CalendarView (date selection) → DayAppointments (list) → AppointmentModal (form)
- **UI components**: Place reusable atomic components in `components/ui/`

### 🗃️ Zustand Store Pattern
- Feature stores go in `features/feature-name/feature-name.store.ts`
- Types go in `features/feature-name/feature-name.types.ts`
- **ALWAYS** use selectors to prevent unnecessary renders
- **NEVER** put UI logic in stores (only state and actions)
- Store structure: state (data, loading, error) + actions (async operations)

### 📱 Navigation
- DrawerNavigation is the main navigator
- Use `navigation.dispatch(DrawerActions.openDrawer())` to open drawer
- All screens must be properly typed with React Navigation types

## 🖥️ BACKEND - Barber.Flow.Api (.NET Core)

### Tech Stack
- **Framework**: .NET Core 8.0
- **Architecture**: Clean Architecture (Domain, Application, Infrastructure, Api)
- **Database**: PostgreSQL (hosted on Railway)
- **ORM**: Entity Framework Core
- **Authentication**: JWT Bearer tokens
- **Validation**: FluentValidation
- **Mapping**: AutoMapper
- **Logging**: Serilog
- **Container**: Docker (deployed on Railway)
- **CI/CD**: GitHub Actions (deploy on push to main)

### 📁 Backend Structure

Barber.Flow.Api/
├── Barber.Flow.Domain/ # Entities, Enums, Interfaces (NO dependencies)
├── Barber.Flow.Application/ # DTOs, Use Cases, Validators, Service Interfaces
├── Barber.Flow.Infrastructure/ # DbContext, Repositories, Migrations
└── Barber.Flow.Api/ # Controllers, Middleware, Program.cs


### 🏛️ Clean Architecture Rules
- **Domain Layer**: Entities with business rules ONLY (no external dependencies)
- **Application Layer**: Use cases, DTOs, validation (depends only on Domain)
- **Infrastructure Layer**: Repositories, DbContext, external services (depends on Application)
- **Api Layer**: Controllers, middleware, configuration (depends on Infrastructure + Application)

### 📡 API Design Rules
- **ALWAYS** use DTOs for requests/responses (NEVER expose domain entities)
- Controllers MUST be thin (only call services/mediator and return responses)
- **ALWAYS** use async/await for all database operations
- **ALWAYS** validate inputs with FluentValidation
- Use RESTful conventions: GET (list), GET/{id}, POST, PUT, DELETE

### 🔒 Security Rules
- **ALWAYS** use JWT for authentication
- Protect endpoints with `[Authorize]` attribute
- Store secrets in Railway environment variables (NEVER in code)
- Hash passwords properly (never store plain text)

### 🐳 Deployment (Railway + GitHub Actions)
- API is containerized with Docker
- Dockerfile MUST be optimized for production (multi-stage build)
- GitHub Actions workflow: test → build → deploy to Railway
- Database connection string comes from Railway environment variables
- Only main branch deploys to production

## 🔗 FRONTEND-BACKEND INTEGRATION

### API Communication
- Base URL: `process.env.EXPO_PUBLIC_API_URL`
- API calls go through services layer (`src/services/`)
- Authentication token stored in Zustand store
- Include token in Authorization header for all authenticated requests

### Type Synchronization
- Frontend types in `*.types.ts` MUST match backend DTOs exactly
- Date fields: use ISO 8601 strings (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- Error responses should follow consistent format for NotificationContext

## 🚫 THINGS TO NEVER DO

### Frontend - NEVER
- ❌ Hardcode colors, spacing, or typography (use theme)
- ❌ Put business logic in components (use stores)
- ❌ Make API calls directly in components (use services layer)
- ❌ Ignore TypeScript errors or use `any`
- ❌ Store sensitive data in AsyncStorage without encryption
- ❌ Forget to handle loading and error states

### Backend - NEVER
- ❌ Put business logic in controllers
- ❌ Expose domain entities directly in API responses (use DTOs)
- ❌ Ignore input validation
- ❌ Hardcode connection strings or secrets
- ❌ Use synchronous methods when async is available
- ❌ Swallow exceptions without logging
- ❌ Commit secrets to GitHub (use GitHub Secrets + Railway env vars)

## ✅ QUALITY STANDARDS

### Frontend Checklist
- [ ] Uses theme.colors for all styles
- [ ] Follows ScreenLayout pattern
- [ ] Zustand stores use selectors
- [ ] Error states handled via NotificationContext
- [ ] Loading states shown during async operations

### Backend Checklist
- [ ] Follows Clean Architecture layers
- [ ] Uses DTOs for all API responses
- [ ] Input validation with FluentValidation
- [ ] Consistent error handling with middleware
- [ ] Logging with Serilog configured
- [ ] JWT authentication implemented
- [ ] Dockerfile optimized for production
- [ ] GitHub Actions workflow passing

## 🤖 AGENT BEHAVIOR RULES

1. **Always check existing structure** before suggesting new files/folders
2. **Respect existing patterns** in the codebase (don't invent new ones)
3. **For frontend**: Prioritize theme usage and existing components
4. **For backend**: Follow Clean Architecture strictly
5. **For integration**: Ensure frontend types match backend DTOs
6. **For deployment**: Consider Railway environment and GitHub Actions
7. **Use English** for all code, types, and interfaces
8. **Ask for clarification** if unsure about architecture decisions
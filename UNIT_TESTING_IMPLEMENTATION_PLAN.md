# Plan de Implementación de Unit Testing — Barber.Flow.Api

> Alcance: `barber-flow-api/Barber.Flow.Api/` (backend .NET 9, Clean Architecture). No cubre mobile ni web.

---

## 1. Estado actual

- Existe un único proyecto de test: `tests/Barber.Flow.Infrastructure.Tests` (xUnit), con **un solo archivo** (`BarberRepositoryTests.cs`) que prueba `InMemoryBarberRepository`.
- No hay proyectos de test para `Barber.Flow.Domain`, `Barber.Flow.Application` ni `Barber.Flow.Api`.
- No hay librería de mocks instalada (no hay forma de testear un `Service` sin instanciar su repositorio real).
- No hay recolección de cobertura configurada (`coverlet`), ni reporte HTML.
- `.github/workflows/api-ci.yml` compila el `.sln` pero **no ejecuta `dotnet test`** — hoy nada rompe el build si un test falla. Además usa `dotnet-version: "8.0.x"` mientras los proyectos targetean `net9.0`; hay que corregir esto al tocar el workflow.
- Los repositorios `MongoDb*` (Client, BarberShop, Appointment, PasswordReset, Barber, User) no tienen ninguna prueba — son la parte más riesgosa de tocar sin cobertura porque construyen `FilterDefinition`/`UpdateDefinition` a mano.

## 2. Stack propuesto (mínimo necesario, sin herramientas exóticas)

| Necesidad | Elección | Por qué |
|---|---|---|
| Framework de test | **xUnit** | Ya está en uso; no se introduce nada nuevo. |
| Mocking de interfaces (`IClientRepository`, `IEmailService`, etc.) | **Moq** | Estándar de facto en .NET, una sola dependencia nueva. |
| Aserciones | `Assert` de xUnit (el que ya usa `BarberRepositoryTests.cs`) | Evita añadir `FluentAssertions` solo por preferencia de estilo. |
| Integración contra Mongo real (repos `MongoDb*`) | **Mongo2Go** | Levanta un `mongod` embebido en memoria por test run, sin depender de Docker en CI. Alternativa a mockear `IMongoCollection<T>`, que es frágil y no prueba los filtros reales. |
| Integración de endpoints (`*Api.cs`) | **Microsoft.AspNetCore.Mvc.Testing** (`WebApplicationFactory<Program>`) | Es el enfoque estándar para Minimal APIs; permite levantar la app en memoria con `Features:UseMongoDb=false` (repos InMemory) para tests rápidos y aislados. |
| Cobertura | `coverlet.collector` (vía `dotnet test --collect:"XPlat Code Coverage"`, ya documentado en `CLAUDE.md`) + `ReportGenerator` para HTML local | No requiere servicio externo (Codecov, etc.); todo corre localmente y en CI. |

No se introduce AutoFixture, Testcontainers, Specflow ni BDD — serían complejidad adicional sin necesidad real dado el tamaño del proyecto.

## 3. Estructura de proyectos de test (espejo de Clean Architecture)

```
barber-flow-api/Barber.Flow.Api/tests/
├── Barber.Flow.Domain.Tests/            (nuevo)
├── Barber.Flow.Application.Tests/       (nuevo)
├── Barber.Flow.Infrastructure.Tests/    (existente, se amplía)
└── Barber.Flow.Api.Tests/               (nuevo, tests de integración)
```

Cada proyecto referencia únicamente la capa que prueba (mismo principio de dependencia que la app productiva). `Barber.Flow.Api.Tests` referencia el proyecto `Barber.Flow.Api` completo porque usa `WebApplicationFactory`.

Agregar los 3 proyectos nuevos al `Barber.Flow.Api.sln` para que `dotnet test` desde la raíz del backend los recoja a todos.

## 4. Convenciones

- Un archivo de test por clase productiva: `ClientService.cs` → `ClientServiceTests.cs`.
- Carpetas dentro de cada proyecto de test que reflejan la estructura de la capa (`Services/Clients/`, `MongoDb/`, `Apis/`).
- Nombre de test: `Metodo_Escenario_ResultadoEsperado` (ej. `CreateAsync_ValidClient_ReturnsClientWithGeneratedId`).
- Patrón AAA (Arrange/Act/Assert) explícito con comentarios solo si el arrange es no obvio.
- Un mock por dependencia de la clase bajo prueba; no mockear lo que no se usa en el test.

## 5. Qué cubrir por capa

### 5.1 `Barber.Flow.Domain` (prioridad baja)
Son POCOs y un par de `record`. Only testear donde haya lógica real:
- `BarberSettings` — igualdad estructural del `record` (trivial, opcional).
- No vale la pena testear entidades sin comportamiento (`Client`, `Appointments`, etc.) — solo tienen propiedades.

### 5.2 `Barber.Flow.Application` (prioridad alta — es donde vive la lógica de negocio)
Mockear el/los repositorios de cada servicio con Moq y probar:

| Servicio | Casos a cubrir |
|---|---|
| `ClientService` | Create/Update/Delete delegan correctamente; `FindAsync` propaga paginación/query. |
| `AppointmentService` | Create asigna `Id` si falta; `MoveAsync` no encontrado devuelve `null`; búsqueda por rango de fechas. |
| `BarberService` | `GetNextIdAsync` peek vs create (ya cubierto parcialmente en Infra, replicar a nivel de servicio con mock). |
| `UserService` | Delegación pura a `IUserRepository` (tests simples, un mock, una llamada). |
| `AuthService` | **El más crítico**: `RequestPasswordResetAsync` invalida tokens previos y genera OTP de 6 dígitos; `VerifyOtpAsync` rechaza token vencido/usado; `ResetPasswordAsync` marca el token como usado solo si `UpdatePasswordAsync` tuvo éxito. Mockear `IUserRepository`, `IPasswordResetRepository`, `IEmailService`. |
| `ReportService` | Delegación pura (hoy es un passthrough a `IReportRepository`; si se conecta a datos reales en el futuro, aquí es donde crecen los casos). |

### 5.3 `Barber.Flow.Infrastructure` (prioridad alta — filtros/updates de Mongo son fáciles de romper en silencio)

**Repos `InMemory*`** (ampliar lo ya empezado en `BarberRepositoryTests.cs`):
- `InMemoryClientRepository`, `InMemoryAppointmentRepository`, `InMemoryBarberShopRepository`, `InMemoryReportRepository`.
- Casos: CRUD básico, `FindAsync` con query/paginación, `GetNextIdAsync` (peek no debe avanzar el contador).

**Repos `MongoDb*`** (con Mongo2Go, contra una base real, sin mocks):
- `MongoDbClientRepository`, `MongoDbBarberShopRepository`, `MongoDbAppointmentRepository`, `MongoDbBarberRepository`, `MongoDbUserRepository`, `MongoDbPasswordResetRepository`.
- Casos por repo: `CreateAsync` persiste y genera `Id`/`CreatedAt`; `UpdateAsync` solo cambia los campos mapeados en el `Builders<T>.Update.Set(...)` (fácil olvidar uno al agregar un campo nuevo); `FindAsync` con regex de búsqueda (verificar que `Regex.Escape` no rompe con caracteres especiales); `DeleteAsync` sobre id inexistente devuelve `false`.
- `MongoDbUserRepository.GetAuthenticationUserAsync`: username case-insensitive, password case-sensitive exacta (este es el comportamiento que se corrigió recientemente respecto al InMemory — vale la pena un test explícito que documente la decisión).
- `MongoDbBootstrapper`: test de que `CreateManyAsync` no lanza si los índices ya existen (idempotencia en reinicios), y que `SeedInitialAdminUserAsync` no inserta un segundo admin si la colección ya tiene usuarios.

**Otros:**
- `JwtAuthService` — el login hardcodeado (`admin`/`password`) debería tener un test que **documente explícitamente que es código temporal** (`[Fact(Skip = "...")]` no; mejor un test que falle claramente si algún día cambia sin querer el usuario/clave hardcodeados, hasta que se reemplace por `IUserRepository`).
- `EmailService` / `ConsoleEmailService` — verificar que `ConsoleEmailService` no lanza excepción (es el fallback usado en dev/test).

### 5.4 `Barber.Flow.Api` (prioridad media — integración end-to-end de contratos)

Con `WebApplicationFactory<Program>` y `Features:UseMongoDb=false` (repos InMemory, rápido y sin infraestructura externa):

| Endpoint group | Casos a cubrir |
|---|---|
| `AuthApi` | Login inválido devuelve 400; forgot-password/verify-otp/reset-password (happy path + email inexistente). |
| `UsersApi` | `/api/users/authentication` con credenciales válidas devuelve token; `/api/users/me` (delete) requiere rol no-Admin. |
| `ClientsApi`, `AppointmentsApi`, `BarberShopsApi` | CRUD feliz + 404 en update/delete de id inexistente + 401 sin token en endpoints con `RequireAuthorization()`. |
| `BarbersApi` | Create/Update/Delete devuelven 403 si el usuario autenticado no es el admin configurado (`BARBERFLOW_ADMIN_USERNAME`). |
| `BarberRequestValidator` (FluentValidation) | Casos de formato de teléfono inválido, email inválido, commission fuera de rango — se puede testear el validator directo sin levantar la app (más rápido que un test de integración). |

## 6. Fases de implementación (orden sugerido)

1. **Fase 0 — Infraestructura de testing.** Crear los 3 proyectos nuevos, agregar `Moq`, `Mongo2Go`, `Microsoft.AspNetCore.Mvc.Testing` y `coverlet.collector` a los `.csproj` correspondientes, y agregarlos al `.sln`. Ningún test todavía, solo que `dotnet test` corra en 0 archivos sin error.
2. **Fase 1 — `Barber.Flow.Application`.** Es donde vive la lógica de negocio real y donde un bug es más caro. Empezar por `AuthService` (más crítico), seguir con `AppointmentService`, `ClientService`, `BarberService`, `UserService`.
3. **Fase 2 — Repos `MongoDb*` con Mongo2Go.** Cubrir los 6 repositorios Mongo, dando prioridad a los que ya están en producción hoy (Client, BarberShop, Appointment, PasswordReset) antes que a los recién agregados (Barber, User).
4. **Fase 3 — Repos `InMemory*`.** Menor prioridad porque solo se usan como fallback de desarrollo/test, pero son baratos de cubrir y ya hay un ejemplo (`BarberRepositoryTests.cs`) que replicar.
5. **Fase 4 — `Barber.Flow.Api` (integración).** Contratos HTTP, autorización, validación. Se benefician de todo lo anterior porque ya hay servicios y repos bien probados por debajo.
6. **Fase 5 — CI.** Agregar step `dotnet test --collect:"XPlat Code Coverage"` a `.github/workflows/api-ci.yml`, corregir `dotnet-version` a `9.0.x`, y publicar el resumen de cobertura como artifact del workflow. Definir un umbral mínimo (sugerido: 70% en Application e Infrastructure, sin umbral estricto en Api/Domain) que falle el build si se rompe — evitar que la cobertura decaiga silenciosamente en el futuro.

## 7. Medir cobertura localmente

```bash
cd barber-flow-api/Barber.Flow.Api
dotnet test --collect:"XPlat Code Coverage"
# genera un .cobertura.xml por proyecto de test en TestResults/<guid>/

# reporte HTML legible (requiere: dotnet tool install -g dotnet-reportgenerator-globaltool)
reportgenerator -reports:"**/TestResults/**/coverage.cobertura.xml" -targetdir:"CoverageReport" -reporttypes:Html
```

## 8. Fuera de alcance de este plan (deuda relacionada, no bloqueante)

- `IReportRepository`/`ReportService` devuelven datos inventados y el frontend mobile no los consume (confirmado en `application-docs/FRONTEND_ARCHITECTURE.md` — el reporte se calcula localmente). Se testea como está hoy (passthrough), sin rediseñar el feature.
- `JwtAuthService` tiene credenciales hardcodeadas (`admin`/`password`) como código temporal marcado con `TODO`. Este plan lo cubre con un test que documenta el comportamiento actual, pero **reemplazarlo por autenticación real contra `IUserRepository`** es un cambio de producto, no de testing, y debería resolverse aparte (ver `application-backend-docs/PERFORMANCE_AND_SECURITY_AUDIT.md`, problema crítico #1).

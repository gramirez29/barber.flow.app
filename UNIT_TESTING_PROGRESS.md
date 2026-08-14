# Unit Testing — Estado de Avance

> Complementa `UNIT_TESTING_IMPLEMENTATION_PLAN.md` (el plan original). Todas las fases del plan están completas.

---

## Resumen

**144 tests, todos pasando** (`dotnet test` desde `barber-flow-api/Barber.Flow.Api/`):

| Proyecto | Tests | Estado |
|---|---|---|
| `Barber.Flow.Application.Tests` | 35 | ✅ |
| `Barber.Flow.Infrastructure.Tests` | 80 | ✅ (verificado en máquina sin el bloqueo WDAC descrito abajo) |
| `Barber.Flow.Api.Tests` | 29 | ✅ |
| `Barber.Flow.Domain.Tests` | 0 | Proyecto scaffolded, sin tests — las entidades de Domain son POCOs sin comportamiento propio, no había nada que justificara un test (ver plan §5.1) |

## 1. Infraestructura de testing (Fase 0) — ✅

- 4 proyectos de test bajo `tests/`, todos en `Barber.Flow.Api.slnx` (el `.slnx` original no incluía ninguno — corregido).
- `Barber.Flow.Application.Tests`: xUnit + `Moq`.
- `Barber.Flow.Infrastructure.Tests`: xUnit + `Mongo2Go` (mongod embebido) + `coverlet.collector`.
- `Barber.Flow.Api.Tests`: xUnit + `Microsoft.AspNetCore.Mvc.Testing` (pinneado a 9.0.9 — la versión 10.x del template no es compatible con `net9.0`).

## 2. Fase 1 — `Barber.Flow.Application` — ✅ 35 tests

| Archivo | Tests | Qué cubre |
|---|---|---|
| `AuthServiceTests.cs` | 11 | Login, forgot-password (invalida tokens previos, OTP de 6 dígitos, envía email), verify-otp, reset-password (solo marca el token usado si `UpdatePasswordAsync` tuvo éxito) |
| `AppointmentServiceTests.cs` | 7 | Delegación pura a `IAppointmentRepository` |
| `ClientServiceTests.cs` | 5 | Delegación pura a `IClientRepository` |
| `BarberServiceTests.cs` | 6 | Delegación pura a `IBarberRepository` |
| `UserServiceTests.cs` | 5 | Delegación pura a `IUserRepository` |
| `ReportServiceTests.cs` | 1 | Delegación pura a `IReportRepository` |

## 3. Fase 2 — Repos `MongoDb*` con Mongo2Go — ✅ 51 tests (dentro de los 80 de Infrastructure)

Fixture compartido: `tests/Barber.Flow.Infrastructure.Tests/MongoDb/MongoDbFixture.cs` — un `mongod` embebido vía `ICollectionFixture<MongoDbFixture>`, con una base de datos nueva por test (prefijo corto `test_` + GUID; el nombre completo del método de test se descartó porque superaba el límite de 63 caracteres de MongoDB en algunos casos).

| Archivo | Tests | Qué cubre |
|---|---|---|
| `MongoDbClientRepositoryTests.cs` | 8 | CRUD, que `UpdateAsync` no toca `CreatedBy`/`CreatedAt`, búsqueda por query/regex especial, paginación |
| `MongoDbAppointmentRepositoryTests.cs` | 12 | `GetNextIdAsync` peek vs create, `MoveAsync`, `FindAsync` por rango/status, `GetClientHistoryAsync`, `FindByPhoneAsync` |
| `MongoDbBarberShopRepositoryTests.cs` | 8 | Scoping por `CreatedBy`/`userName`, `UpdateAsync` lanza `InvalidOperationException` si no autorizado |
| `MongoDbUserRepositoryTests.cs` | 8 | Username case-insensitive / password case-sensitive (decisión tomada al escribir el repo), `GetByEmailAsync` case-insensitive, `UpdatePasswordAsync` |
| `MongoDbPasswordResetRepositoryTests.cs` | 5 | Token válido/vencido/usado/con OTP incorrecto, invalidación masiva por usuario |
| `MongoDbBarberRepositoryTests.cs` | 7 | Igual que Client/BarberShop + preserva `Settings` en update |
| `MongoDbBootstrapperTests.cs` | 3 | `StartAsync` idempotente (se puede llamar dos veces sin error), seed de admin solo si la colección está vacía |

## 4. Fase 3 — Repos `InMemory*` — ✅ 29 tests (dentro de los 80 de Infrastructure)

| Archivo | Tests |
|---|---|
| `InMemoryClientRepositoryTests.cs` | 7 |
| `InMemoryAppointmentRepositoryTests.cs` | 11 |
| `InMemoryBarberShopRepositoryTests.cs` | 7 |
| `InMemoryReportRepositoryTests.cs` | 4 (documentan que el reporte es 100% inventado y determinista por fecha — no está conectado a datos reales, ver plan §8) |
| `BarberRepositoryTests.cs` (preexistente) | 1 |

## 5. Fase 4 — `Barber.Flow.Api.Tests` (integración) — ✅ 29 tests

- `ApiWebApplicationFactory.cs`: `WebApplicationFactory<Program>` con `Features:UseMongoDb=false` y `Features:UseRealEmail=false` forzados vía configuración en memoria — los tests nunca tocan Mongo real ni SMTP real. Requirió agregar `public partial class Program { }` al final de `Program.cs` (las top-level statements generan una clase `Program` interna; `WebApplicationFactory<Program>` necesita poder referenciarla desde el proyecto de test).
- `AuthApiTests.cs` (3), `UsersApiTests.cs` (3), `ClientsApiTests.cs` (4), `AppointmentsApiTests.cs` (3), `BarberShopsApiTests.cs` (3), `BarbersApiTests.cs` (3): 401 sin token, 403 para no-admin en `BarbersApi`, 404 en ids inexistentes, happy path con JWT real obtenido vía `/api/users/authentication`.
- `BarberRequestValidatorTests.cs` (10): valida `BarberRequestValidator` (FluentValidation) directamente, sin HTTP — formato de teléfono, email, rango de comisión.

## 6. Fase 5 — CI — ✅

Hallazgo importante: el archivo que se pensaba arreglar (`barber-flow-api/Barber.Flow.Api/.github/workflows/api-ci.yml`) **no lo usa GitHub Actions** — solo lee `.github/workflows/` en la raíz del repo. Los workflows reales son:

- **`.github/workflows/ci-cd.yml`** (el que corre en cada push/PR a `main`/`develop`): el job `backend` tenía dos bugs reales:
  1. El step de test apuntaba a `barber-flow-api/tests/`, una ruta que **no existe** (la real es `barber-flow-api/Barber.Flow.Api/tests/`).
  2. El step de build solo compilaba `Barber.Flow.Api.csproj`, no los proyectos de test — así que aunque la ruta hubiera sido correcta, `--no-build` habría fallado porque los `.Tests.dll` nunca se generaron.

  **Corregido**: restore/build/test ahora apuntan al `.slnx` completo (`barber-flow-api/Barber.Flow.Api/Barber.Flow.Api.slnx`), que ya incluye los 4 proyectos de test. Verificado localmente en `Release` config con `--no-build`, replicando exactamente el flujo de CI: **144/144 tests pasan**.
- **`.github/workflows/dotnet-develop-api.yml`** (deploy a Railway): tenía `dotnet-version: '8.0.x'` mientras todos los proyectos targetean `net9.0` — corregido a `'9.0.x'`. Este workflow no corre tests, solo build + deploy.

**No se tocó** (fuera de alcance de este plan, solo se deja documentado para quien decida atenderlo):
- El archivo `barber-flow-api/Barber.Flow.Api/.github/workflows/api-ci.yml` quedó como código muerto — GitHub Actions nunca lo ejecuta porque no está en la raíz del repo. Vale la pena decidir si se elimina o se mueve.
- Existen **dos workflows de deploy en paralelo** (`ci-cd.yml` con un job `deploy` que hace SSH + `docker-compose` a un host propio, y `dotnet-develop-api.yml` que despliega a Railway vía CLI), ambos disparados por push a `main`/`develop`. No quedó claro si ambos siguen vigentes o uno es remanente de una migración de infraestructura — vale la pena confirmarlo para evitar despliegues duplicados.

## 7. El bloqueo de entorno (WDAC) — resuelto

En la sesión anterior, reconstruir `Barber.Flow.Infrastructure.Tests` (el proyecto que usa Mongo2Go) se bloqueaba localmente con *"An Application Control policy has blocked this file"* — confirmado como una política de Windows Defender Application Control de esa máquina, no un problema de código. El usuario confirmó que en su entorno los tests corren sin problema. Sin acción adicional pendiente sobre esto.

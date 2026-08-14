# MongoDB Integration — Barber Flow API

> **Audiencia:** Cualquier desarrollador que entre al proyecto por primera vez y necesite entender cómo funciona la base de datos, cómo se conecta, y cómo agregar nuevas colecciones.

---

## Tabla de contenidos

1. [Contexto y decisiones de diseño](#1-contexto-y-decisiones-de-diseño)
2. [Arquitectura general del backend](#2-arquitectura-general-del-backend)
3. [Feature flag — activar/desactivar MongoDB](#3-feature-flag--activardesactivar-mongodb)
4. [Archivos creados y modificados](#4-archivos-creados-y-modificados)
5. [Cómo funciona cada pieza](#5-cómo-funciona-cada-pieza)
   - 5.1 [MongoDbSettings.cs](#51-mongodbsettingscs)
   - 5.2 [FeatureFlags.cs](#52-featureflagscs)
   - 5.3 [MongoDbBootstrapper.cs](#53-mongodbbootstrappercs)
   - 5.4 [MongoDbClientRepository.cs](#54-mongodbclientrepositorycs)
   - 5.5 [ApplicationExtensions.cs](#55-applicationextensionscs)
6. [Configuración por ambiente](#6-configuración-por-ambiente)
7. [Despliegue en Railway](#7-despliegue-en-railway)
8. [Repositorios que aún usan InMemory](#8-repositorios-que-aún-usan-inmemory)
9. [Cómo agregar MongoDB a otro repositorio](#9-cómo-agregar-mongodb-a-otro-repositorio)
10. [Decisiones técnicas importantes](#10-decisiones-técnicas-importantes)
11. [Diagrama de flujo de la conexión](#11-diagrama-de-flujo-de-la-conexión)

---

## 1. Contexto y decisiones de diseño

### ¿Por qué MongoDB?

Barber Flow usa MongoDB Atlas (cloud) como base de datos principal. Se eligió MongoDB por:
- Esquema flexible: los datos de un barbero pueden variar (tiene shop, no tiene shop, etc.)
- Atlas ofrece free tier en cloud con replicación incluida
- Railway (donde está el backend) tiene un plugin nativo de MongoDB Atlas

### Clean Architecture — la regla más importante

El proyecto sigue **Clean Architecture** con estas 4 capas:

```
Barber.Flow.Api           → Controladores, DTOs, configuración HTTP
Barber.Flow.Application   → Servicios de negocio (orquestación)
Barber.Flow.Domain        → Entidades puras, interfaces de repositorio
Barber.Flow.Infrastructure → Implementaciones concretas (InMemory, MongoDB)
```

**Regla de oro:** El `Domain` no sabe que existe MongoDB. Las entidades (`Client`, `Barber`, etc.) son clases C# simples, sin atributos de MongoDB como `[BsonId]`. Toda la configuración de MongoDB vive en `Infrastructure`.

### ¿Por qué no Entity Framework?

MongoDB no es relacional. EF no tiene soporte real para MongoDB. Se usa el driver oficial `MongoDB.Driver` directamente, lo que da control total sobre queries, índices y serialización.

---

## 2. Arquitectura general del backend

```
┌─────────────────────────────────────────────────┐
│                   HTTP Request                  │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│        Barber.Flow.Api (Controllers / APIs)     │
│  AppointmentsApi, ClientsApi, BarbersApi, etc.  │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│       Barber.Flow.Application (Services)        │
│  ClientService, AppointmentService, etc.        │
│  Llama a IClientRepository (interfaz)           │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│  Barber.Flow.Domain (Interfaces + Entidades)    │
│  IClientRepository, Client, Barber, etc.        │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│    Barber.Flow.Infrastructure (Implementaciones)│
│  MongoDbClientRepository  InMemoryClientRepository│
│  MongoDbBootstrapper      InMemoryBarberRepository│
│  MongoDbSettings          FeatureFlags           │
└─────────────────────────────────────────────────┘
```

El servicio de aplicación (`ClientService`) siempre llama a la interfaz `IClientRepository`. Nunca sabe si detrás hay MongoDB o InMemory. El contenedor de dependencias (DI) decide cuál implementación inyectar en base al feature flag.

---

## 3. Feature flag — activar/desactivar MongoDB

El sistema tiene un interruptor en `appsettings.json`:

```json
"Features": {
  "UseMongoDb": false
}
```

- `false` → todo funciona en memoria (sin necesidad de MongoDB, ideal para desarrollo local rápido)
- `true` → se conecta a MongoDB para la colección `clients`

**Para activarlo localmente:**
1. Cambiar `"UseMongoDb": true` en `appsettings.Development.json`
2. Asegurarse de tener MongoDB corriendo (local, Docker, o Atlas)
3. Configurar el `ConnectionString` apropiado

**Para activarlo en Railway (producción):**
1. Agregar variable de entorno `Features__UseMongoDb=true` en el servicio de Railway
2. La variable `MONGODB_URI` la inyecta automáticamente el plugin de MongoDB Atlas

> **Nota sobre la sintaxis de variables de entorno en .NET:** Las variables de entorno usan `__` (doble guión bajo) como separador de secciones. Entonces `Features:UseMongoDb` en JSON se convierte en `Features__UseMongoDb` en variables de entorno.

---

## 4. Archivos creados y modificados

### Archivos nuevos

| Archivo | Capa | Propósito |
|---|---|---|
| `Barber.Flow.Infrastructure/Settings/MongoDbSettings.cs` | Infrastructure | Settings tipadas para la conexión |
| `Barber.Flow.Infrastructure/Settings/FeatureFlags.cs` | Infrastructure | Feature flag tipado |
| `Barber.Flow.Infrastructure/Services/MongoDb/MongoDbBootstrapper.cs` | Infrastructure | Inicialización de MongoDB al arrancar la app |
| `Barber.Flow.Infrastructure/Services/MongoDb/MongoDbClientRepository.cs` | Infrastructure | Implementación MongoDB de IClientRepository |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `Barber.Flow.Api/Extensions/ApplicationExtensions.cs` | Registro condicional de DI según feature flag |
| `Barber.Flow.Api/appsettings.json` | Secciones `Features` y `MongoDb` agregadas |
| `Barber.Flow.Api/appsettings.Development.json` | ConnectionString para desarrollo local |
| `Barber.Flow.Api/appsettings.Production.json` | DatabaseName para producción |
| `Barber.Flow.Infrastructure/Barber.Flow.Infrastructure.csproj` | NuGet `MongoDB.Driver 3.8.1` agregado |

---

## 5. Cómo funciona cada pieza

### 5.1 MongoDbSettings.cs

**Ubicación:** `Barber.Flow.Infrastructure/Settings/MongoDbSettings.cs`

```csharp
public sealed record MongoDbSettings
{
    public string ConnectionString { get; init; } = "mongodb://localhost:27017";
    public string DatabaseName { get; init; } = "barber_flow";
}
```

**¿Qué hace?**
Es un record inmutable (no se puede cambiar después de crearse) que mapea la sección `MongoDb` del archivo `appsettings.json`. Se usa en `ApplicationExtensions.cs` para leer la configuración y conectar a MongoDB.

- `ConnectionString`: la URL de conexión a MongoDB. En producción, Railway la sobreescribe con la variable de entorno `MONGODB_URI`.
- `DatabaseName`: el nombre de la base de datos. En este proyecto es `barber_flow`.

**¿Por qué `sealed record`?** `record` porque es un tipo de datos inmutable de configuración. `sealed` porque no necesita herencia.

---

### 5.2 FeatureFlags.cs

**Ubicación:** `Barber.Flow.Infrastructure/Settings/FeatureFlags.cs`

```csharp
public sealed record FeatureFlags
{
    public bool UseMongoDb { get; init; } = false;
}
```

**¿Qué hace?**
Mapea la sección `Features` de `appsettings.json`. El valor por defecto es `false`, lo que significa que si no se configura nada, la app usa repositorios en memoria.

---

### 5.3 MongoDbBootstrapper.cs

**Ubicación:** `Barber.Flow.Infrastructure/Services/MongoDb/MongoDbBootstrapper.cs`

**¿Qué hace?**
Es un servicio que se ejecuta automáticamente **cuando la aplicación arranca**, antes de procesar cualquier request. Hace dos cosas:

1. **Registra los `BsonClassMap`** — le dice al driver de MongoDB cómo serializar/deserializar cada entidad del dominio.
2. **Crea los índices** de MongoDB si no existen todavía.

**¿Por qué existe este archivo y no se hace directo en las entidades?**

En MongoDB.Driver, la forma de mapear clases es agregar atributos como `[BsonId]` directamente en la clase. Pero eso violaría Clean Architecture porque las entidades del dominio estarían acopladas a MongoDB. La solución es usar `BsonClassMap.RegisterClassMap<T>()`, que registra el mapeo de forma externa, desde Infrastructure, sin tocar el dominio.

**Implementa `IHostedService`:**
```csharp
public sealed class MongoDbBootstrapper : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        RegisterClassMaps();
        await EnsureIndexesAsync(cancellationToken);
    }
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
```

`IHostedService` es la interfaz de .NET para servicios que corren al iniciar la aplicación. Se registra en DI con `services.AddHostedService<MongoDbBootstrapper>()`.

**RegisterClassMaps — detalle de cada entidad:**

```csharp
// Client — mapeo automático, ignora campos extra en MongoDB que no existan en la clase
BsonClassMap.RegisterClassMap<Client>(cm =>
{
    cm.AutoMap();
    cm.SetIgnoreExtraElements(true);
});

// User — tiene Id de tipo Guid, que necesita serialización especial
BsonClassMap.RegisterClassMap<User>(cm =>
{
    cm.AutoMap();
    cm.SetIgnoreExtraElements(true);
    cm.MapIdMember(u => u.Id)
      .SetSerializer(new GuidSerializer(GuidRepresentation.Standard));
});
```

> **Importante — `Guid` en MongoDB:** MongoDB almacena GUIDs de forma diferente a .NET por defecto. `GuidSerializer(GuidRepresentation.Standard)` hace que el GUID se guarde como string UUID estándar, que es legible y compatible con otras herramientas.

> **El problema del namespace `Barber`:** La entidad `Barber.Flow.Domain.Entities.Barber` tiene el mismo nombre que el namespace raíz `Barber`. El compilador se confunde. La solución fue un alias:
> ```csharp
> using BarberEntity = Barber.Flow.Domain.Entities.Barber;
> ```
> Y luego usar `BarberEntity` en lugar de `Barber` dentro del archivo.

**Guarda de duplicados:**
```csharp
if (!BsonClassMap.IsClassMapRegistered(typeof(Client)))
    BsonClassMap.RegisterClassMap<Client>(...);
```
Si por alguna razón el bootstrapper se ejecuta dos veces (p.ej. en tests), no falla con una excepción de "ya está registrado".

**EnsureIndexesAsync — índices de la colección `clients`:**

```csharp
// Índice por barbero dueño del cliente (cada barbero solo ve sus clientes)
new CreateIndexModel<Client>(
    Builders<Client>.IndexKeys.Ascending(c => c.CreatedBy),
    new CreateIndexOptions { Name = "idx_clients_createdBy" })

// Índice compuesto para búsqueda por teléfono + barbero
new CreateIndexModel<Client>(
    Builders<Client>.IndexKeys
        .Ascending(c => c.Phone)
        .Ascending(c => c.CreatedBy),
    new CreateIndexOptions { Name = "idx_clients_phone_createdBy" })
```

`CreateManyAsync` es idempotente: si el índice ya existe con el mismo nombre, MongoDB lo ignora silenciosamente. No hay que verificar manualmente.

---

### 5.4 MongoDbClientRepository.cs

**Ubicación:** `Barber.Flow.Infrastructure/Services/MongoDb/MongoDbClientRepository.cs`

**¿Qué hace?**
Implementa la interfaz `IClientRepository` usando MongoDB como persistencia. Cada método mapea directamente a una operación CRUD en la colección `clients`.

**Constructor:**
```csharp
public MongoDbClientRepository(IMongoDatabase database)
{
    _collection = database.GetCollection<Client>("clients");
}
```
Recibe el `IMongoDatabase` por DI. Lo correcto es inyectar la base de datos ya configurada, no crear un `MongoClient` nuevo aquí (eso generaría múltiples conexiones).

**Método por método:**

#### CreateAsync
```csharp
public async Task<Client> CreateAsync(Client client, CancellationToken cancellation = default)
{
    await _collection.InsertOneAsync(client, cancellationToken: cancellation);
    return client;
}
```
Inserta el documento. MongoDB asigna `_id` automáticamente usando el campo `Id` de la entidad (que ya tiene un GUID generado). Retorna el mismo objeto porque no cambia nada.

#### GetByIdAsync
```csharp
public async Task<Client?> GetByIdAsync(string id, CancellationToken cancellation = default)
{
    return await _collection
        .Find(Builders<Client>.Filter.Eq(c => c.Id, id))
        .FirstOrDefaultAsync(cancellation);
}
```
Busca por el campo `Id` (string). Retorna `null` si no existe (`FirstOrDefaultAsync`).

#### UpdateAsync
```csharp
public async Task<Client?> UpdateAsync(string id, Client client, CancellationToken cancellation = default)
{
    var update = Builders<Client>.Update
        .Set(c => c.FirstName, client.FirstName)
        // ... todos los campos editables
        .Set(c => c.UpdatedAt, DateTime.UtcNow);

    return await _collection.FindOneAndUpdateAsync(
        Builders<Client>.Filter.Eq(c => c.Id, id),
        update,
        new FindOneAndUpdateOptions<Client> { ReturnDocument = ReturnDocument.After },
        cancellation);
}
```
Usa `$set` para actualizar solo los campos especificados, **sin tocar `CreatedAt` ni `CreatedBy`**. `ReturnDocument.After` devuelve el documento ya actualizado (no el anterior). Retorna `null` si el `id` no existe.

> **¿Por qué `$set` y no reemplazar el documento completo?** Si se reemplazara el documento entero, se perdería el `_id` interno de MongoDB. `$set` es más seguro y eficiente.

#### DeleteAsync
```csharp
public async Task<bool> DeleteAsync(string id, CancellationToken cancellation = default)
{
    var result = await _collection.DeleteOneAsync(
        Builders<Client>.Filter.Eq(c => c.Id, id), cancellation);
    return result.DeletedCount > 0;
}
```
Retorna `true` si se eliminó algo, `false` si el `id` no existía. Esto mantiene el mismo contrato que `InMemoryClientRepository`.

#### FindAsync — búsqueda con texto y paginación

```csharp
public async Task<IEnumerable<Client>> FindAsync(
    string? query = null,
    int? page = null,
    int? pageSize = null,
    CancellationToken cancellation = default)
{
    var filter = BuildSearchFilter(query);
    var findCursor = _collection
        .Find(filter)
        .SortByDescending(c => c.CreatedAt);  // Más recientes primero

    if (page.HasValue && pageSize.HasValue)
        return await findCursor
            .Skip((page.Value - 1) * pageSize.Value)
            .Limit(pageSize.Value)
            .ToListAsync(cancellation);

    return await findCursor.ToListAsync(cancellation);
}
```

La paginación solo se aplica si **ambos** `page` y `pageSize` están presentes, igualando el comportamiento del repositorio InMemory.

> **Detalle técnico — por qué dos paths:** Llamar `.Skip().Limit()` sobre un `IOrderedFindFluent<T>` devuelve `IFindFluent<T>`, que es un tipo diferente. Intentar asignarlo de vuelta a una variable `IOrderedFindFluent<T>` genera un error de compilación. La solución es tener dos ramas que llaman `.ToListAsync()` directamente.

**BuildSearchFilter — búsqueda con regex:**

```csharp
private static FilterDefinition<Client> BuildSearchFilter(string? query)
{
    if (string.IsNullOrWhiteSpace(query))
        return Builders<Client>.Filter.Empty;

    var regex = new BsonRegularExpression(Regex.Escape(query.Trim()), "i");

    return Builders<Client>.Filter.Or(
        Builders<Client>.Filter.Regex(c => c.FirstName, regex),
        Builders<Client>.Filter.Regex(c => c.LastName, regex),
        Builders<Client>.Filter.Regex(c => c.Phone, regex));
}
```

- Busca en `FirstName`, `LastName` y `Phone` al mismo tiempo (OR)
- El flag `"i"` hace la búsqueda **case-insensitive** (no importa mayúsculas/minúsculas)
- `Regex.Escape()` **previene regex injection**: si el usuario escribe `.*` o `(abc)`, se trata como texto literal, no como expresión regular

---

### 5.5 ApplicationExtensions.cs

**Ubicación:** `Barber.Flow.Api/Extensions/ApplicationExtensions.cs`

Este es el archivo de configuración del contenedor de dependencias (DI). Aquí se decide qué implementación de repositorio se registra.

**Bloque relevante:**

```csharp
// Bind settings — siempre, independientemente del feature flag
services.Configure<FeatureFlags>(configuration.GetSection("Features"));
services.Configure<MongoDbSettings>(configuration.GetSection("MongoDb"));

var useMongoDb = configuration.GetValue<bool>("Features:UseMongoDb");

if (useMongoDb)
{
    var mongoSettings = configuration.GetSection("MongoDb").Get<MongoDbSettings>()
        ?? throw new InvalidOperationException("MongoDb settings son requeridos cuando UseMongoDb es true.");

    // Railway inyecta MONGODB_URI automáticamente con el plugin de Atlas
    // Si no está, se usa el ConnectionString del config
    var mongoConnectionString = Environment.GetEnvironmentVariable("MONGODB_URI")
        ?? mongoSettings.ConnectionString;

    // IMongoClient se registra como Singleton porque MongoDB.Driver maneja el pool internamente
    // Registrar múltiples instancias de MongoClient es un bug conocido
    services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoConnectionString));
    services.AddSingleton<IMongoDatabase>(sp =>
        sp.GetRequiredService<IMongoClient>().GetDatabase(mongoSettings.DatabaseName));

    services.AddHostedService<MongoDbBootstrapper>();
    services.AddSingleton<IClientRepository, MongoDbClientRepository>();
}
else
{
    services.AddSingleton<IClientRepository, InMemoryClientRepository>();
}

// Los demás repositorios siempre usan InMemory (todavía no implementados para MongoDB)
services.AddSingleton<IBarberRepository, InMemoryBarberRepository>();
services.AddSingleton<IUserRepository, InMemoryUserRepository>();
services.AddSingleton<IReportRepository, InMemoryReportRepository>();
services.AddSingleton<IAppointmentRepository, InMemoryAppointmentRepository>();
```

> **¿Por qué `AddSingleton` para `IMongoClient`?**
> MongoDB.Driver gestiona internamente un pool de conexiones. Si se crean múltiples instancias de `MongoClient` (por ejemplo con `AddScoped`), cada request abriría su propio pool, agotando las conexiones disponibles. `Singleton` garantiza una sola instancia durante toda la vida de la aplicación.

---

## 6. Configuración por ambiente

### appsettings.json (base — valores por defecto)
```json
{
  "Features": { "UseMongoDb": false },
  "MongoDb": {
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "barber_flow"
  }
}
```

### appsettings.Development.json (local)
```json
{
  "MongoDb": { "ConnectionString": "mongodb://localhost:27017" }
}
```
Para desarrollo local con MongoDB en `localhost`.

### appsettings.Production.json (Railway)
```json
{
  "MongoDb": { "DatabaseName": "barber_flow" }
}
```
El `ConnectionString` viene de la variable de entorno `MONGODB_URI` que inyecta Railway. No se hardcodea aquí.

### Variables de entorno en Railway
| Variable | Valor | ¿Quién la pone? |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://...` (Atlas) | Plugin de MongoDB Atlas de Railway, automático |
| `Features__UseMongoDb` | `true` | Tú, manualmente en el dashboard de Railway |

---

## 7. Despliegue en Railway

El backend está hosteado en Railway en:
```
https://barberflowapp-develop.up.railway.app
```

**Para habilitar MongoDB en producción:**

1. En el dashboard de Railway → tu servicio → pestaña "Variables"
2. Agregar: `Features__UseMongoDb` = `true`
3. Verificar que el plugin de **MongoDB Atlas** esté instalado en el proyecto de Railway (genera `MONGODB_URI` automáticamente)
4. Hacer redeploy del servicio

**¿Por qué `MONGODB_URI` y no `MongoDb__ConnectionString`?**
El plugin de MongoDB Atlas de Railway inyecta específicamente la variable `MONGODB_URI`. El código en `ApplicationExtensions.cs` la lee primero con `Environment.GetEnvironmentVariable("MONGODB_URI")` y solo si no existe cae al config.

---

## 8. Repositorios que aún usan InMemory

Actualmente solo `IClientRepository` tiene implementación MongoDB. Los demás siguen siendo InMemory:

| Repositorio | Estado | Implementación actual |
|---|---|---|
| `IClientRepository` | ✅ MongoDB listo | `MongoDbClientRepository` |
| `IBarberRepository` | 🔲 Pendiente | `InMemoryBarberRepository` |
| `IUserRepository` | 🔲 Pendiente | `InMemoryUserRepository` |
| `IAppointmentRepository` | 🔲 Pendiente | `InMemoryAppointmentRepository` |
| `IReportRepository` | 🔲 Pendiente | `InMemoryReportRepository` |

**Consecuencia importante:** Con `UseMongoDb: true`, los clientes se guardan en MongoDB (persisten entre reinicios), pero las citas, barberos y usuarios se pierden al reiniciar el servidor porque están en memoria.

---

## 9. Cómo agregar MongoDB a otro repositorio

> **Ejemplo completo:** A continuación se muestra cómo implementar `MongoDbAppointmentRepository` desde cero. Este es el repositorio más complejo porque tiene filtros combinados, paginación, una operación de "mover" y generación de IDs secuenciales en MongoDB. Sirve como referencia para cualquier otro repositorio futuro.

---

### Resumen de los pasos

| # | Qué hacer | Archivo |
|---|---|---|
| 1 | Crear el repositorio MongoDB | `Infrastructure/Services/MongoDb/MongoDbAppointmentRepository.cs` *(nuevo)* |
| 2 | Verificar el BsonClassMap | `Infrastructure/Services/MongoDb/MongoDbBootstrapper.cs` |
| 3 | Agregar índices | `Infrastructure/Services/MongoDb/MongoDbBootstrapper.cs` |
| 4 | Registrar en DI | `Api/Extensions/ApplicationExtensions.cs` |
| 5 | Compilar y verificar | Terminal |

---

### Paso 1 — Crear el repositorio

Crea el archivo `Barber.Flow.Infrastructure/Services/MongoDb/MongoDbAppointmentRepository.cs`.

Este repositorio implementa la interfaz `IAppointmentRepository` que vive en el dominio. Los métodos que tiene que implementar son:

| Método | Descripción |
|---|---|
| `CreateAsync` | Inserta una cita nueva |
| `GetByIdAsync` | Busca por `Id` (formato `APT-0000`) |
| `UpdateAsync` | Actualiza todos los campos editables con `$set` |
| `DeleteAsync` | Elimina y devuelve `true`/`false` |
| `FindAsync` | Búsqueda con filtros: fecha/rango, estado, texto, paginación |
| `MoveAsync` | Solo cambia el campo `Date` de una cita |
| `GetNextIdAsync` | Genera el próximo ID secuencial (`APT-0001`, `APT-0002`, ...) |

#### Código completo

```csharp
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace Barber.Flow.Infrastructure.Services.MongoDb;

public sealed class MongoDbAppointmentRepository : IAppointmentRepository
{
    private readonly IMongoCollection<Appointments> _collection;
    private readonly IMongoDatabase _database; // necesario para GetNextIdAsync

    public MongoDbAppointmentRepository(IMongoDatabase database)
    {
        _database = database;
        _collection = database.GetCollection<Appointments>("appointments");
    }

    // ─────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────

    public async Task<Appointments> CreateAsync(Appointments appointment, CancellationToken cancellation = default)
    {
        appointment.CreatedAt = DateTime.UtcNow;
        appointment.UpdatedAt = appointment.CreatedAt;
        await _collection.InsertOneAsync(appointment, cancellationToken: cancellation);
        return appointment;
    }

    // ─────────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────────

    public async Task<Appointments?> GetByIdAsync(string id, CancellationToken cancellation = default)
    {
        return await _collection
            .Find(Builders<Appointments>.Filter.Eq(a => a.Id, id))
            .FirstOrDefaultAsync(cancellation);
    }

    // ─────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────

    public async Task<Appointments?> UpdateAsync(string id, Appointments appointment, CancellationToken cancellation = default)
    {
        // Solo se actualizan los campos editables.
        // CreatedAt y CreatedBy nunca se tocan.
        var update = Builders<Appointments>.Update
            .Set(a => a.ClientName,        appointment.ClientName)
            .Set(a => a.Phone,             appointment.Phone)
            .Set(a => a.Date,              appointment.Date)
            .Set(a => a.Time,              appointment.Time)
            .Set(a => a.Status,            appointment.Status)
            .Set(a => a.CompletedAt,       appointment.CompletedAt)
            .Set(a => a.PaymentMethodUsed, appointment.PaymentMethodUsed)
            .Set(a => a.ServiceName,       appointment.ServiceName)
            .Set(a => a.ServicePrice,      appointment.ServicePrice)
            .Set(a => a.Notes,             appointment.Notes)
            .Set(a => a.UpdatedBy,         appointment.UpdatedBy)
            .Set(a => a.UpdatedAt,         DateTime.UtcNow);

        return await _collection.FindOneAndUpdateAsync(
            Builders<Appointments>.Filter.Eq(a => a.Id, id),
            update,
            new FindOneAndUpdateOptions<Appointments> { ReturnDocument = ReturnDocument.After },
            cancellation);
    }

    // ─────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellation = default)
    {
        var result = await _collection.DeleteOneAsync(
            Builders<Appointments>.Filter.Eq(a => a.Id, id),
            cancellation);
        return result.DeletedCount > 0;
    }

    // ─────────────────────────────────────────────
    // FIND — búsqueda con filtros combinados
    // ─────────────────────────────────────────────

    public async Task<IEnumerable<Appointments>> FindAsync(
        string? date     = null,
        string? endDate  = null,
        string? status   = null,
        string? query    = null,
        int?    page     = null,
        int?    pageSize = null,
        CancellationToken cancellation = default)
    {
        var filter = BuildFilter(date, endDate, status, query);

        var cursor = _collection
            .Find(filter)
            .SortBy(a => a.Date)      // Más próximas primero
            .ThenBy(a => a.Time);

        var ps = pageSize ?? 50;
        var pg = (page ?? 1) - 1;

        return await cursor
            .Skip(pg * ps)
            .Limit(ps)
            .ToListAsync(cancellation);
    }

    private static FilterDefinition<Appointments> BuildFilter(
        string? date, string? endDate, string? status, string? query)
    {
        // Se acumulan todos los filtros en una lista y se combinan con AND al final
        var filters = new List<FilterDefinition<Appointments>>();

        // ── Filtro por fecha ──────────────────────────────────────────────────
        // Date se guarda como string "yyyy-MM-dd". La comparación lexicográfica
        // funciona correctamente porque el formato ISO 8601 ordena igual que las fechas.
        if (!string.IsNullOrWhiteSpace(date))
        {
            var start = date.Trim();
            if (!string.IsNullOrWhiteSpace(endDate))
            {
                var end = endDate.Trim();
                filters.Add(Builders<Appointments>.Filter.Gte(a => a.Date, start));
                filters.Add(Builders<Appointments>.Filter.Lte(a => a.Date, end));
            }
            else
            {
                filters.Add(Builders<Appointments>.Filter.Eq(a => a.Date, start));
            }
        }

        // ── Filtro por estado ─────────────────────────────────────────────────
        // Los valores posibles son: scheduled | confirmed | completed | cancelled
        if (!string.IsNullOrWhiteSpace(status))
        {
            var statusRegex = new BsonRegularExpression($"^{Regex.Escape(status.Trim())}$", "i");
            filters.Add(Builders<Appointments>.Filter.Regex(a => a.Status, statusRegex));
        }

        // ── Filtro por texto (nombre o teléfono) ──────────────────────────────
        if (!string.IsNullOrWhiteSpace(query))
        {
            // Regex.Escape previene regex injection (p.ej. si el usuario escribe "(.*)")
            var textRegex = new BsonRegularExpression(Regex.Escape(query.Trim()), "i");
            filters.Add(Builders<Appointments>.Filter.Or(
                Builders<Appointments>.Filter.Regex(a => a.ClientName, textRegex),
                Builders<Appointments>.Filter.Regex(a => a.Phone,      textRegex)));
        }

        // Si no hay filtros activos, traer todo
        return filters.Count > 0
            ? Builders<Appointments>.Filter.And(filters)
            : Builders<Appointments>.Filter.Empty;
    }

    // ─────────────────────────────────────────────
    // MOVE — solo cambia la fecha
    // ─────────────────────────────────────────────

    public async Task<Appointments?> MoveAsync(string id, string newDate, CancellationToken cancellation = default)
    {
        var update = Builders<Appointments>.Update
            .Set(a => a.Date,      newDate)
            .Set(a => a.UpdatedAt, DateTime.UtcNow);

        return await _collection.FindOneAndUpdateAsync(
            Builders<Appointments>.Filter.Eq(a => a.Id, id),
            update,
            new FindOneAndUpdateOptions<Appointments> { ReturnDocument = ReturnDocument.After },
            cancellation);
    }

    // ─────────────────────────────────────────────
    // GET NEXT ID — generación atómica de IDs secuenciales
    // ─────────────────────────────────────────────

    public async Task<string> GetNextIdAsync(CancellationToken cancellation = default)
    {
        // Se usa una colección "counters" con el patrón estándar de MongoDB para IDs atómicos.
        // findOneAndUpdate con $inc garantiza que dos requests simultáneas nunca obtengan el mismo número.
        var counters = _database.GetCollection<BsonDocument>("counters");

        var result = await counters.FindOneAndUpdateAsync(
            Builders<BsonDocument>.Filter.Eq("_id", "appointments"),
            Builders<BsonDocument>.Update.Inc("seq", 1),
            new FindOneAndUpdateOptions<BsonDocument>
            {
                IsUpsert       = true,              // Crea el documento si no existe
                ReturnDocument = ReturnDocument.After
            },
            cancellation);

        var seq = result["seq"].AsInt32;
        return $"APT-{seq.ToString().PadLeft(4, '0')}";
    }
}
```

> **¿Por qué una colección `counters`?**
> En la versión InMemory el ID se genera con un contador en memoria (`Interlocked.Increment`). En MongoDB, si dos requests simultáneas llegaran al mismo tiempo y ambas leyeran el último ID para incrementarlo, generarían el mismo ID (race condition). La solución estándar de MongoDB es `findOneAndUpdate` con `$inc`, que es una operación atómica: MongoDB incrementa y devuelve el nuevo valor en una sola operación, sin posibilidad de colisión.

---

### Paso 2 — Verificar el BsonClassMap

Abre `Barber.Flow.Infrastructure/Services/MongoDb/MongoDbBootstrapper.cs`.

El `BsonClassMap` para `Appointments` **ya está registrado** en el método `RegisterClassMaps()`:

```csharp
if (!BsonClassMap.IsClassMapRegistered(typeof(Appointments)))
    BsonClassMap.RegisterClassMap<Appointments>(cm =>
    {
        cm.AutoMap();
        cm.SetIgnoreExtraElements(true);
    });
```

No hay que modificar nada aquí. Si fuera una entidad nueva que no estuviera registrada, habría que agregar un bloque similar.

> **¿Qué es `AutoMap()`?** Le dice al driver que mapee automáticamente cada propiedad C# a su campo MongoDB usando el mismo nombre. Es la forma más simple y directa. Solo se necesita configuración extra cuando hay tipos especiales como `Guid` (ver el registro de `User`).

---

### Paso 3 — Agregar índices

Abre `MongoDbBootstrapper.cs` y modifica el método `EnsureIndexesAsync`. Agrega los índices para la colección `appointments` al final del método.

**Antes:**
```csharp
private async Task EnsureIndexesAsync(CancellationToken cancellationToken)
{
    var clients = _database.GetCollection<Client>("clients");
    // ... índices de clients ...
    await clients.Indexes.CreateManyAsync(indexes, cancellationToken);
}
```

**Después — agrega este bloque al final del método:**
```csharp
    // ── Índices de appointments ──────────────────────────────────────────────
    var appointments = _database.GetCollection<Appointments>("appointments");

    var apptIndexes = new List<CreateIndexModel<Appointments>>
    {
        // El barbero solo ve sus citas
        new(
            Builders<Appointments>.IndexKeys.Ascending(a => a.CreatedBy),
            new CreateIndexOptions { Name = "idx_appointments_createdBy" }),

        // Búsqueda por fecha (el caso de uso más frecuente: "citas del día X")
        new(
            Builders<Appointments>.IndexKeys
                .Ascending(a => a.Date)
                .Ascending(a => a.CreatedBy),
            new CreateIndexOptions { Name = "idx_appointments_date_createdBy" }),

        // Filtro por estado (scheduled, confirmed, completed, cancelled)
        new(
            Builders<Appointments>.IndexKeys
                .Ascending(a => a.Status)
                .Ascending(a => a.CreatedBy),
            new CreateIndexOptions { Name = "idx_appointments_status_createdBy" }),
    };

    await appointments.Indexes.CreateManyAsync(apptIndexes, cancellationToken);
```

> **¿Por qué incluir `CreatedBy` en todos los índices?** Cada barbero solo tiene acceso a sus propias citas. Los queries siempre incluirán un filtro `CreatedBy = barberId`. Sin ese campo en el índice, MongoDB haría un collection scan completo aunque tenga un índice por `Date`. El índice compuesto `(Date, CreatedBy)` es mucho más eficiente.

---

### Paso 4 — Registrar en DI

Abre `Barber.Flow.Api/Extensions/ApplicationExtensions.cs`.

En el bloque `if (useMongoDb)`, reemplaza la línea del `InMemoryAppointmentRepository`:

**Antes:**
```csharp
services.AddSingleton<IAppointmentRepository, InMemoryAppointmentRepository>();
```

**Después:**
```csharp
services.AddSingleton<IAppointmentRepository, MongoDbAppointmentRepository>();
```

> La línea está fuera del bloque `if (useMongoDb)`. Hay que moverla dentro del bloque o reemplazarla condicionalmente. El patrón es el mismo que se usó con `IClientRepository`:
>
> ```csharp
> if (useMongoDb)
> {
>     // ... MongoClient, IMongoDatabase, Bootstrapper, IClientRepository ...
>     services.AddSingleton<IAppointmentRepository, MongoDbAppointmentRepository>();
> }
> else
> {
>     services.AddSingleton<IClientRepository, InMemoryClientRepository>();
>     services.AddSingleton<IAppointmentRepository, InMemoryAppointmentRepository>();
> }
> ```

---

### Paso 5 — Compilar y verificar

Desde la raíz del proyecto backend:

```bash
dotnet build
```

Debe terminar con **0 errors**. Si hay errores:

| Error común | Causa | Solución |
|---|---|---|
| `CS0246: The type 'Appointments' could not be found` | Falta el `using` | Agregar `using Barber.Flow.Domain.Entities;` al tope del archivo |
| `CS0535: does not implement interface member '...'` | Falta algún método de `IAppointmentRepository` | Revisar la interfaz en `Domain/Interfaces/IAppointmentRepository.cs` y asegurarse de que todos los métodos estén implementados |
| `BsonSerializationException` en runtime | El ClassMap no está registrado para el tipo | Verificar el paso 2 |

---

### Checklist completo

- [ ] `MongoDbAppointmentRepository.cs` creado en `Infrastructure/Services/MongoDb/`
- [ ] Verifica que `Appointments` tenga `BsonClassMap` en `MongoDbBootstrapper.cs`
- [ ] Índices de `appointments` agregados en `EnsureIndexesAsync`
- [ ] `IAppointmentRepository` mapeado a `MongoDbAppointmentRepository` en `ApplicationExtensions.cs`
- [ ] `dotnet build` → 0 errors
- [ ] Probar con `UseMongoDb: true` localmente que las citas persisten entre reinicios

---

## 10. Decisiones técnicas importantes

### ¿Por qué no usar atributos `[BsonId]` en las entidades?

Agregar atributos de MongoDB en las entidades del dominio las acopla a la infraestructura. Si en el futuro se cambia la base de datos (p.ej. a PostgreSQL), habría que tocar el dominio. Con `BsonClassMap` en Infrastructure, el dominio queda limpio.

### ¿Por qué `Singleton` para los repositorios MongoDB?

Los repositorios MongoDB son stateless (no guardan estado entre llamadas, solo tienen `_collection`). `IMongoCollection<T>` es thread-safe, por lo que es seguro usarla como Singleton.

### ¿Por qué no usar un ORM como MongoFramework?

MongoDB.Driver oficial da más control y es la herramienta estándar de la industria. Los ORMs para MongoDB suelen estar menos mantenidos y agregan abstracciones que complican el debugging.

### ¿Por qué `Regex.Escape()` en la búsqueda?

Sin `Regex.Escape()`, si un usuario busca `.` en el campo de teléfono, el regex interpretaría el punto como "cualquier carácter" y devolvería resultados incorrectos. Con escape, se trata como el carácter literal punto.

### ¿Por qué `SetIgnoreExtraElements(true)` en los ClassMaps?

Si en el futuro se agrega un campo nuevo a la entidad pero hay documentos viejos en MongoDB que no lo tienen (o viceversa), sin esta configuración el driver lanzaría una excepción al deserializar. Con `SetIgnoreExtraElements(true)`, MongoDB ignora los campos desconocidos silenciosamente.

---

## 11. Diagrama de flujo de la conexión

```
App arranca
     │
     ▼
ApplicationExtensions.AddApplicationServices()
     │
     ├── Lee Features:UseMongoDb
     │
     ├── Si TRUE:
     │   ├── Lee MONGODB_URI (env var Railway) o ConnectionString del config
     │   ├── Registra MongoClient (Singleton)
     │   ├── Registra IMongoDatabase (Singleton)
     │   ├── Registra MongoDbBootstrapper (IHostedService)
     │   └── Registra IClientRepository → MongoDbClientRepository (Singleton)
     │
     └── Si FALSE:
         └── Registra IClientRepository → InMemoryClientRepository (Singleton)

     │
     ▼
MongoDbBootstrapper.StartAsync() — solo si UseMongoDb=true
     ├── RegisterClassMaps() — mapea Client, Barber, Appointments, User a BSON
     └── EnsureIndexesAsync() — crea índices en la colección "clients"

     │
     ▼
Request llega al API
     │
     ▼
ClientsApi → ClientService → IClientRepository
                                    │
                    ┌───────────────┴──────────────────┐
                    ▼                                  ▼
        MongoDbClientRepository          InMemoryClientRepository
        (MongoDB Atlas / local)          (Lista en memoria RAM)
```

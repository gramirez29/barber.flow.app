# Auditoría de Performance y Seguridad — Barber.Flow.Api

> Fecha de auditoría: Mayo 2026  
> Estado: Pendiente de implementación

---

## Lo que ya está bien

| Práctica | Evidencia |
|---|---|
| `async/await` correcto en todos los endpoints, sin bloqueos (`.Result`, `.Wait()`) | `AppointmentsApi.cs`, `ClientsApi.cs`, `AuthApi.cs` |
| `CancellationToken` propagado en la mayoría de los flujos async | `MongoDbClientRepository.cs`, `AppointmentsApi.cs` |
| `IMongoClient` e `IMongoDatabase` registrados como `Singleton` (thread-safe, costosos de crear) | `ApplicationExtensions.cs` |
| Servicios de aplicación registrados como `Scoped` (aislamiento por request) | `ApplicationExtensions.cs` |
| Índices compuestos de MongoDB creados en startup vía `IHostedService` | `MongoDbBootstrapper.cs` |
| Paginación con `Skip/Limit` en todos los repositorios | `MongoDbClientRepository.cs`, `InMemoryAppointmentRepository.cs` |
| `Regex.Escape()` en búsquedas de texto (previene regex injection) | `MongoDbClientRepository.cs` |
| JWT con validación completa: issuer, audience, signing key, lifetime | `ApplicationExtensions.cs` |
| Variable de entorno `MONGODB_URI` para Railway (no hardcoded) | `ApplicationExtensions.cs` |

---

## Problemas críticos (seguridad)

### 1. Credenciales hardcodeadas

- **Archivo:** `Barber.Flow.Infrastructure/Services/JwtAuthService.cs`
- **Problema:** El usuario `admin` con contraseña `password` está definido directamente en el código. Si llega a producción, cualquiera puede autenticarse.
- **Fix:** Implementar lookup real contra la base de datos con passwords hasheados.

```csharp
// ❌ Actual
if ((userOrEmail == "admin" || userOrEmail == "admin@example.com") && password == "password")

// ✅ Correcto
var user = await _userRepository.GetByEmailAsync(userOrEmail);
if (user == null || !BCrypt.Verify(password, user.PasswordHash))
    return null;
```

---

### 2. Contraseñas en texto plano

- **Archivos:** `InMemoryUserRepository.cs`, `User.cs`
- **Problema:** Las contraseñas se almacenan y comparan como texto plano. Si la base de datos es comprometida, todas las contraseñas quedan expuestas.
- **Fix:** Usar BCrypt o PBKDF2 para hashear antes de guardar, y `Verify()` al comparar. Nunca almacenar ni loguear la contraseña original.

---

### 3. Sin middleware global de excepciones

- **Archivo:** `Program.cs`
- **Problema:** Las excepciones no controladas devuelven stack traces crudos al cliente (información interna expuesta) y no tienen un formato de error consistente.
- **Fix:**

```csharp
// En Program.cs, antes de app.UseRouting()
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { error = "An unexpected error occurred." });
    });
});
```

---

### 4. CORS con `AllowAnyOrigin`

- **Archivo:** `ApplicationExtensions.cs`
- **Problema:** La política de CORS acepta requests desde cualquier dominio. En producción esto es un riesgo de seguridad.
- **Fix:** Especificar los orígenes permitidos:

```csharp
// ❌ Actual
policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();

// ✅ Correcto
policy.WithOrigins(
    "https://tu-dominio-frontend.com",
    "http://localhost:8081"   // solo para dev
).AllowAnyHeader().AllowAnyMethod();
```

---

## Problemas de performance

### 5. Sin compresión gzip/brotli

- **Archivo:** `Program.cs`
- **Impacto:** Los JSON responses viajan sin comprimir. En respuestas de listas con muchos registros esto puede significar un 40-60% más de bytes transferidos.
- **Fix:**

```csharp
// En builder.Services (ApplicationExtensions.cs o Program.cs)
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

// En app (Program.cs, antes de UseRouting)
app.UseResponseCompression();
```

---

### 6. Sin proyección en queries de lista (MongoDB)

- **Archivo:** `MongoDbClientRepository.cs`
- **Problema:** `FindAsync` trae todos los campos del documento aunque el endpoint solo devuelva un subconjunto de propiedades. Para documentos grandes esto desperdicia ancho de banda entre MongoDB y la API.
- **Fix:** Usar `.Project<T>()` para traer solo los campos necesarios en endpoints de lista:

```csharp
return await _collection
    .Find(filter)
    .Project(Builders<Client>.Projection
        .Include(c => c.Id)
        .Include(c => c.FirstName)
        .Include(c => c.LastName)
        .Include(c => c.Phone)
        .Include(c => c.CreatedAt))
    .As<Client>()
    .ToListAsync(cancellation);
```

---

### 7. Parámetros de paginación sin validar

- **Archivos:** `AppointmentsApi.cs`, `ClientsApi.cs`, `BarbersApi.cs`
- **Problema:** Un request con `?pageSize=999999` forzaría traer cientos de miles de registros en una sola llamada.
- **Fix:** Validar al inicio del endpoint:

```csharp
if (page is < 1 || pageSize is < 1 or > 200)
    return TypedResults.BadRequest("page debe ser >= 1 y pageSize entre 1 y 200.");
```

---

### 8. Índice faltante para queries por fecha en `clients`

- **Archivo:** `MongoDbBootstrapper.cs`
- **Problema:** Si se ordena o filtra por `CreatedAt` en la colección `clients`, MongoDB hace un collection scan completo porque no existe índice en ese campo.
- **Fix:** Agregar en `EnsureIndexesAsync`:

```csharp
new(
    Builders<Client>.IndexKeys.Descending(c => c.CreatedAt),
    new CreateIndexOptions { Name = "idx_clients_createdAt" }),
```

---

### 9. Swagger habilitado en producción

- **Archivo:** `Program.cs`
- **Problema:** La documentación Swagger expone la estructura completa de la API (endpoints, modelos, parámetros) en producción. Es información útil para atacantes.
- **Fix:**

```csharp
// ❌ Actual (siempre activo)
app.UseSwagger();
app.UseSwaggerUI();

// ✅ Correcto
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
```

---

## Problemas menores

### 10. `CancellationToken` faltante en algunos endpoints

- **Archivos:** `ClientsApi.cs`, `BarbersApi.cs`
- **Problema:** Algunos `FindAsync` calls no pasan el `CancellationToken` del request HTTP, por lo que si el cliente cancela la llamada, el query en MongoDB continúa ejecutándose innecesariamente.
- **Fix:** Asegurarse de pasar `cancellationToken` en todos los calls async dentro de los endpoints.

---

### 11. Lógica de validación de admin duplicada

- **Archivo:** `BarbersApi.cs`
- **Problema:** La misma verificación `if (barberId == "admin")` aparece repetida en 3 endpoints distintos. Viola el principio DRY y es un riesgo de mantenimiento.
- **Fix:** Extraer a un método de extensión o a un filtro de endpoint reutilizable.

---

### 12. `UpdateAsync` no implementado en `InMemoryUserRepository`

- **Archivo:** `InMemoryUserRepository.cs`
- **Problema:** El método lanza `NotImplementedException`. Si se llama en algún flujo, crashea el proceso.
- **Fix:** Implementar o, si no aplica, devolver `Task.FromResult<User?>(null)` con un comentario claro.

---

## Prioridad de implementación

| Prioridad | Item | Esfuerzo |
|---|---|---|
| 🔴 Antes de ir a producción real | #1 Credenciales hardcodeadas | Alto |
| 🔴 Antes de ir a producción real | #2 Passwords en plaintext | Alto |
| 🔴 Antes de ir a producción real | #3 Exception middleware | Bajo |
| 🔴 Antes de ir a producción real | #4 CORS restrictivo | Bajo |
| 🟠 Performance | #5 Compresión gzip | Bajo |
| 🟠 Performance | #7 Validar paginación | Bajo |
| 🟠 Performance | #9 Swagger solo en dev | Muy bajo |
| 🟡 Deuda técnica | #6 Proyecciones MongoDB | Medio |
| 🟡 Deuda técnica | #8 Índice `CreatedAt` | Muy bajo |
| 🟡 Deuda técnica | #10–12 Mejoras menores | Bajo |

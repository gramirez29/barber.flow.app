# Implementación de Sincronización de Configuraciones

## Descripción General

Este documento describe la implementación de la sincronización de configuraciones de barbero entre AsyncStorage (local) y la API del backend. La funcionalidad permite que las configuraciones de cálculo de reportes del barbero (porcentaje de comisión y gasto diario fijo) se almacenen tanto localmente como en el backend.

## Integración con el Backend

### Cambios Realizados

#### 1. Definiciones de Tipos (`src/types/settings.ts`)

Se agregó el campo `Settings` a las interfaces de la API:

```typescript
export interface BarberApiRequest {
  // ... campos existentes
  Settings?: ReportCalculationSettings; // Mapea a PascalCase del backend
}

export interface BarberApiResponse {
  // ... campos existentes
  settings?: ReportCalculationSettings; // camelCase del frontend
}
```

La interfaz `ReportCalculationSettings` ya estaba definida:

```typescript
export interface ReportCalculationSettings {
  commissionPercentage: number;
  fixedDailyExpense: number;
}
```

#### 2. Capa de Servicio (`src/services/settingsService.ts`)

**Funciones Actualizadas:**

- **`mapBarberRequest(values, reportCalculations?)`**
  - Ahora acepta el parámetro opcional `reportCalculations`
  - Mapea al formato del backend: `{ CommissionPercentage, FixedDailyExpense }`
  - Las configuraciones solo se incluyen si se proporciona `reportCalculations`

- **`mapBarberResponse(response)`**
  - Extrae las configuraciones de la respuesta del backend (maneja tanto PascalCase como camelCase)
  - Mapea al formato del frontend: `{ commissionPercentage, fixedDailyExpense }`
  - Retorna las configuraciones en `BarberApiResponse.settings`

- **`createApplicationUser(values)`**
  - Ahora lee las configuraciones actuales de AsyncStorage
  - Incluye las configuraciones en la solicitud de creación del barbero
  - Asegura que los nuevos barberos tengan las configuraciones actuales de cálculo de reportes

- **`updateApplicationUser(barberId, values)`**
  - Ahora lee las configuraciones actuales de AsyncStorage
  - Incluye las configuraciones en la solicitud de actualización del barbero
  - Sincroniza las configuraciones de AsyncStorage al backend en las actualizaciones de perfil

- **`setReportCalculationSettings(reportCalculations, barberId?)`**
  - Mejorada con el parámetro opcional `barberId`
  - Siempre guarda en AsyncStorage (preserva el comportamiento existente)
  - Si se proporciona `barberId`, también sincroniza al backend vía `syncSettingsToBackend`
  - Las fallas de sincronización del backend se registran pero no lanzan errores (la actualización de AsyncStorage siempre tiene éxito)

- **`getApplicationUserById(barberId)`**
  - Ahora auto-sincroniza las configuraciones del backend a AsyncStorage
  - Cuando se obtienen los datos del barbero, las configuraciones se actualizan automáticamente localmente
  - Asegura que AsyncStorage se mantenga sincronizado con el backend

**Funciones Nuevas:**

- **`getBarberIdByUserName(userName): Promise<string | null>`**
  - Busca un barbero por userName
  - Retorna el barberId si se encuentra una coincidencia exacta
  - Útil para encontrar el perfil de barbero del usuario logueado
  - Retorna null si no se encuentra o en caso de error

- **`syncSettingsFromBackend(barberData: BarberApiResponse): Promise<void>`**
  - Sincroniza las configuraciones del backend a AsyncStorage
  - Se llama automáticamente por `getApplicationUserById`
  - Solo actualiza AsyncStorage si el backend tiene configuraciones

- **`syncSettingsToBackend(barberId: string, settings: ReportCalculationSettings): Promise<BarberApiResponse>`**
  - Sincroniza las configuraciones de AsyncStorage al backend
  - Obtiene los datos actuales del barbero
  - Actualiza el barbero con las nuevas configuraciones
  - Se llama por `setReportCalculationSettings` cuando se proporciona barberId

## Compatibilidad Retroactiva

Todos los cambios son **retrocompatibles**:

1. **Configuraciones Opcionales**: El campo `Settings` es opcional en todas las interfaces
2. **Comportamiento Preservado**: El código existente que no proporciona `barberId` funciona sin cambios
3. **Prioridad AsyncStorage**: Las configuraciones siempre se guardan primero en AsyncStorage
4. **Degradación Elegante**: Las fallas de sincronización del backend no rompen la aplicación
5. **Auto-sincronización al Obtener**: Cuando se obtienen los datos del barbero, las configuraciones se sincronizan automáticamente desde el backend

## Ejemplos de Uso

### Uso Básico (Comportamiento Actual - No Requiere Cambios)

```typescript
// Guardar configuraciones solo en AsyncStorage (comportamiento existente)
await settingsService.setReportCalculationSettings({
  commissionPercentage: 45,
  fixedDailyExpense: 15000
});
```

### Sincronizar Configuraciones al Backend

```typescript
// Guardar tanto en AsyncStorage COMO en el backend
const barberId = "CRB-0001";
await settingsService.setReportCalculationSettings(
  {
    commissionPercentage: 45,
    fixedDailyExpense: 15000
  },
  barberId // Incluir barberId para habilitar sincronización con backend
);
```

### Obtener el ID del Barbero para el Usuario Logueado

```typescript
// Desde el store de autenticación
const user = useAuthStore((state) => state.user);

// Encontrar barbero por userName
const barberId = await settingsService.getBarberIdByUserName(user.userName);

if (barberId) {
  // Ahora se pueden sincronizar las configuraciones
  await settingsService.setReportCalculationSettings(settings, barberId);
}
```

### Obtener Barbero (Auto-sincroniza Configuraciones)

```typescript
// Las configuraciones se sincronizan automáticamente del backend a AsyncStorage
const barber = await settingsService.getApplicationUserById("CRB-0001");

// Si barber.settings existe, AsyncStorage se actualiza automáticamente
console.log(barber?.settings); // { commissionPercentage: 40, fixedDailyExpense: 12000 }
```

### Sincronización Manual desde el Backend

```typescript
const barber = await settingsService.getApplicationUserById("CRB-0001");
if (barber) {
  await settingsService.syncSettingsFromBackend(barber);
}
```

### Sincronización Manual al Backend

```typescript
const settings = await settingsService.getReportCalculationSettings();
await settingsService.syncSettingsToBackend("CRB-0001", settings);
```

## Flujo de Datos

### Creación de un Nuevo Barbero

```
1. El usuario llena el formulario
2. Se llama createApplicationUser()
3. Lee las configuraciones actuales de AsyncStorage
4. Envía datos del barbero + configuraciones al backend
5. El backend almacena el barbero con configuraciones
6. Retorna BarberApiResponse con configuraciones
```

### Actualización del Perfil del Barbero

```
1. El usuario edita el perfil
2. Se llama updateApplicationUser()
3. Lee las configuraciones actuales de AsyncStorage
4. Envía datos actualizados + configuraciones al backend
5. El backend actualiza el barbero incluyendo configuraciones
6. Retorna BarberApiResponse actualizado
```

### Actualización de Configuraciones de Reportes

```
1. El usuario cambia las configuraciones en la UI
2. Se llama setReportCalculationSettings()
3. Guarda en AsyncStorage (siempre tiene éxito)
4. Si se proporciona barberId:
   a. Llama syncSettingsToBackend()
   b. Obtiene los datos actuales del barbero
   c. Actualiza el barbero con las nuevas configuraciones
   d. Retorna los datos actualizados
5. Si la sincronización falla, registra una advertencia (AsyncStorage aún se guardó)
```

### Obtención de Datos del Barbero

```
1. Se llama getApplicationUserById()
2. Obtiene el barbero del backend
3. Si el barbero tiene configuraciones:
   a. Llama syncSettingsFromBackend()
   b. Actualiza AsyncStorage con las configuraciones del backend
4. Retorna BarberApiResponse
```

## Puntos de Integración

### Componentes que Usan Configuraciones

- **SettingsScreen.tsx**: UI principal de configuraciones
  - Llama `setReportCalculationSettings()` al guardar
  - Actualmente guarda solo en AsyncStorage
  - Puede mejorarse para incluir barberId para sincronización con backend

### Componentes que Obtienen Barberos

- **SettingsScreen.tsx**: Busca y obtiene barberos
  - Llama `getApplicationUserById()` y `findApplicationUsers()`
  - Las configuraciones ahora se auto-sincronizan desde el backend

### Flujo de Autenticación

- **LoginScreen.tsx**: Autenticación de usuario
  - Podría mejorarse para obtener datos del barbero después del login
  - Auto-sincronizaría las configuraciones desde el backend

- **RootNavigator.tsx**: Inicialización de la aplicación
  - Carga el usuario almacenado de SecureStore
  - Podría obtener datos del barbero al iniciar la aplicación

## Mejoras Futuras

1. **Auto-sincronización en el Login**
   - Después de un login exitoso, obtener el barbero por userName
   - Auto-sincronizar configuraciones del backend a AsyncStorage

2. **Mejoras en la Pantalla de Configuraciones**
   - Agregar botón "Sincronizar Configuraciones"
   - Mostrar indicador de estado de sincronización
   - Mostrar marca de tiempo de la última sincronización

3. **Soporte Offline**
   - Encolar actualizaciones de configuraciones cuando esté offline
   - Sincronizar al backend cuando se restaure la conexión

4. **Resolución de Conflictos**
   - Detectar cuando las configuraciones del backend difieren de las locales
   - Preguntar al usuario cuál mantener

5. **Mejora del Store**
   - Agregar barberId al store de autenticación
   - Simplificar el acceso al perfil de barbero del usuario logueado

## Recomendaciones de Pruebas

1. **Crear Barbero**: Verificar que las configuraciones se guarden en el backend
2. **Actualizar Barbero**: Verificar que las configuraciones se actualicen en el backend
3. **Obtener Barbero**: Verificar que las configuraciones se sincronicen a AsyncStorage
4. **Actualizar Configuraciones**: Verificar que AsyncStorage siempre se actualice
5. **Sincronización Backend**: Verificar que las configuraciones se sincronicen cuando se proporciona barberId
6. **Offline**: Verificar que AsyncStorage funcione cuando el backend no esté disponible
7. **Compatibilidad Retroactiva**: Verificar que el código existente funcione sin cambios

## Contrato de la API del Backend

### Formato de Solicitud (Crear/Actualizar Barbero)

```json
{
  "UserName": "jdoe",
  "UserEmail": "jdoe@example.com",
  "BarberName": "John Doe",
  "BarberPhone": "555-1234",
  "Settings": {
    "CommissionPercentage": 40,
    "FixedDailyExpense": 12000
  }
}
```

### Formato de Respuesta (Datos del Barbero)

```json
{
  "id": "CRB-0001",
  "userName": "jdoe",
  "userEmail": "jdoe@example.com",
  "barberName": "John Doe",
  "barberPhone": "555-1234",
  "settings": {
    "commissionPercentage": 40,
    "fixedDailyExpense": 12000
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

Nota: El backend usa PascalCase, el frontend usa camelCase. Los mapeadores manejan la conversión.

## Archivos Modificados

### Frontend

1. `src/types/settings.ts`
   - Se agregó `Settings?: ReportCalculationSettings` a `BarberApiRequest`
   - Se agregó `settings?: ReportCalculationSettings` a `BarberApiResponse`

2. `src/services/settingsService.ts`
   - Se actualizó la firma e implementación de `mapBarberRequest()`
   - Se actualizó `mapBarberResponse()` para extraer configuraciones
   - Se mejoró `createApplicationUser()` para incluir configuraciones
   - Se mejoró `updateApplicationUser()` para incluir configuraciones
   - Se mejoró `setReportCalculationSettings()` con barberId opcional
   - Se mejoró `getApplicationUserById()` para auto-sincronizar configuraciones
   - Se agregó la función auxiliar `getBarberIdByUserName()`
   - Se agregó la función `syncSettingsFromBackend()`
   - Se agregó la función `syncSettingsToBackend()`

### Backend (Completado Previamente)

Ver `application-backend-docs/MONGODB_IMPLEMENTATION.md` para los cambios del backend.

## Siguiente Paso Sugerido

Para mejorar la experiencia del usuario, se recomienda implementar la sincronización automática de configuraciones durante el proceso de login. Esto asegurará que las configuraciones del barbero se sincronicen automáticamente desde el backend a AsyncStorage tan pronto como el usuario inicie sesión.

### Implementación Recomendada

**Opción 1: Sincronización en LoginScreen.tsx**

Agregar la sincronización después del login exitoso:

```typescript
// En LoginScreen.tsx, después de la línea donde se llama authService.login()
const handleLogin = async () => {
  try {
    setLoading(true);
    
    // Login existente
    const user = await authService.login(userName, password);
    authStore.setUser(user);
    
    // NUEVO: Sincronizar configuraciones del backend
    try {
      const barberId = await settingsService.getBarberIdByUserName(user.userName);
      if (barberId) {
        // Auto-sincroniza configuraciones desde backend a AsyncStorage
        await settingsService.getApplicationUserById(barberId);
        console.log('Configuraciones sincronizadas exitosamente');
      }
    } catch (syncError) {
      // La sincronización es opcional, no bloquear el login si falla
      console.warn('No se pudieron sincronizar las configuraciones:', syncError);
    }
    
    // Navegar a la pantalla principal
    navigation.navigate('Home');
  } catch (error) {
    setError('Usuario o contraseña incorrectos');
  } finally {
    setLoading(false);
  }
};
```

**Opción 2: Sincronización en RootNavigator.tsx**

Agregar la sincronización al inicializar la aplicación:

```typescript
// En RootNavigator.tsx, donde se carga el usuario del SecureStore
useEffect(() => {
  const loadUser = async () => {
    try {
      const storedUser = await authService.loadStoredUser();
      if (storedUser) {
        authStore.setUser(storedUser);
        
        // NUEVO: Sincronizar configuraciones al iniciar la app
        try {
          const barberId = await settingsService.getBarberIdByUserName(storedUser.userName);
          if (barberId) {
            await settingsService.getApplicationUserById(barberId);
            console.log('Configuraciones sincronizadas al iniciar la app');
          }
        } catch (syncError) {
          console.warn('No se pudieron sincronizar las configuraciones:', syncError);
        }
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };
  
  loadUser();
}, []);
```

### Beneficios de Esta Implementación

1. **Sincronización Automática**: Las configuraciones se sincronizan sin intervención del usuario
2. **Experiencia Fluida**: El usuario siempre tiene las configuraciones más recientes del backend
3. **No Intrusivo**: Las fallas de sincronización no afectan el flujo de login
4. **Consistencia**: Asegura que AsyncStorage y backend estén sincronizados
5. **Offline-First**: Si la sincronización falla, la app sigue funcionando con datos locales

### Consideraciones

- La sincronización es **opcional y no bloqueante**
- Los errores se registran pero no interrumpen el flujo de usuario
- Si no hay conexión, la app funciona con datos de AsyncStorage
- La sincronización se ejecuta en segundo plano sin afectar el rendimiento
- El usuario puede iniciar sesión incluso si el backend está inaccesible

Esta mejora se alinea con el enfoque de la implementación actual: **mantener AsyncStorage como caché local confiable mientras se sincroniza con el backend cuando sea posible**.

## Conclusión

La implementación de sincronización de configuraciones proporciona una integración perfecta entre AsyncStorage local y la API del backend mientras mantiene total compatibilidad retroactiva. El código existente continúa funcionando sin cambios, y las nuevas funcionalidades pueden aprovechar opcionalmente la sincronización con el backend cuando barberId esté disponible.

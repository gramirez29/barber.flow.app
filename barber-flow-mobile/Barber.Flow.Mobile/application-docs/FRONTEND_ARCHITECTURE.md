# Arquitectura del Frontend — Barber Flow Mobile

> **Audiencia:** Cualquier desarrollador que entre al proyecto por primera vez. No necesitas experiencia previa en el proyecto, pero sí conocimiento básico de React Native y TypeScript.

---

## Tabla de contenidos

1. [Stack tecnológico](#1-stack-tecnológico)
2. [Estructura de carpetas](#2-estructura-de-carpetas)
3. [Punto de entrada — App.tsx](#3-punto-de-entrada--apptsx)
4. [Configuración — config.ts](#4-configuración--configts)
5. [Navegación](#5-navegación)
   - 5.1 [RootNavigator — Auth Gate](#51-rootnavigator--auth-gate)
   - 5.2 [DrawerNavigator — menú lateral](#52-drawernavigator--menú-lateral)
   - 5.3 [AppNavigator — pestañas inferiores](#53-appnavigator--pestañas-inferiores)
   - 5.4 [ClientsNavigator — stack de clientes](#54-clientsnavigator--stack-de-clientes)
   - 5.5 [CalendarNavigator — stack de calendario](#55-calendarnavigator--stack-de-calendario)
6. [Estado global (Stores)](#6-estado-global-stores)
   - 6.1 [auth.store.ts — autenticación](#61-authstorets--autenticación)
   - 6.2 [appointment.store.ts — citas](#62-appointmentstorets--citas)
7. [Servicios (Services)](#7-servicios-services)
   - 7.1 [apiClient.ts — HTTP base](#71-apiclientts--http-base)
   - 7.2 [authService.ts](#72-authservicets)
   - 7.3 [clientService.ts](#73-clientservicets)
   - 7.4 [appointmentService.ts](#74-appointmentservicets)
   - 7.5 [settingsService.ts](#75-settingsservicets)
   - 7.6 [notificationService.ts](#76-notificationservicets)
8. [Contextos (Context)](#8-contextos-context)
   - 8.1 [LanguageContext.tsx](#81-languagecontexttsx)
   - 8.2 [ThemeContext.tsx](#82-themecontexttsx)
   - 8.3 [NotificationContext.tsx](#83-notificationcontexttsx)
   - 8.4 [DialogContext.tsx](#84-dialogcontexttsx)
9. [Tema visual (Theme)](#9-tema-visual-theme)
   - 9.1 [themes.ts](#91-themests)
   - 9.2 [fonts.ts](#92-fontsts)
10. [Localización (i18n)](#10-localización-i18n)
11. [Features — Lógica de formularios y stores locales](#11-features--lógica-de-formularios-y-stores-locales)
    - 11.1 [appointments/](#111-appointments)
    - 11.2 [clients/](#112-clients)
    - 11.3 [reports/](#113-reports)
    - 11.4 [settings/](#114-settings)
12. [Screens — Pantallas](#12-screens--pantallas)
    - 12.1 [LoginScreen](#121-loginscreen)
    - 12.2 [CalendarScreen](#122-calendarscreen)
    - 12.3 [AppointmentFormScreen](#123-appointmentformscreen)
    - 12.4 [ClientsScreen](#124-clientsscreen)
    - 12.5 [ClientFormScreen](#125-clientformscreen)
    - 12.6 [DailyReportScreen](#126-dailyreportscreen)
    - 12.7 [NotificationScreen](#127-notificationscreen)
    - 12.8 [SettingsScreen](#128-settingsscreen)
13. [Componentes (Components)](#13-componentes-components)
    - 13.1 [Componentes generales](#131-componentes-generales)
    - 13.2 [Componentes de Calendar](#132-componentes-de-calendar)
    - 13.3 [Componentes de Clients](#133-componentes-de-clients)
    - 13.4 [Componentes de Settings](#134-componentes-de-settings)
    - 13.5 [Componentes de Notifications](#135-componentes-de-notifications)
    - 13.6 [Componentes UI genéricos](#136-componentes-ui-genéricos)
14. [Tipos (Types)](#14-tipos-types)
15. [Utilidades (Utils)](#15-utilidades-utils)
16. [Flujos principales end-to-end](#16-flujos-principales-end-to-end)
17. [Patrones recurrentes a conocer](#17-patrones-recurrentes-a-conocer)

---

## 1. Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| React Native | via Expo SDK ~54 | Framework de UI |
| Expo | SDK ~54 | Herramientas, APIs nativas |
| TypeScript | ~5 | Tipado estático |
| React Navigation | v6 | Navegación entre pantallas |
| Zustand | ^5 | Estado global (auth + citas) |
| react-native-paper | MD3 | Componentes de Material Design |
| expo-secure-store | — | Almacenamiento seguro del JWT |
| AsyncStorage | — | Preferencias del usuario (tema, idioma, notificaciones) |
| i18n-js | — | Internacionalización (español/inglés) |
| expo-localization | — | Detectar idioma del dispositivo |
| date-fns | — | Manipulación de fechas |
| expo-web-browser | — | Abrir URLs externas (política de privacidad) |
| expo-image-picker | — | Seleccionar foto de perfil |

---

## 2. Estructura de carpetas

```
barber-flow-mobile/Barber.Flow.Mobile/
├── App.tsx                    → Punto de entrada, wraps de providers
├── index.ts                   → Registro del componente raíz
├── app.config.js              → Configuración de Expo (env vars, app.json dinámico)
├── eas.json                   → Configuración de EAS Build (testing, production)
│
└── src/
    ├── config.ts              → BASE_URL, APP_ENV, constantes de entorno
    │
    ├── navigation/            → Toda la lógica de navegación
    │   ├── RootNavigator.tsx  → Auth gate (login vs app)
    │   ├── DrawerNavigator.tsx → Menú lateral
    │   ├── AppNavigator.tsx   → Bottom tabs (5 pestañas)
    │   ├── ClientsNavigator.tsx → Stack: lista → formulario de cliente
    │   └── CalendarNavigator.tsx → Stack: calendario → formulario de cita
    │
    ├── screens/               → Pantallas principales
    │   ├── LoginScreen.tsx
    │   ├── CalendarScreen.tsx
    │   ├── AppointmentFormScreen.tsx
    │   ├── ClientsScreen.tsx
    │   ├── ClientFormScreen.tsx
    │   ├── DailyReportScreen.tsx
    │   ├── NotificationScreen.tsx
    │   └── SettingsScreen.tsx
    │
    ├── components/            → Componentes reutilizables
    │   ├── ScreenLayout.tsx   → Layout base con fondo para todas las screens
    │   ├── AvatarPicker.tsx   → Selector de foto circular
    │   ├── ClientAvatar.tsx   → Avatar de cliente (foto o iniciales)
    │   ├── calendar/          → Componentes específicos del calendario
    │   ├── clients/           → Componentes específicos de clientes
    │   ├── notifications/     → Componentes de notificaciones
    │   ├── settings/          → Componentes de ajustes
    │   └── ui/                → Componentes genéricos de UI
    │
    ├── features/              → Lógica de negocio local (hooks de formularios, stores)
    │   ├── appointments/      → Store de citas + tipos + hook de formulario
    │   ├── clients/           → Hook de formulario de cliente
    │   ├── reports/           → Lógica de cálculo del reporte diario
    │   └── settings/          → Hooks de formularios de ajustes
    │
    ├── services/              → Comunicación con el backend
    │   ├── apis/
    │   │   └── apiClient.ts   → Cliente HTTP base con autenticación JWT
    │   ├── authService.ts     → Login, logout, persistencia de sesión
    │   ├── clientService.ts   → CRUD de clientes
    │   ├── appointmentService.ts → CRUD de citas
    │   ├── settingsService.ts → CRUD de barberos, preferencias locales
    │   └── notificationService.ts → Generación de notificaciones en-app
    │
    ├── store/
    │   └── auth.store.ts      → Estado global de autenticación (Zustand)
    │
    ├── context/               → React Context para estado que necesita muchos componentes
    │   ├── LanguageContext.tsx → Idioma activo, cambio de idioma
    │   ├── ThemeContext.tsx   → Tema visual (light/dark/system)
    │   ├── NotificationContext.tsx → Notificaciones en-app
    │   └── DialogContext.tsx  → Alertas/diálogos modales globales
    │
    ├── theme/
    │   ├── themes.ts          → Tokens de diseño (colores, tipografía, espaciado)
    │   └── fonts.ts           → Fuentes personalizadas (Montserrat)
    │
    ├── localization/
    │   ├── i18n.ts            → Configuración de i18n-js
    │   ├── es.ts              → Traducciones en español
    │   └── en.ts              → Traducciones en inglés
    │
    ├── types/                 → Interfaces TypeScript compartidas
    │   ├── applicationUser.ts → Tipo del usuario autenticado
    │   ├── clients.ts         → Tipo Client y PaginationParams
    │   ├── notifications.ts   → Tipos de notificaciones
    │   └── settings.ts        → Tipos de preferencias, barberos, tema, idioma
    │
    └── utils/
        ├── errors.ts          → getErrorMessage() para errores tipados
        ├── formatUtil.ts      → Formateo de fechas, precios, etc.
        └── contactActions.ts  → Abrir llamada, WhatsApp desde un cliente
```

---

## 3. Punto de entrada — App.tsx

`App.tsx` es el componente raíz de la aplicación. Su única responsabilidad es envolver toda la app con los providers necesarios, en el orden correcto:

```
<SafeAreaProvider>
  <DialogProvider>          → Diálogos modales globales
    <ThemeProvider>         → Tema visual (light/dark/system)
      <LanguageProvider>    → Idioma (es/en)
        <NotificationProvider> → Notificaciones en-app
          <NavigationContainer> → React Navigation
            <RootNavigator />  → Lógica de rutas
          </NavigationContainer>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  </DialogProvider>
</SafeAreaProvider>
```

**Orden importante:** `DialogProvider` va afuera de `ThemeProvider` porque los diálogos necesitan acceso al tema. `NotificationProvider` va adentro de `LanguageProvider` porque puede necesitar texto traducido.

---

## 4. Configuración — config.ts

**Ubicación:** `src/config.ts`

Exporta constantes de configuración de entorno:

```typescript
export const BASE_URL  // URL del backend API
export const APP_ENV   // "development" | "testing" | "production"
export const ADMIN_USERNAME  // Username del administrador único
export const PRIVACY_POLICY_URL
```

**Lógica de resolución de `BASE_URL`:**
1. Primero busca en `process.env.BARBERFLOW_API_URL` (variables de entorno de CI/CD)
2. Luego en `Constants.expoConfig.extra.BASE_URL` (configurado en `app.config.js`)
3. Fallback automático según `APP_ENV`:
   - `development` → `http://192.168.68.55:7016` (IP local del desarrollador)
   - `testing` / `production` → `https://barberflowapp-develop.up.railway.app`

> **Para un desarrollador nuevo:** Si corres la app en desarrollo y ves errores de conexión, cambia la IP en `config.ts` a la IP de tu máquina en la red local.

---

## 5. Navegación

La app usa React Navigation con una estructura anidada de navigators:

```
RootNavigator (Stack)
├── LoginScreen (cuando no hay usuario autenticado)
└── DrawerNavigator (cuando hay usuario autenticado)
    └── AppNavigator (Bottom Tabs)
        ├── CalendarNavigator (Stack)
        │   ├── CalendarScreen
        │   └── AppointmentFormScreen
        ├── ClientsNavigator (Stack)
        │   ├── ClientsScreen
        │   └── ClientFormScreen
        ├── DailyReportScreen
        ├── NotificationScreen
        └── SettingsScreen
```

### 5.1 RootNavigator — Auth Gate

**Archivo:** `src/navigation/RootNavigator.tsx`

Es el primer navigator que se monta. Su lógica:
1. Al montarse, intenta restaurar el usuario desde `expo-secure-store` (sesión persistida)
2. Llama a `authService.getStoredUser()` → si existe, llama a `useAuthStore.setUser(user)`
3. Mientras carga, retorna `null` (pantalla en blanco, evita flash)
4. Si `user !== null` → muestra `DrawerNavigator`
5. Si `user === null` → muestra `LoginScreen`

No hay logout explícito en el navigator: cuando `authService.clearStoredUser()` se llama en SettingsScreen, limpia el store de Zustand (`clearUser()`), lo que hace que el estado cambie a `null` y React Navigation re-renderiza automáticamente mostrando LoginScreen.

### 5.2 DrawerNavigator — menú lateral

**Archivo:** `src/navigation/DrawerNavigator.tsx`

Drawer (menú lateral deslizable desde la izquierda) con una sola pantalla: `HomeTabs` → `AppNavigator`. El contenido del drawer lo define `AppDrawerContent` (componente personalizado con el perfil del barbero y botón de logout).

Estilos del drawer:
- Fondo oscuro: `#1C1C1C`
- Sin borde derecho visible

### 5.3 AppNavigator — pestañas inferiores

**Archivo:** `src/navigation/AppNavigator.tsx`

Bottom Tab Navigator con 5 pestañas:

| Tab | Componente | Ícono (Ionicons) |
|---|---|---|
| Calendar | CalendarNavigator | calendar-outline / calendar |
| Clients | ClientsNavigator | people-outline / people |
| DailyReport | DailyReportScreen | bar-chart-outline / bar-chart |
| NotificationScreen | NotificationScreen | notifications-outline / notifications |
| SettingsScreen | SettingsScreen | settings-outline / settings |

La pestaña de notificaciones muestra un **badge** con `unreadCount` del `NotificationContext`.

El tab bar usa un fondo gradiente personalizado (transparente sobre `LinearGradient`). Los íconos activos tienen un fondo circular dorado semitransparente.

### 5.4 ClientsNavigator — stack de clientes

**Archivo:** `src/navigation/ClientsNavigator.tsx`

Stack Navigator con dos pantallas:
- `ClientsList` → `ClientsScreen`
- `ClientForm` → `ClientFormScreen` (recibe `clientId?: string` como parámetro; si no hay clientId, es "crear nuevo")

### 5.5 CalendarNavigator — stack de calendario

**Archivo:** `src/navigation/CalendarNavigator.tsx`

Stack Navigator con dos pantallas:
- `CalendarMain` → `CalendarScreen`
- `AppointmentForm` → `AppointmentFormScreen` (recibe `appointmentId?: string` y `selectedDate?: string`)

---

## 6. Estado global (Stores)

### 6.1 auth.store.ts — autenticación

**Archivo:** `src/store/auth.store.ts`

Store de Zustand para el usuario autenticado:

```typescript
interface AuthState {
  user: ApplicationUser | null;
  setUser: (user: ApplicationUser) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(...)
```

**Uso típico:**
```typescript
// Leer el usuario actual
const user = useAuthStore((s) => s.user);

// Obtener solo el token (para apiClient)
const token = useAuthStore.getState().user?.token;

// Login
useAuthStore.getState().setUser(user);

// Logout
useAuthStore.getState().clearUser();
```

No usa persistencia (no está guardado en AsyncStorage). La sesión se restaura en `RootNavigator` desde `expo-secure-store` al iniciar la app.

### 6.2 appointment.store.ts — citas

**Archivo:** `src/features/appointments/appointment.store.ts`

Store de Zustand con **persistencia en AsyncStorage** (las citas se guardan localmente entre sesiones).

```typescript
interface AppointmentState {
  appointments: Appointment[];
  isLoading: boolean;
  fetchAppointments(params?): Promise<void>
  fetchAppointmentsByDateRange(startDate, endDate, status?): Promise<void>
  addAppointment(draft): Promise<Appointment>
  updateAppointment(id, draft): Promise<void>
  moveAppointment(id, newDate): Promise<void>
  removeAppointment(id): Promise<void>
  getAppointmentsByDate(date): Appointment[]       // selector síncrono
  getCompletedAppointmentsByDate(date): Appointment[] // selector síncrono
}
```

**Características clave:**
- Las citas siempre se mantienen **ordenadas por fecha/hora** (función `sortAppointments`)
- `fetchAppointmentsByDateRange` hace un merge inteligente: descarga el rango pedido y lo combina con las citas fuera del rango que ya estaban en el store local (evita borrar datos de otros días)
- Los selectores `getAppointmentsByDate` y `getCompletedAppointmentsByDate` son síncronos (filtran el array local sin llamar al backend)

---

## 7. Servicios (Services)

Los servicios son módulos que encapsulan la comunicación con el backend. Todos usan `apiFetch` como base.

### 7.1 apiClient.ts — HTTP base

**Archivo:** `src/services/apis/apiClient.ts`

Función central `apiFetch(path, options)`:

1. Lee el JWT del `useAuthStore` en memoria (si existe) o de `expo-secure-store`
2. Agrega `Authorization: Bearer <token>` al header
3. Si se pasa `options.json`, serializa a JSON y agrega `Content-Type: application/json`
4. Llama a `fetch(BASE_URL + path, options)`
5. Si el status es 401 → limpia la sesión y lanza error (fuerza re-login)
6. Si es 204 (No Content) → retorna `null`
7. Si la respuesta no es JSON → retorna `null`
8. Si hay error HTTP → extrae el mensaje de error y lanza excepción
9. Retorna el JSON parseado

**Tipo `ApiFetchOptions`:**
```typescript
type ApiFetchOptions = RequestInit & {
  json?: unknown; // shortcut: pasa un objeto y se serializa automáticamente
}
```

### 7.2 authService.ts

**Archivo:** `src/services/authService.ts`

| Función | Descripción |
|---|---|
| `login(userName, password)` | POST `/api/users/authentication/`. Guarda el `ApplicationUser` en `expo-secure-store`. Retorna el usuario. |
| `getStoredUser()` | Lee el usuario del SecureStore. Retorna `null` si no hay sesión. |
| `clearStoredUser()` | Elimina el usuario del SecureStore. Llamado en logout. |
| `deleteSelf()` | DELETE `/api/users/me`. Elimina la cuenta del usuario actualmente autenticado. |

**Clave del SecureStore:** `"applicationUser"` — almacenado como JSON stringificado.

### 7.3 clientService.ts

**Archivo:** `src/services/clientService.ts`

| Función | Endpoint | Descripción |
|---|---|---|
| `create(client)` | POST `/api/clients` | Crea un cliente nuevo |
| `update(id, client)` | PUT `/api/clients/{id}` | Actualiza un cliente |
| `delete(id)` | DELETE `/api/clients/{id}` | Elimina un cliente |
| `find(query?, page?, pageSize?)` | GET `/api/clients/search` | Busca clientes con paginación opcional |

**Exportado como:** `clientsService` (con "s" — nota para evitar confusiones).

### 7.4 appointmentService.ts

**Archivo:** `src/services/appointmentService.ts`

| Función | Endpoint | Descripción |
|---|---|---|
| `create(draft)` | POST `/api/appointments` | Crea una cita |
| `update(id, draft)` | PUT `/api/appointments/{id}` | Actualiza una cita |
| `move(id, newDate)` | PATCH `/api/appointments/move/{id}` | Mueve una cita a otra fecha |
| `remove(id)` | DELETE `/api/appointments/{id}` | Elimina una cita |
| `find(params?)` | GET `/api/appointments/search` | Busca con filtros (fecha, rango, estado, texto) |
| `getById(id)` | GET `/api/appointments/{id}` | Obtiene una cita por ID |
| `getNextId()` | GET `/api/appointments/nextId` | Obtiene el siguiente ID disponible (APT-XXXX) |

**Nota de mapeo camelCase/PascalCase:** El backend puede devolver tanto `id` como `Id`. El servicio normaliza ambas formas con el patrón `(response.id ?? response.Id)`.

**Tipo `AppointmentSearchParams`:**
```typescript
{
  date?: string;        // "yyyy-MM-dd" — fecha de inicio o exacta
  endDate?: string;     // "yyyy-MM-dd" — para buscar en rango
  status?: string;      // "scheduled" | "confirmed" | "completed" | "cancelled"
  query?: string;       // texto libre (nombre, teléfono)
  page?: number;
  pageSize?: number;
}
```

### 7.5 settingsService.ts

**Archivo:** `src/services/settingsService.ts`

Maneja dos tipos de datos:

**Datos de barbero (backend):**
| Función | Endpoint | Descripción |
|---|---|---|
| `createApplicationUser(form)` | POST `/api/barbers/create` | Crea un barbero |
| `deleteApplicationUser(barberId)` | DELETE `/api/barbers/delete/{id}` | Elimina un barbero |
| `findApplicationUsers(query)` | GET `/api/barbers/search?query=...` | Busca barberos |
| `updateApplicationUser(barberId, form)` | PUT `/api/barbers/update/{id}` | Actualiza un barbero |

**Preferencias locales (AsyncStorage):**
| Función | Descripción |
|---|---|
| `getStoredPreferences()` | Lee las preferencias del usuario de AsyncStorage |
| `setLanguagePreference(language, source)` | Guarda el idioma elegido |
| `setThemePreference(themeMode)` | Guarda el tema elegido |
| `setNotificationsEnabled(value)` | Guarda si las notificaciones están activas |
| `setReportCalculationSettings(settings)` | Guarda porcentaje de comisión y gastos fijos |

**Clave de AsyncStorage:** `"barber-flow-settings-preferences"` — JSON con `SettingsPreferences`.

El `mapBarberResponse` normaliza campos con patrón `response.field ?? response.Field` para compatibilidad con la API.

### 7.6 notificationService.ts

**Archivo:** `src/services/notificationService.ts`

Este servicio **no llama al backend**. Genera notificaciones inteligentes a partir de las citas locales y las guarda en AsyncStorage.

**Tipos de notificaciones generadas:**

| Tipo | Lógica | Descripción |
|---|---|---|
| `next-day-summary` | Citas del día siguiente | "Tienes 3 citas mañana: Juan, María, Pedro" |
| `delayed-client-summary` | Clientes sin cita en 30+ días | "Juan García no ha venido en 35 días" |

**Cómo funciona:**
1. `refreshNotifications(appointments)` — recibe todas las citas del store
2. Procesa los datos para generar notificaciones relevantes
3. Guarda la colección en AsyncStorage (clave `"barber-flow-notifications"`)
4. El `NotificationContext` llama a esto cada vez que cambia el array de citas

**Clave de AsyncStorage:** `"barber-flow-notifications"`

---

## 8. Contextos (Context)

Los contextos de React se usan para estado que:
1. Necesitan muchos componentes a distintos niveles del árbol
2. No requieren las optimizaciones de Zustand
3. Tienen comportamiento de "provider" (p.ej. cargar preferencias al montar)

### 8.1 LanguageContext.tsx

**Archivo:** `src/context/LanguageContext.tsx`

Maneja el idioma activo de la app.

**Hook de uso:** `useTranslation()` y `useLanguage()`

```typescript
const { translateText } = useTranslation();
translateText("clients.title"); // → "Clientes" o "Clients"

const { language, setLanguage, resetToSystemLanguage, isUsingSystemLanguage } = useLanguage();
```

**Lógica de resolución de idioma:**
1. Al montar, carga `settingsService.getStoredPreferences()` para ver si el usuario eligió un idioma manual
2. Si `languageSource === "system"` → usa el idioma del dispositivo (via `expo-localization`)
3. Si `languageSource === "manual"` → usa el idioma guardado

Cuando el usuario cambia el idioma manualmente, se guarda como `"manual"` en `settingsService`. `resetToSystemLanguage()` lo pone de vuelta a `"system"`.

### 8.2 ThemeContext.tsx

**Archivo:** `src/theme/ThemeContext.tsx`

Maneja el tema visual de la app.

**Hook de uso:** `useAppTheme()`

```typescript
const { theme, toggleTheme, setThemeMode, themeMode, resolvedThemeMode } = useAppTheme();

// theme es el objeto completo con colores, espaciado, tipografía
theme.colors.primary     // "#C9A84C" (dorado)
theme.colors.background  // "#0D0D0D" (dark) o "#FFFFFF" (light)
theme.layout.spacing.md  // 16
```

**`ThemeMode`:** `"light"` | `"dark"` | `"system"`

- `themeMode`: lo que el usuario eligió (`"system"` por defecto)
- `resolvedThemeMode`: el tema real aplicado (`"light"` o `"dark"`, resuelve `"system"` según el dispositivo)
- `toggleTheme()`: alterna entre light y dark

Se integra con `react-native-paper` (MD3) y `@react-navigation/native` para colorear también los headers y el drawer automáticamente.

### 8.3 NotificationContext.tsx

**Archivo:** `src/context/NotificationContext.tsx`

Maneja las notificaciones en-app (no push notifications del sistema operativo).

**Hook de uso:** `useNotification()`

```typescript
const {
  notifications,
  unreadCount,
  notificationsEnabled,
  refreshNotifications,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  setNotificationsEnabled,
  isLoading
} = useNotification();
```

**Flujo:** Cada vez que `appointments` cambia en el `useAppointmentStore`, el contexto llama a `notificationService.refreshNotifications(appointments)` y actualiza la lista de notificaciones.

`unreadCount` lo usa `AppNavigator` para mostrar el badge rojo en la pestaña de notificaciones.

### 8.4 DialogContext.tsx

**Archivo:** `src/context/DialogContext.tsx`

Permite mostrar diálogos modales desde cualquier parte de la app sin necesidad de manejar estado local.

**Hook de uso:** `useDialog()`

```typescript
const { showAlert } = useDialog();

showAlert(
  "Eliminar cliente",
  "¿Estás seguro de que deseas eliminar este cliente?",
  [
    { text: "Cancelar", style: "cancel" },
    { text: "Eliminar", style: "destructive", onPress: () => handleDelete() }
  ]
);
```

Renderiza un `Modal` nativo de React Native con estilos dark (#1A1A1A). Los botones se colorean según su `style`: dorado (default), rojo (destructive), gris (cancel).

---

## 9. Tema visual (Theme)

### 9.1 themes.ts

**Archivo:** `src/theme/themes.ts`

Define dos objetos: `lightTheme` y `darkTheme`. La app actualmente usa principalmente el tema oscuro, pero soporta ambos.

**Estructura del tema:**
```typescript
{
  mode: "light" | "dark",
  colors: {
    background: "#FFFFFF" | "#0D0D0D",
    surface: "#F5F5F5" | "#1A1A1A",
    primary: "#C9A84C",        // Dorado — color de marca
    secondary: "#E5C878",      // Dorado claro
    textPrimary: "#000000" | "#FFFFFF",
    textSecondary: "#666666" | "#9B9B9B",
    border: "#E0E0E0" | "#3A3A3A",
    tabActive: "#C9A84C",
    tabInactive: "#9B9B9B",
    notificationBadge: "#E53935",
    card: "#FFFFFF" | "#252525",
    error: "#D32F2F" | "#F87171",
    // ... más colores
  },
  layout: {
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    radius: { sm: 4, md: 8, lg: 16 },
    sizes: { /* íconos, avatares, etc. */ },
    shadows: { /* sombras para tarjetas */ },
    typography: { /* tamaños de fuente */ },
    components: { /* heights de inputs, headers, etc. */ }
  }
}
```

Se extienden `MD3LightTheme` / `MD3DarkTheme` de `react-native-paper` y `NavigationDefaultTheme` / `DarkTheme` de `@react-navigation/native`.

### 9.2 fonts.ts

**Archivo:** `src/theme/fonts.ts`

Exporta la fuente tipográfica personalizada: **Montserrat** (con variantes Regular, Medium, SemiBold, Bold). Se carga con `expo-font` en `App.tsx`.

---

## 10. Localización (i18n)

**Archivos:** `src/localization/`

La app soporta **español (es)** e **inglés (en)**. El idioma por defecto es español.

**Configuración (`i18n.ts`):**
```typescript
import i18n from "i18n-js";
import { en } from "./en";
import { es } from "./es";

i18n.translations = { en, es };
i18n.defaultLocale = "es";
i18n.enableFallback = true; // Si falta una clave en el idioma activo, usa el default
```

**Funciones exportadas:**
- `translate(key, options?)` → traduce una clave
- `setI18nLanguage(language)` → cambia el idioma activo
- `resolveLanguageFromDevice(locales)` → detecta si el dispositivo está en español o inglés
- `getIntlLocale(language)` → retorna `"es-CR"` o `"en-US"` para formateo de fechas/números

**Cómo agregar una traducción nueva:**
1. Agregar la clave en `es.ts`: `"clients.newField": "Campo nuevo"`
2. Agregar la clave en `en.ts`: `"clients.newField": "New field"`
3. Usar en el componente: `translateText("clients.newField")`

**Estructura de claves de traducción:**
```
navigation.*    → Nombres de pestañas
login.*         → Pantalla de login
clients.*       → Pantalla y componentes de clientes
appointments.*  → Formularios y estados de citas
settings.*      → Pantalla de ajustes
reports.*       → Reporte diario
notifications.* → Pantalla de notificaciones
common.*        → Botones y textos genéricos
```

---

## 11. Features — Lógica de formularios y stores locales

La carpeta `features/` contiene hooks de formularios y lógica de negocio que no es lo suficientemente global para estar en un Context o Store, pero tampoco pertenece a un componente específico.

### 11.1 appointments/

**`appointments.types.ts`** — Tipos TypeScript:
```typescript
type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled";
type AppointmentPaymentMethod = "cash" | "card" | "sinpeMovil" | "transfer";

interface AppointmentDraft { clientName, phone, date, time, status?, ... }
interface Appointment extends AppointmentDraft { id: string, status: AppointmentStatus }
```

**`appointment.store.ts`** — Ver sección 6.2

**`useAppointmentForm.ts`** — Hook de formulario para crear/editar citas. Maneja el estado del form, validación y submit.

### 11.2 clients/

**`clientForm.ts`** — Hook `useClientForm(clientId?)` que:
- Si recibe `clientId`, carga el cliente del backend para editar
- Maneja el estado del formulario
- Expone `submit()` que llama a `clientsService.create()` o `clientsService.update()`

### 11.3 reports/

**`dailyReport.ts`** — Hook `useDailyReport(date)` que:
- Filtra del store de citas las completadas en la fecha dada
- Calcula totales: ingresos brutos, comisión del barbero, gastos fijos, ganancia neta
- Lee el porcentaje de comisión y gastos fijos de `settingsService.getStoredPreferences()`

### 11.4 settings/

**`settingsForm.ts`** — Hook `useApplicationUsersForm()` para el formulario de edición del perfil del barbero. También exporta `mapBarberResponseToForm()` que convierte el formato de la API al formato del formulario.

**`reportCalculationsForm.ts`** — Hook `useReportCalculationSettingsForm()` para el formulario de porcentaje de comisión y gastos fijos del reporte.

---

## 12. Screens — Pantallas

### 12.1 LoginScreen

**Archivo:** `src/screens/LoginScreen.tsx`

Pantalla de inicio de sesión. No usa el sistema de tema global — tiene sus propios design tokens locales (constante `COLORS`) porque es la única pantalla que siempre se ve igual independientemente del tema.

**Flujo:**
1. Usuario ingresa `userName` y `password`
2. Validación básica (campos no vacíos)
3. `authService.login(userName, password)`
4. Si exitoso: `useAuthStore.setUser(user)` → `RootNavigator` detecta el cambio y navega a la app
5. Si falla: muestra mensaje de error con `getErrorMessage(err)`

**Dependencias:** `authService`, `useAuthStore`, `useTranslation`

### 12.2 CalendarScreen

**Archivo:** `src/screens/CalendarScreen.tsx`

Pantalla principal del calendario. Muestra las citas del día seleccionado.

**Funcionalidades:**
- Vista de calendario mensual con `CalendarView`
- Lista de citas del día seleccionado con `DayAppointments`
- Botón para agregar nueva cita (navega a `AppointmentFormScreen`)
- Permite tocar una cita para ver detalles o editar (`AppointmentModal`)
- Cuando cambia el mes visible, llama a `fetchAppointmentsByDateRange`

**Dependencias:** `useAppointmentStore`, `CalendarNavigator` params

### 12.3 AppointmentFormScreen

**Archivo:** `src/screens/AppointmentFormScreen.tsx`

Formulario para crear o editar una cita.

**Parámetros de navegación:**
- `appointmentId?` — si existe, carga la cita para editar; si no, crea nueva
- `selectedDate?` — pre-llena el campo de fecha

**Dependencias:** `useAppointmentForm`, `useAppointmentStore`, `ClientSearchModal`

### 12.4 ClientsScreen

**Archivo:** `src/screens/ClientsScreen.tsx`

Lista paginada de clientes con búsqueda en tiempo real.

**Funcionalidades:**
- Búsqueda por nombre/teléfono (con debounce)
- Paginación con opciones de 10/25/50 por página
- Swipe actions o menú por cliente: editar, eliminar, crear cita directamente
- `useIsFocused` para recargar la lista cuando se vuelve a esta pantalla

**Tipo de navegación compuesta:** `CompositeNavigationProp` porque necesita navegar tanto dentro del `ClientsNavigator` (stack) como a `CalendarNavigator` (tab diferente).

### 12.5 ClientFormScreen

**Archivo:** `src/screens/ClientFormScreen.tsx`

Formulario para crear o editar un cliente. Usa `useClientForm(clientId?)`.

**Campos:** firstName, lastName, phone, email?, address?, birthday?, preferences?, paymentMethod?, photoUrl?

### 12.6 DailyReportScreen

**Archivo:** `src/screens/DailyReportScreen.tsx`

Reporte financiero del día. Usa `useDailyReport(date)`.

**Muestra:**
- Lista de citas completadas del día
- Total de ingresos brutos
- Comisión del barbero (% configurable)
- Gastos fijos del día (configurable)
- Ganancia neta

La fecha activa se puede cambiar navegando por días con flechas.

### 12.7 NotificationScreen

**Archivo:** `src/screens/NotificationScreen.tsx`

Lista de notificaciones internas generadas por la app.

**Funcionalidades:**
- Lista de `NotificationItem` del `NotificationContext`
- Marcar como leído individual o masivo
- Dismiss (eliminar) una notificación
- Toggle para habilitar/deshabilitar notificaciones
- Secciones de notificaciones (hoy, anteriores, etc.)

### 12.8 SettingsScreen

**Archivo:** `src/screens/SettingsScreen.tsx`

Pantalla de configuración del barbero.

**Secciones:**
1. **Perfil del barbero** — nombre, teléfono, email, foto, nombre del local, cambio de contraseña
2. **Cálculo del reporte** — porcentaje de comisión y gastos fijos diarios
3. **Apariencia** — tema (light/dark/system), idioma (es/en)
4. **Notificaciones** — toggle on/off
5. **Usuarios de la app** — gestión de barberos (solo admin): crear, ver, eliminar
6. **Cuenta** — logout, eliminar cuenta, política de privacidad

La política de privacidad usa `expo-web-browser` (`WebBrowser.openBrowserAsync(url)`) para abrir la URL en un browser in-app.

---

## 13. Componentes (Components)

### 13.1 Componentes generales

**`ScreenLayout.tsx`**
Wrapper de layout para todas las pantallas. Proporciona:
- `ImageBackground` con el fondo de la app (imagen + overlay oscuro)
- `SafeAreaView` configurado correctamente
- `StatusBar` con el estilo correcto según el tema

Uso:
```tsx
<ScreenLayout>
  {/* contenido de la pantalla */}
</ScreenLayout>
```

**`AvatarPicker.tsx`**
Selector de foto circular. Muestra la foto actual o un placeholder con ícono de cámara. Al tocarlo, abre `expo-image-picker` para seleccionar desde la galería.

**`ClientAvatar.tsx`**
Muestra el avatar de un cliente: si tiene `photoUrl`, muestra la foto; si no, muestra las iniciales del nombre sobre un fondo de color derivado del nombre.

### 13.2 Componentes de Calendar

| Componente | Función |
|---|---|
| `CalendarView.tsx` | Vista del calendario mensual con días marcados si tienen citas |
| `CalendarHeader.tsx` | Header del calendario con mes/año y botones de navegación |
| `DayAppointments.tsx` | Lista de citas de un día específico |
| `AppointmentCard.tsx` | Tarjeta individual de una cita (estado, hora, cliente, servicio) |
| `AppointmentForm.tsx` | Formulario interno de cita (usado dentro de un Modal) |
| `AppointmentModal.tsx` | Modal que muestra detalles de una cita y permite editarla |

### 13.3 Componentes de Clients

| Componente | Función |
|---|---|
| `ClientListItem.tsx` | Item de lista de cliente con foto, nombre, teléfono y acciones |
| `ClientForm.tsx` | Formulario completo de cliente (usado en ClientFormScreen) |
| `ClientSearchModal.tsx` | Modal de búsqueda de clientes para asociar a una cita |
| `ClientsListEmptyState.tsx` | Estado vacío cuando no hay clientes |

### 13.4 Componentes de Settings

| Componente | Función |
|---|---|
| `SettingItem.tsx` | Item genérico de ajuste (etiqueta + control: switch, picker, input) |
| `SettingSection.tsx` | Sección agrupada de ajustes con título |
| `ReportCalculationSettingsForm.tsx` | Formulario de comisión y gastos fijos |
| `ApplicationUsersModal.tsx` | Modal de gestión de usuarios (solo admin) |
| `ManageApplicationUsersForm.tsx` | Formulario de creación/edición de usuarios de la app |

### 13.5 Componentes de Notifications

| Componente | Función |
|---|---|
| `NotificationItemCard.tsx` | Tarjeta de una notificación con indicador de leído/no leído |
| `NotificationSection.tsx` | Sección de notificaciones agrupadas por tipo o fecha |
| `NotificationEmptyState.tsx` | Estado vacío cuando no hay notificaciones |

### 13.6 Componentes UI genéricos

**Ubicación:** `src/components/ui/`

| Componente | Función |
|---|---|
| `AppDrawerContent.tsx` | Contenido personalizado del drawer: foto del barbero, nombre, botón de logout |
| `AnimatedTabIcon.tsx` | Ícono de pestaña con animación al activarse y fondo circular dorado |
| `FormCard.tsx` | Tarjeta de formulario con borde y padding consistentes |
| `Header.tsx` | Header reutilizable para pantallas dentro de stacks |
| `PasswordInput.tsx` | Input de contraseña con botón para mostrar/ocultar |
| `ScreenTitle.tsx` | Título de pantalla con estilo consistente |

---

## 14. Tipos (Types)

**`types/applicationUser.ts`**
```typescript
interface ApplicationUser {
  id: string;
  name: string;
  email: string;
  userName: string;
  password?: string;  // No se almacena en la app, solo se usa al enviar
  role: string;       // "Admin" | "User"
  token: string;      // JWT para autenticación
}
```

**`types/clients.ts`**
```typescript
interface Client {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;              // formato "0000-0000"
  email?: string;
  address?: string;
  birthday?: string;          // ISO date "yyyy-MM-dd"
  preferences?: string;
  paymentMethod?: "None" | "Sinpe Movil" | "Transfer" | "Cash";
  active: boolean;
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

**`types/settings.ts`**
```typescript
type ThemeMode = "system" | "light" | "dark";
type Language = "es" | "en";
type LanguageSource = "system" | "manual";

interface SettingsPreferences {
  language: Language;
  languageSource: LanguageSource;
  notificationsEnabled: boolean;
  reportCalculations?: ReportCalculationSettings; // comisión y gastos fijos
  themeMode: ThemeMode;
}
```

**`types/notifications.ts`** — Tipos de notificaciones generadas localmente (no push):
- `NotificationItem`: `{ id, title, body, effectiveDate, isRead, type, payload }`
- `NextDaySummaryPayload`: datos del resumen del día siguiente
- `DelayedClientSummaryPayload`: datos de cliente que no viene hace 30+ días

---

## 15. Utilidades (Utils)

**`utils/errors.ts`** — `getErrorMessage(error: unknown): string`
Extrae un mensaje legible de cualquier tipo de error (Error, string, objeto con `message`, etc.). Se usa en todos los catch blocks de la app.

**`utils/formatUtil.ts`** — Funciones de formateo:
- `formatCurrency(amount)` → formatea precios en CRC o USD
- `formatDate(date)` → fechas legibles
- Otras utilidades de display

**`utils/contactActions.ts`** — Acciones de contacto para un cliente:
- `callClient(phone)` → abre la app de teléfono con `Linking`
- `whatsappClient(phone, message?)` → abre WhatsApp con el número del cliente

---

## 16. Flujos principales end-to-end

### Flujo de Login

```
[LoginScreen]
  └── Ingresa usuario y contraseña
       └── authService.login()
            ├── POST /api/users/authentication/
            ├── Guarda ApplicationUser en expo-secure-store
            └── setUser(user) en useAuthStore
                 └── RootNavigator re-renderiza → DrawerNavigator
```

### Flujo de crear una cita

```
[CalendarScreen] → Botón "+" → navega a AppointmentFormScreen
[AppointmentFormScreen]
  ├── useAppointmentForm() maneja el estado del form
  ├── (Opcional) ClientSearchModal para asociar cliente
  └── submit()
       ├── appointmentService.create(draft)
       │    └── POST /api/appointments
       └── useAppointmentStore.addAppointment(draft)
            └── Agrega al store local y re-ordena
```

### Flujo de búsqueda de clientes

```
[ClientsScreen]
  ├── Usuario escribe en el input de búsqueda
  ├── (debounce) → clientsService.find(query, page, pageSize)
  │    └── GET /api/clients/search?query=...&page=1&pageSize=10
  └── Actualiza la lista con los resultados
```

### Flujo de cambio de idioma

```
[SettingsScreen] → Selector de idioma
  └── LanguageContext.setLanguage("en")
       ├── setI18nLanguage("en") → i18n activa "en"
       ├── Guarda en AsyncStorage: { language: "en", languageSource: "manual" }
       └── Todos los componentes con useTranslation() se re-renderizan
```

---

## 17. Patrones recurrentes a conocer

### Patrón de carga de datos en pantalla

```typescript
const isFocused = useIsFocused(); // recarga cuando se vuelve a la pantalla

useEffect(() => {
  if (isFocused) {
    loadData();
  }
}, [isFocused]);
```

### Patrón de normalización de respuesta API

Debido a que el backend puede devolver campos en PascalCase o camelCase:
```typescript
const id = (response.id ?? response.Id) as string;
const name = (response.name ?? response.Name) as string;
```

### Patrón de alias para namespace collision (TypeScript)

No aplica al frontend, pero si importas algo con nombre conflictivo:
```typescript
import type { Barber as BarberType } from "../types/barber";
```

### Patrón de guard en useEffect con cleanup

```typescript
useEffect(() => {
  let mounted = true;

  const load = async () => {
    const data = await fetchSomething();
    if (!mounted) return; // evita setState en componente desmontado
    setData(data);
  };

  void load();

  return () => { mounted = false; };
}, []);
```

### Patrón de manejo de errores en pantallas

```typescript
try {
  await someService.doSomething();
} catch (err) {
  showAlert("Error", getErrorMessage(err));
}
```

`getErrorMessage` (`utils/errors.ts`) siempre retorna un `string` legible independientemente del tipo de error.

---

## 18. Consideraciones Futuras

Esta sección documenta riesgos identificados en la arquitectura actual, áreas que requerirán cambios conforme el producto crezca, y deuda técnica conocida. El objetivo es que el equipo tenga visibilidad de los puntos de fricción antes de que se conviertan en errores en producción.

---

### 18.1 auth.store.ts — Gestión de sesión

#### Sin renovación automática de JWT (Refresh Token)

**Estado actual:** `apiClient.ts` intercepta respuestas `401` y fuerza el logout del usuario. No existe un mecanismo de refresh token.

**Riesgo:** Si el JWT tiene un tiempo de expiración corto (p.ej. 1 hora), el usuario puede ser desconectado en medio de una operación activa (creando una cita, editando un cliente). La experiencia es abrupta: la petición falla, el store se limpia, y el navegador redirige a `LoginScreen` sin aviso previo.

**Cambio necesario cuando aplique:**
1. El backend debe exponer un endpoint `POST /api/users/token/refresh` que reciba un refresh token y retorne un nuevo JWT.
2. `apiClient.ts` debe interceptar el 401, intentar el refresh, y reintentar la petición original antes de forzar el logout.
3. `authService.ts` debe guardar el refresh token (separado del JWT) en `expo-secure-store`.

---

#### auth.store.ts no persiste entre hot-reloads (comportamiento de desarrollo)

**Estado actual:** `useAuthStore` es un store Zustand sin middleware `persist`. La sesión se restaura desde `expo-secure-store` únicamente al montar `RootNavigator`. En desarrollo, los hot-reloads reinician el árbol de componentes pero no el módulo del store si ya fue evaluado, lo que puede causar estados inconsistentes.

**Impacto:** Comportamiento difícil de reproducir en tests de desarrollo. No es un bug en producción, pero puede generar confusión al depurar flujos de autenticación.

---

### 18.2 appointment.store.ts — Persistencia y caché

#### Sin versionado del esquema persistido en AsyncStorage

**Estado actual:** `appointment.store.ts` usa `zustand/middleware/persist` con `createJSONStorage(() => AsyncStorage)` sin configurar los campos `version` ni `migrate`.

```typescript
// Configuración actual — sin versión ni migración
{
  name: "barber-flow-appointments",
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ appointments: state.appointments }),
}
```

**Riesgo:** Si en el futuro se agrega, renombra o elimina un campo del tipo `Appointment`, los datos serializados en AsyncStorage en dispositivos de usuarios existentes pueden:
- Causar errores en TypeScript en runtime (propiedades `undefined` donde no se esperan)
- Producir comportamiento silenciosamente incorrecto (calcular comisiones con datos viejos)

**Cambio necesario cuando se modifique el tipo `Appointment`:**
```typescript
// Agregar version + migrate al persist
{
  name: "barber-flow-appointments",
  version: 2, // incrementar con cada cambio de esquema
  migrate: (persistedState: unknown, version: number) => {
    if (version === 1) {
      // transformar el estado viejo al nuevo formato
    }
    return persistedState;
  },
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ appointments: state.appointments }),
}
```

---

#### Datos fuera del rango no tienen expiración (stale data indefinido)

**Estado actual:** `fetchAppointmentsByDateRange` implementa un merge inteligente que preserva las citas que están fuera del rango solicitado:

```typescript
const outside = get().appointments.filter(
  (a) => a.date < startDate || a.date > endDate,
);
set({ appointments: sortAppointments([...outside, ...fetched]) });
```

**Riesgo:** Los datos de meses pasados (o futuros no visitados) pueden quedar en el store local sin actualizarse indefinidamente. Si otro dispositivo crea, modifica o cancela una cita en un rango que el usuario ya visitó pero no está volviendo a pedir, esos datos permanecen stale.

**Cambio recomendado:** Agregar un registro de `lastFetchedAt` por rango mes/semana. Si el rango ya fue fetched hace más de N horas (p.ej. 30 minutos), forzar un re-fetch en lugar de usar el caché local.

---

#### fetchAppointments sin manejo de error explícito

**Estado actual:** `fetchAppointments` usa `try/finally` sin `catch`, lo que significa que si la petición falla, el error se propaga al caller pero `isLoading` queda en `false`. El componente que invocó no necesariamente tiene acceso al error para mostrárselo al usuario.

**Cambio recomendado:** Agregar un campo `error: string | null` al estado del store para que los componentes puedan renderizar un estado de error en la UI sin tener que manejar el error localmente.

---

### 18.3 NotificationContext — Notificaciones locales vs. backend

#### refreshNotifications se ejecuta en cada cambio del array de citas

**Estado actual:** `NotificationContext` suscribe a `useAppointmentStore` con:
```typescript
const appointments = useAppointmentStore((state) => state.appointments);
```
Y define `refreshNotifications` con `useCallback([appointments])`. Esto significa que **cualquier cambio en cualquier cita** (incluyendo cambiar su status a "completed") dispara un recálculo completo de todas las notificaciones.

**Riesgo de performance:** Actualmente el cálculo es barato (2 tipos de notificaciones, array pequeño), pero si en el futuro se agregan más tipos de notificaciones con lógica compleja, este cálculo podría volverse costoso en dispositivos de gama baja.

**Mejora futura:** Agregar un debounce a `refreshNotifications` (p.ej. 500ms) para evitar re-cálculos múltiples cuando se actualizan varias citas en rápida sucesión (p.ej. al cargar un rango de fechas con `fetchAppointmentsByDateRange`).

---

#### Sistema de notificaciones no conectado al backend

**Estado actual:** `notificationService.ts` genera notificaciones **completamente en el frontend** a partir de los datos de citas locales. No existe una entidad `Notification` en el backend ni un repositorio correspondiente.

**Implicaciones cuando se implemente el backend de notificaciones:**
1. El `NotificationContext` tendrá que cambiar de leer AsyncStorage a llamar un endpoint del API.
2. El `notificationService.ts` necesitará una refactorización mayor: actualmente genera notificaciones, pero debería solo *consumirlas* desde el backend.
3. Las notificaciones locales guardadas en AsyncStorage (`"barber-flow-notifications"`) serán datos huérfanos — habrá que decidir si migrarlos o descartarlos.
4. El `unreadCount` del badge en el tab navigator deberá sincronizarse con el servidor para ser consistente entre dispositivos.

> **Recomendación:** Cuando se implemente `NotificationRepository` en el backend, considerar mover las notificaciones de `Context + AsyncStorage` a un Zustand store con `persist`, siguiendo el mismo patrón de `appointment.store.ts`. Esto facilitará la migración y mantendrá consistencia arquitectónica.

---

### 18.4 settingsService — Configuración del reporte

#### commissionPercentage y fixedDailyExpense viven solo en AsyncStorage

**Estado actual:** Los parámetros de cálculo del reporte diario (`commissionPercentage`, `fixedDailyExpense`) se guardan localmente en AsyncStorage via `settingsService.setReportCalculationSettings()`. Si el usuario instala la app en un dispositivo nuevo o borra el caché, pierde su configuración.

**Riesgo de divergencia:** Estos valores están **hardcodeados en el backend** (`InMemoryReportRepository.cs`) y no se sincronizan. Si el usuario cambia su comisión en la app, el reporte del frontend usa el valor nuevo, pero si algún día el backend generara reportes directamente, usaría el valor hardcodeado.

**Cambio necesario cuando se implemente `settings` en el documento `barbers`:**
1. `settingsService` deberá sincronizar `reportCalculations` con el endpoint del barbero (`PUT /api/barbers/update/{id}`).
2. Al cargar la app por primera vez en un dispositivo nuevo, deberá leer la configuración desde el backend (no solo AsyncStorage).
3. La lógica de `useDailyReport()` deberá ser revisada para usar los valores del backend como fuente de verdad.

---

### 18.5 Configuración de entorno y acceso de administrador

#### ADMIN_USERNAME como constante de compilación

**Estado actual:** `config.ts` exporta `ADMIN_USERNAME` — una constante hardcodeada que se usa para determinar si el usuario tiene acceso a la sección de gestión de usuarios de la app en `SettingsScreen`.

**Riesgo:** Si el nombre de usuario del administrador cambia, hay que recompilar y redistribuir la app. Además, esta lógica no escala: si en el futuro hay múltiples administradores o roles más granulares, la comparación de `userName === ADMIN_USERNAME` no es suficiente.

**Cambio recomendado:** Usar `user.role === "Admin"` del `ApplicationUser` (que ya viene del backend) como condición de acceso en lugar de comparar el nombre de usuario. El campo `role: string` ya existe en el tipo `ApplicationUser`.

---

#### BASE_URL con IP local hardcodeada para desarrollo

**Estado actual:** El fallback de desarrollo en `config.ts` apunta a `http://192.168.68.55:7016` (IP del desarrollador original). Cualquier nuevo desarrollador verá errores de conexión hasta que cambie esta IP manualmente.

**Mejora recomendada:** Documentar en el `README.md` que hay que configurar `BARBERFLOW_API_URL` en un archivo `.env.local` con la IP propia antes de correr la app. La variable de entorno ya tiene soporte en la lógica de resolución de `BASE_URL` — solo falta el instructivo.

---

### 18.6 Tipo ApplicationUser — Campo password

**Estado actual:** La interfaz `ApplicationUser` incluye el campo `password?: string` con una nota en la arquitectura indicando que no se almacena. Sin embargo, al ser parte del mismo tipo usado para persistir el usuario en `expo-secure-store`, existe el riesgo de incluirlo accidentalmente en una serialización futura.

**Mejora recomendada:** Separar los tipos en dos interfaces:
- `ApplicationUser` — solo los campos del usuario autenticado (sin `password`)
- `ApplicationUserCreateForm` (o similar) — incluye `password` solo para operaciones de creación/edición

Esto elimina la ambigüedad y hace que TypeScript ayude a prevenir que `password` llegue a donde no debe.

---

### 18.7 Resumen de cambios priorizados

| # | Área | Prioridad | Trigger |
|---|---|---|---|
| 1 | Versionado de esquema en `appointment.store.ts` (`version` + `migrate`) | **Alta** | Antes de cualquier cambio al tipo `Appointment` |
| 2 | Reemplazar `ADMIN_USERNAME` por verificación de `user.role` | **Alta** | Antes de agregar un segundo administrador |
| 3 | Migrar `commissionPercentage` / `fixedDailyExpense` al backend | **Media** | Cuando se implemente `settings` en `barbers` |
| 4 | Migrar `NotificationContext` a Zustand store | **Media** | Cuando se implemente `NotificationRepository` en el backend |
| 5 | Refresh token en `apiClient.ts` + `authService.ts` | **Media** | Cuando el JWT tenga vida corta en producción |
| 6 | Debounce en `refreshNotifications` | **Baja** | Cuando se agregen más tipos de notificaciones |
| 7 | Separar `password` fuera de `ApplicationUser` | **Baja** | En cualquier refactor del módulo de autenticación |
| 8 | Documentar `BARBERFLOW_API_URL` en README para nuevos devs | **Baja** | Cuando se incorpore un segundo desarrollador |

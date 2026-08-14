# 🏗️ Decisiones de Arquitectura - Barber Flow Web

## Tabla de Contenidos

1. [Clean Architecture](#clean-architecture)
2. [React + TypeScript](#react--typescript)
3. [Material Design 3](#material-design-3)
4. [Validación con Zod](#validación-con-zod)
5. [Custom Hooks](#custom-hooks)
6. [State Management](#state-management)
7. [Routing](#routing)
8. [HTTP Client](#http-client)

---

## Clean Architecture

### ¿Por qué Clean Architecture?

**Ventajas:**
- ✅ **Independencia de frameworks:** La lógica de negocio no depende de React
- ✅ **Testeable:** Cada capa puede ser testeada independientemente
- ✅ **Mantenible:** Fácil de entender y modificar
- ✅ **Escalable:** Añadir nuevas funcionalidades sin afectar código existente
- ✅ **Reusable:** La lógica de negocio puede ser compartida con otra UI (mobile, desktop, CLI)

### Estructura de Capas

```
┌─────────────────────────────────────────┐
│     PRESENTATION (React Components)     │ ← UI, Rutas, Context
├─────────────────────────────────────────┤
│   APPLICATION (Use Cases, DTOs)         │ ← Lógica de aplicación
├─────────────────────────────────────────┤
│  INFRASTRUCTURE (HTTP, Storage, APIs)   │ ← Detalles técnicos
├─────────────────────────────────────────┤
│    DOMAIN (Entities, Interfaces)        │ ← Reglas de negocio
└─────────────────────────────────────────┘
```

### Alternativas Consideradas

| Alternativa | Ventajas | Desventajas | Decisión |
|-------------|----------|------------|----------|
| **Clean Architecture** | Escalable, testeable, desacoplado | Más archivos inicialmente | ✅ ELEGIDA |
| **Atomic Design** | Visual, componentes pequeños | No separa lógica del negocio | ❌ No |
| **Feature-based** | Rápido para startups | Difícil de escalar | ❌ No |
| **MVC (Rails-like)** | Simple | Acoplamiento fuerte | ❌ No |

**Razón de la elección:** El proyecto necesita crecer, cambiar, y ser mantenible a largo plazo.

---

## React + TypeScript

### ¿Por qué React?

**Ventajas:**
- ✅ React es ideal para Barber Flow porque:
  - Conocimiento compartido con versión mobile (React Native)
  - Componentes reutilizables
  - Comunidad y ecosistema maduro
  - Excelente rendimiento
  - Herramientas de debugging

### ¿Por qué TypeScript (Strict Mode)?

```typescript
// ✅ TypeScript Strict Mode
{
  "strict": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "noImplicitAny": true
}
```

**Ventajas:**
- ✅ Detecta errores en tiempo de compilación (no runtime)
- ✅ Mejor autocompletar en IDE
- ✅ Documentación integrada en el código
- ✅ Refactoring seguro

**Ejemplo:**

```typescript
// ❌ Sin TypeScript - Error en runtime
const user = getUser();
console.log(user.name); // ¿Y si user es null?

// ✅ Con TypeScript - Error en compilación
const user: User | null = getUser();
console.log(user?.name); // ¿Y si user es null? ✅ TypeScript lo detecta
```

### React.FC vs Function Declaration

**Decisión:** Usar `React.FC<Props>` en vez de `function Component(props)`

```typescript
// ✅ PREFERIDO
export const LoginForm: React.FC = () => {
  return <form>...</form>;
};

// ❌ MENOS PREFERIDO (aunque válido)
export function LoginForm() {
  return <form>...</form>;
}
```

**Razón:** Mejor IntelliSense, consistencia en toda la base de código.

---

## Material Design 3

### ¿Por qué Material Design 3?

**Decisión:** Usar MUI v6 (Material-UI) en vez de otras librerías

| Framework | Ventajas | Desventajas |
|-----------|----------|------------|
| **MUI v6** | Certificado MD3, componentes rich, documentación excelente | Bundle size mayor |
| **shadcn/ui** | Bundle pequeño, customizable | Menos componentes pre-built |
| **TailwindCSS** | Muy customizable | Requiere escribir CSS |
| **Bootstrap** | Popular, rápido | Menos moderno |

**Razón de elección:**
- La app mobile usa React Native Paper (también Material Design)
- MUI v6 es certificado Material Design 3
- Garantiza parity visual entre web y mobile
- Componentes complejos listos (DataGrid, DatePicker, etc)

### Sistema de Temas

```typescript
// Light Theme
const lightTheme = createTheme({
  palette: {
    primary: { main: '#6750A4' },     // Purple
    secondary: { main: '#625B71' },   // Gray
  },
});

// Dark Theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#D0BCFF' },    // Light Purple
  },
});

// System Preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

---

## Validación con Zod

### ¿Por qué Zod en vez de otras librerías?

| Librería | Tipo-safe | Bundle Size | Documentación |
|----------|-----------|-------------|---------------|
| **Zod** | ✅ Excelente | 12kb | ⭐⭐⭐⭐⭐ |
| **Yup** | ⚠️ Básico | 13kb | ⭐⭐⭐⭐ |
| **Joi** | ✅ Bueno | 33kb | ⭐⭐⭐⭐ |
| **Valibot** | ✅ Excelente | 5kb | ⭐⭐⭐⭐ |

**Razón:** Zod es type-first, extremadamente seguro, y ampliamente adoptado en TypeScript.

### Ventajas de Zod

```typescript
// 1. Type inference automático
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0),
});

type User = z.infer<typeof schema>; // ✅ Type inferido automáticamente

// 2. Mensajes de error personalizados
const passwordSchema = z
  .string()
  .min(6, 'Mínimo 6 caracteres')
  .regex(/[A-Z]/, 'Debe tener mayúsculas');

// 3. Validación asincrónica
const emailSchema = z
  .string()
  .email()
  .refine(
    async (email) => !(await emailExists(email)),
    { message: 'Email ya en uso' }
  );

// 4. Validación en runtime
const result = schema.safeParse(data);
if (!result.success) {
  console.log(result.error.errors); // Error details
}
```

---

## Custom Hooks

### ¿Por qué Custom Hooks?

**Pattern:** Extraer lógica reutilizable a hooks

```typescript
// ❌ Lógica repetida en múltiples componentes
const LoginForm = () => {
  const [userName, setUserName] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // ... 50 líneas más de lógica de formulario
};

// ✅ Lógica extraída a hook reutilizable
const LoginForm = () => {
  const form = useForm(initialValues, schema);
  // ... 10 líneas más limpias
};
```

### Hooks Creados

#### 1. `useForm<T>`

```typescript
// Propósito: Centralizar lógica de formularios
// Features:
// - Validación automática
// - Manejo de touched fields
// - Clear errors al escribir
// - Reset
// - Integración con Zod

const form = useForm<LoginFormData>(initialValues, loginSchema);
```

#### 2. `useAsync<T>`

```typescript
// Propósito: Operaciones asincrónicas con estados
// Features:
// - Loading/error/success automático
// - Callbacks onSuccess/onError
// - Execute function genérica
// - Reset state

const { data, isLoading, error, execute } = useAsync(
  authApi.login
);
```

#### 3. `useApiError`

```typescript
// Propósito: Manejo centralizado de errores API
// Features:
// - Extrae mensajes de diferentes formatos
// - Errores por campo
// - Integración con notifications

const { handleError } = useApiError();
const errorInfo = handleError(error);
```

---

## State Management

### ¿Por qué Context API + Zustand?

**Decision Matrix:**

| Solución | Escalabilidad | Complejidad | Rendering |
|----------|---------------|------------|-----------|
| **Context API** | ⭐⭐ Media | ⭐ Simple | ⚠️ Re-renders frecuentes |
| **Zustand** | ⭐⭐⭐ Alta | ⭐⭐ Media | ✅ Optimizado |
| **Redux** | ⭐⭐⭐⭐ Máxima | ⭐⭐⭐ Compleja | ✅ Optimizado |
| **Recoil** | ⭐⭐⭐ Alta | ⭐⭐⭐ Compleja | ✅ Optimizado |

**Razón de la decisión:**

```typescript
// Context API para estado global, acceso compartido
// - AuthContext: usuario actual, login, logout
// - ThemeContext: modo claro/oscuro
// - NotificationContext: sistema de notificaciones

// Zustand preparado para futuro
// - Si crece la complejidad, migrar es fácil
// - Zustand es más pequeño (2.6kb vs Redux 13kb)
// - Excelente rendering performance
```

### ¿Cuándo usar cada uno?

```typescript
// 1. Context API - Para estado compartido simple/global
const { user } = useAuth(); // ✅ Auth context

// 2. useState - Para estado local del componente
const [isOpen, setIsOpen] = useState(false); // ✅ Drawer state

// 3. useForm - Para estado de formularios
const form = useForm(values, schema); // ✅ Form state

// 4. Zustand (futuro) - Para estado complejo/derivado
// const { appointments } = useAppointmentStore(); // TODO: Futuro
```

---

## Routing

### ¿Por qué React Router v7?

**Razones:**
- ✅ Standard de facto en comunidad React
- ✅ Excelente documentación
- ✅ v7 introduce renderizado basado en componentes
- ✅ Protected routes fáciles de implementar

### Estructura de Rutas

```typescript
<BrowserRouter>
  <Routes>
    {/* Rutas públicas */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    {/* Rutas protegidas */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <ProtectedLayout>
            <DashboardPage />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />
  </Routes>
</BrowserRouter>
```

### ProtectedRoute Implementation

```typescript
export const ProtectedRoute: React.FC = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
};
```

---

## HTTP Client

### ¿Por qué Axios?

| Cliente | Interceptors | Timeout | Cancelación | Tamaño |
|---------|-------------|---------|------------|--------|
| **Axios** | ✅ Built-in | ✅ | ✅ | 14kb |
| **Fetch API** | ❌ Manual | ✅ AbortController | ✅ | 0kb (built-in) |
| **SWR** | ✅ | ✅ | ✅ | 4kb |
| **React Query** | ✅ | ✅ | ✅ | 27kb |

**Razón de elección:**
- Interceptors automáticos para JWT
- Manejo consistente de errores
- Cancelación de requests
- Compatible con arquitectura limpia

### Implementación

```typescript
// 1. Interfaz abstracta
interface IHttpClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: any): Promise<T>;
  put<T>(url: string, data: any): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

// 2. Implementación con Axios
class AxiosHttpClient implements IHttpClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL });

    // Interceptor: Agregar JWT
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor: Manejar 401
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
}

// 3. Inyección en APIs
class AuthApi implements IAuthRepository {
  constructor(private httpClient: IHttpClient) {}

  async login(credentials: LoginRequest): Promise<AuthenticatedUser> {
    const response = await this.httpClient.post<UserResponse>(
      '/api/users/authentication',
      credentials
    );
    return this.mapToAuthenticatedUser(response);
  }
}
```

**Ventaja:** Si cambiamos de Axios a Fetch o SWR, solo cambiamos AxiosHttpClient, todo lo demás sigue funcionando.

---

## Resumen de Decisiones

| Aspecto | Tecnología | Por qué |
|--------|-----------|--------|
| **Arquitectura** | Clean Architecture | Escalabilidad, testabilidad, mantenibilidad |
| **Framework UI** | React 19 + TypeScript | Paridad con mobile, ecosistema, rendimiento |
| **UI Components** | MUI v6 | Material Design 3, parity con mobile |
| **Validación** | Zod | Type-safe, excelente DX |
| **State Global** | Context API + Zustand | Simpleza hoy, escalabilidad mañana |
| **Routing** | React Router v7 | Standard, excelente |
| **HTTP** | Axios | Interceptors, manejo de errores |
| **Bundler** | Vite | Speed, HMR, modern |
| **Estilos** | MUI sx prop + CSS-in-JS | Colocation, dynamic styling |

---

## Próximas Decisiones (Fases 3+)

- [ ] **Fecha/Hora:** date-fns vs Day.js vs Luxon
- [ ] **Tablas:** @tanstack/react-table vs MUI DataGrid
- [ ] **Gráficos:** Recharts vs Visx vs Chart.js
- [ ] **Notificaciones Real-time:** WebSockets vs Server-Sent Events
- [ ] **Testing E2E:** Cypress vs Playwright
- [ ] **Analytics:** Google Analytics vs Mixpanel

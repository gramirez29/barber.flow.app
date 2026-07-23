# 🎯 Mejores Prácticas de Desarrollo - Barber Flow Web

## 📋 Tabla de Contenidos
1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Patrones de Código](#patrones-de-código)
3. [Validación y Manejo de Errores](#validación-y-manejo-de-errores)
4. [Formularios](#formularios)
5. [Accesibilidad](#accesibilidad)
6. [Performance](#performance)
7. [Testing](#testing)

## Estructura del Proyecto

### Arquitectura Limpia (Clean Architecture)

El proyecto sigue una arquitectura de capas bien definida:

```
src/
├── domain/              # Reglas de negocio (entidades, interfaces)
│   ├── entities/        # Definición de datos
│   ├── interfaces/      # Contratos de servicios
│   └── types/           # Tipos específicos del dominio
├── application/         # Lógica de aplicación (use cases, DTOs)
│   ├── use-cases/       # Casos de uso encapsulados
│   └── dtos/            # Estructuras de datos (Requests/Responses)
├── infrastructure/      # Implementaciones técnicas (API, Storage)
│   ├── http/            # Cliente HTTP
│   ├── api/             # Implementaciones de API
│   └── storage/         # Persistencia local
├── presentation/        # Interfaz de usuario (React)
│   ├── components/      # Componentes reutilizables
│   ├── pages/           # Páginas/vistas
│   ├── hooks/           # Custom hooks
│   ├── context/         # Context API
│   ├── routes/          # Configuración de rutas
│   └── theme/           # Temas y estilos
└── shared/              # Código compartido
    ├── constants/       # Constantes globales
    ├── types/           # Tipos comunes
    ├── validation/      # Esquemas de validación
    ├── utils/           # Funciones utilitarias
    └── localization/    # i18n
```

### Ventajas de esta estructura:
- ✅ Separación clara de responsabilidades
- ✅ Fácil de testear (cada capa es independiente)
- ✅ Facilita cambios de tecnología (ej: cambiar HTTP client)
- ✅ Escalable para proyectos grandes

## Patrones de Código

### 1. Custom Hooks (useForm, useAsync, useApiError)

**Para formularios con validación:**
```typescript
const form = useForm<LoginFormData>(
  { userName: '', password: '' },
  loginSchema
);

// Usar en el componente
<FormTextField
  value={form.values.userName}
  onChange={(e) => form.setFieldValue('userName', e.target.value)}
  error={form.errors.userName}
  isTouched={form.touched.has('userName')}
/>
```

**Para operaciones asincrónicas:**
```typescript
const { data, isLoading, error, execute } = useAsync(
  (email) => authApi.sendOtp(email)
);

await execute('user@example.com');
```

**Para manejo de errores de API:**
```typescript
const { handleError } = useApiError();
try {
  await login();
} catch (err) {
  const { message, statusCode, errors } = handleError(err);
}
```

### 2. Componentes Funcionales con TypeScript

```typescript
interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  // Implementación
};
```

### 3. Context API para Estado Global

```typescript
// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

## Validación y Manejo de Errores

### 1. Validación con Zod

```typescript
// Definir esquema
export const loginSchema = z.object({
  userName: z
    .string()
    .min(1, 'El usuario es requerido')
    .min(3, 'Mínimo 3 caracteres'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'Mínimo 6 caracteres'),
});

// Usar en formularios
const isValid = await form.validate();
```

### 2. Manejo de Errores de API

```typescript
// Estructura esperada
interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Record<string, string>;  // Errores por campo
  statusCode?: number;
}

// Uso
try {
  await login(credentials);
} catch (err) {
  const { message, errors } = handleError(err);
  // Mostrar errores por campo
  Object.entries(errors).forEach(([field, error]) => {
    form.setFieldError(field, error);
  });
}
```

### 3. Estados de Carga y Error

```typescript
// En componentes
{isLoading && <Loading message="Iniciando sesión..." />}
{error && <Alert severity="error">{error}</Alert>}
{isSuccess && <Alert severity="success">¡Éxito!</Alert>}
```

## Formularios

### 1. Componente FormTextField

```typescript
<FormTextField
  id="email"
  label="Email"
  type="email"
  value={form.values.email}
  onChange={(e) => form.setFieldValue('email', e.target.value)}
  onBlur={() => form.setFieldTouched('email', true)}
  error={form.errors.email}          // Mensaje de error
  isTouched={form.touched.has('email')} // Mostrar solo si fue tocado
  disabled={isLoading}
  autoComplete="email"
/>
```

### 2. Validación en Tiempo Real

```typescript
const form = useForm(initialValues, schema);

// Al escribir: se limpia el error automáticamente
form.setFieldValue('email', newValue);

// Al salir del campo: validar
form.setFieldTouched('email', true);

// Antes de enviar: validar todo
const isValid = await form.validate();
```

### 3. Estados de Formulario

```typescript
form.isDirty      // Usuario modificó algo
form.touched      // Campos visitados
form.errors       // Errores de validación
form.isValidating // En proceso de validación
form.values       // Valores actuales
```

## Accesibilidad

### 1. ARIA Labels

```typescript
<FormTextField
  id="userName"
  aria-label="Usuario"
  aria-describedby={errors.userName ? 'userName-error' : undefined}
/>
```

### 2. Keyboard Navigation

```typescript
// Los componentes MUI soportan navegación por Tab
// Asegurar que los botones sean accesibles por Tab
<Button onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}>
  Enviar
</Button>
```

### 3. Mensajes de Error Accesibles

```typescript
{error && (
  <Alert 
    role="alert"
    aria-live="polite"
    severity="error"
  >
    {error}
  </Alert>
)}
```

## Performance

### 1. React.FC vs Function Declaration

```typescript
// Preferir React.FC para mejor IntelliSense
export const LoginForm: React.FC = () => {
  // ...
};
```

### 2. Memoización

```typescript
// Para callbacks frecuentes
const handleSubmit = useCallback(async (values) => {
  await login(values);
}, [login]);

// Para componentes costosos
export const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

### 3. Lazy Loading de Rutas

```typescript
const AppointmentsPage = React.lazy(() => import('./AppointmentsPage'));

<Suspense fallback={<Loading />}>
  <AppointmentsPage />
</Suspense>
```

## Testing

### 1. Estructura de Tests

```typescript
// src/components/__tests__/LoginForm.test.tsx

describe('LoginForm', () => {
  it('should validate email format', () => {
    // Arrange
    const { getByLabelText } = render(<LoginForm />);
    
    // Act
    fireEvent.change(getByLabelText('Usuario'), { target: { value: 'test' } });
    
    // Assert
    expect(getByLabelText('Usuario')).toHaveValue('test');
  });
});
```

### 2. Testing de Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useForm } from './useForm';

describe('useForm', () => {
  it('should validate form', async () => {
    const { result } = renderHook(() => 
      useForm({ email: '' }, schema)
    );

    act(() => {
      result.current.setFieldValue('email', 'invalid');
    });

    const isValid = await result.current.validate();
    expect(isValid).toBe(false);
  });
});
```

## 📝 Checklist para Nueva Funcionalidad

- [ ] Crear entidades/interfaces en `domain/`
- [ ] Crear DTOs en `application/dtos/`
- [ ] Crear use case en `application/use-cases/`
- [ ] Implementar API en `infrastructure/api/`
- [ ] Crear componentes en `presentation/components/`
- [ ] Crear página en `presentation/pages/`
- [ ] Agregar ruta en `presentation/routes/Router.tsx`
- [ ] Crear tests para componentes
- [ ] Crear tests para use cases
- [ ] Actualizar localization (es.json, en.json)
- [ ] Documentar cambios en README

## 🚀 Próximos Pasos Recomendados

1. **Integración con Backend:**
   - Verificar endpoints del API
   - Mapear respuestas a DTOs
   - Implementar retry logic

2. **Componentes Faltantes:**
   - Calendario de citas (FullCalendar)
   - Tablas de datos (DataGrid)
   - Formularios complejos

3. **Testing:**
   - Vitest configuration
   - Testing library setup
   - E2E testing con Cypress

4. **Performance:**
   - Code splitting
   - Image optimization
   - Bundle analysis

5. **Seguridad:**
   - CSRF protection
   - Rate limiting
   - Input sanitization

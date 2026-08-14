# Barber Flow Web

Aplicación web profesional de gestión de barbería construida con React 19, TypeScript, Material-UI v6 y arquitectura limpia.

## 🎯 Características

- ✅ **Autenticación JWT** con recuperación de contraseña
- ✅ **Material Design 3** con tema claro/oscuro
- ✅ **Arquitectura Limpia** para mejor mantenibilidad
- ✅ **Validación con Zod** en formularios
- ✅ **Custom Hooks** reutilizables (useForm, useAsync, useApiError)
- ✅ **TypeScript Strict Mode** para máxima seguridad de tipos
- ✅ **Internacionalización** (es/en)
- ✅ **Accesibilidad (a11y)** WCAG 2.1
- ✅ **Responsive Design** mobile-first

## 📚 Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Framework** | React | 19.1.0 |
| **Lenguaje** | TypeScript | 6.0.2 |
| **Bundler** | Vite | 6.1.0 |
| **UI Library** | Material-UI (MUI) | 6.2.0 |
| **Validación** | Zod | 3.23.8 |
| **Estado** | Zustand | 5.0.11 |
| **Routing** | React Router | 7.1.0 |
| **HTTP** | Axios | 1.7.7 |
| **Calendario** | FullCalendar | 6.1.14 |
| **Gráficos** | Recharts | 2.13.0 |
| **Localización** | react-i18next | 14.1.0 |

## 📦 Instalación

### Requisitos
- Node.js 18+ 
- npm o yarn

### Pasos

1. **Clonar y navegar al proyecto:**
```bash
cd barber-flow-web
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env.local
```

4. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

El navegador se abrirá automáticamente en [http://localhost:3000](http://localhost:3000)

## 🔧 Configuración de Entorno

Crea un archivo `.env.local`:

```env
# API
VITE_API_BASE_URL=http://localhost:7016
VITE_API_TIMEOUT=30000

# Aplicación
VITE_APP_ENV=development
VITE_APP_NAME=Barber Flow
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev           # Inicia servidor Vite con hot reload

# Build
npm run build         # Compila para producción (TypeScript + Vite)
npm run preview       # Previsualiza build de producción

# Calidad de código
npm run lint          # Ejecuta ESLint
npm run lint:fix      # Arregla errores ESLint automáticamente

# Testing
npm test              # Ejecuta pruebas con Vitest
npm run test:coverage # Coverage de pruebas
```

## 📁 Estructura del Proyecto

```
src/
├── domain/                    # Reglas de negocio
│   ├── entities/              # Definiciones de datos
│   ├── interfaces/            # Contratos de servicios
│   └── types/                 # Tipos específicos
├── application/               # Lógica de aplicación
│   ├── use-cases/             # Casos de uso encapsulados
│   ├── dtos/                  # Request/Response structures
│   └── mappers/               # Mappers entre capas
├── infrastructure/            # Implementaciones técnicas
│   ├── http/                  # Cliente HTTP (Axios)
│   ├── api/                   # Implementaciones de API
│   └── storage/               # Persistencia local
├── presentation/              # Interfaz de usuario
│   ├── components/            # Componentes reutilizables
│   ├── pages/                 # Páginas/vistas
│   ├── hooks/                 # Custom hooks
│   ├── context/               # Context API (Auth, Theme, Notifications)
│   ├── routes/                # Configuración de rutas
│   └── theme/                 # Tema Material Design 3
└── shared/                    # Código compartido
    ├── constants/             # Constantes globales
    ├── types/                 # Tipos comunes
    ├── validation/            # Esquemas Zod
    ├── utils/                 # Funciones utilitarias
    └── localization/          # Archivos i18n
```

## 🔐 Autenticación

### Flow de Login

```
Usuario → LoginForm
  ↓
useForm (validación Zod)
  ↓
LoginUseCase (business logic)
  ↓
AuthApi (HTTP POST /api/users/authentication)
  ↓
LocalStorageAuthStorage (guardar JWT)
  ↓
AuthContext (actualizar estado global)
  ↓
ProtectedRoute (otorgar acceso)
```

### Recuperación de Contraseña

1. **Solicitar código:** Usuario ingresa email
2. **Verificar OTP:** Sistema envía código a email
3. **Cambiar contraseña:** Usuario ingresa nueva contraseña
4. **Reset exitoso:** Redirige a login

## 🎨 Temas y Personalización

### Cambiar Tema

```typescript
import { useThemeContext } from '@presentation/context/ThemeContext';

const { mode, setMode } = useThemeContext();
setMode('dark');  // 'light' | 'dark' | 'system'
```

### Material Design 3

El proyecto implementa Material Design 3 con colores certificados:

- **Primary:** #6750A4 (Purple)
- **Secondary:** #625B71 (Gray)
- **Tertiary:** #7D5260 (Rose)

Tema disponible en `src/presentation/theme/theme.ts`

## 🌍 Internacionalización

### Agregar Traducción

1. Editar `src/shared/localization/es.json` y `en.json`
2. Usar en componentes:

```typescript
import { useTranslation } from 'react-i18next';

export const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('common.welcome')}</h1>;
};
```

## ✅ Validación de Formularios

El proyecto utiliza **Zod** para validación type-safe:

```typescript
import { useForm } from '@presentation/hooks';
import { loginSchema } from '@shared/validation/authSchemas';

const form = useForm({ userName: '', password: '' }, loginSchema);

// Validación automática
const isValid = await form.validate();
```

### Esquemas Disponibles

- `loginSchema` - Validación de login
- `forgotPasswordSchema` - Validación de email
- `verifyOtpSchema` - Validación de OTP
- `resetPasswordSchema` - Validación de contraseña nueva

## 🧪 Testing

El proyecto está configurado con **Vitest**:

```bash
# Ejecutar tests
npm run test

# Ver coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📱 Responsive Design

El proyecto es **mobile-first** con breakpoints de MUI:

```typescript
sx={{
  fontSize: { xs: '12px', sm: '14px', md: '16px' },
  padding: { xs: 2, md: 4 },
}}
```

## 🐳 Docker

### Build de imagen

```bash
docker build -t barber-flow-web .
```

### Ejecutar contenedor

```bash
docker run -p 3000:3000 barber-flow-web
```

### Docker Compose

```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://api:7016
```

## 📝 Mejores Prácticas

Consulta [DEVELOPMENT_BEST_PRACTICES.md](./DEVELOPMENT_BEST_PRACTICES.md) para:

- Estructura de componentes
- Patrones de código
- Validación y manejo de errores
- Accesibilidad
- Performance
- Testing

## 🔗 Integración con Backend

El backend se ejecuta en `http://localhost:7016`

**Endpoints principales:**

```
POST   /api/users/authentication      # Login
POST   /api/auth/forgot-password      # Solicitar OTP
POST   /api/auth/verify-otp           # Verificar OTP
POST   /api/auth/reset-password       # Cambiar contraseña
GET    /api/appointments/search       # Citas
GET    /api/clients                   # Clientes
GET    /api/reports/daily             # Reportes
```

## 🚧 Próximas Fases

- [ ] **Fase 3:** Calendario de citas con FullCalendar
- [ ] **Fase 4:** Gestión de clientes CRUD
- [ ] **Fase 5:** Reportes con Recharts
- [ ] **Fase 6:** Settings y preferencias de usuario
- [ ] **Fase 7:** Notificaciones en tiempo real
- [ ] **Fase 8:** E2E testing con Cypress

## 📦
npm run test
npm run test:ui
```

## Linting

```bash
npm run lint
```

## Estructura del Proyecto

```
src/
├── domain/              # Lógica de negocio pura (entities, interfaces)
├── application/         # Casos de uso (use cases, DTOs, mappers)
├── infrastructure/      # Implementaciones (API client, HTTP, storage)
├── presentation/        # React (components, pages, hooks, context)
├── shared/              # Utilidades compartidas (constants, utils, i18n)
└── App.tsx              # Entrada principal
```

## Guía de Desarrollo

### Agregar una Nueva Feature

1. **Domain Layer**: Define interfaces y tipos
2. **Application Layer**: Implementa use cases y DTOs
3. **Infrastructure Layer**: Crea el API client
4. **Presentation Layer**: Desarrolla componentes React

### Ejemplo: Nueva API Call

```typescript
// 1. domain/interfaces/IUserRepository.ts
export interface IUserRepository {
  getUser(id: string): Promise<User>;
}

// 2. application/use-cases/GetUserUseCase.ts
export class GetUserUseCase {
  constructor(private repository: IUserRepository) {}
  async execute(id: string): Promise<User> {
    return this.repository.getUser(id);
  }
}

// 3. infrastructure/api/UserApi.ts
export class UserApi implements IUserRepository {
  async getUser(id: string): Promise<User> {
    return this.httpClient.get(`/users/${id}`);
  }
}

// 4. presentation/hooks/useUser.ts
export const useUser = (id: string) => {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const useCase = new GetUserUseCase(userApi);
    useCase.execute(id).then(setUser);
  }, [id]);
  return user;
};
```

## Licencia

Propietario

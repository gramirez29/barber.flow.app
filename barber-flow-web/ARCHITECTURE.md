# Arquitectura — Barber Flow Web

Documento de referencia técnica para entender cómo está construida esta aplicación, con qué tecnologías, y cómo publicarla en distintos ambientes. Complementa (no reemplaza) al `CLAUDE.md` raíz del monorepo y al `CLAUDE.md` de este subproyecto, que llevan la bitácora de trabajo día a día.

> Este documento describe el estado **real** del código al momento de escribirlo, verificado contra `package.json`, `vite.config.ts`, `tsconfig.json`, el `Dockerfile` y los workflows de GitHub Actions existentes — no es una lista de intenciones.

---

## Tabla de contenidos

1. [Resumen del proyecto](#1-resumen-del-proyecto)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura del código (Clean Architecture)](#3-arquitectura-del-código-clean-architecture)
4. [Flujo de datos de una feature](#4-flujo-de-datos-de-una-feature)
5. [Patrones y convenciones clave](#5-patrones-y-convenciones-clave)
6. [Variables de entorno](#6-variables-de-entorno)
7. [Desarrollo local](#7-desarrollo-local)
8. [Publicación en 3 ambientes: Desarrollo, Testing y Producción](#8-publicación-en-3-ambientes-desarrollo-testing-y-producción)
9. [Checklist de lo que se necesita](#9-checklist-de-lo-que-se-necesita)
10. [Comandos de referencia rápida](#10-comandos-de-referencia-rápida)
11. [Lecturas recomendadas para profundizar](#11-lecturas-recomendadas-para-profundizar)

---

## 1. Resumen del proyecto

`barber-flow-web` es la aplicación web (React + TypeScript, servida con Vite) de un sistema de gestión para barberías. Es uno de **tres proyectos independientes** en el mismo monorepo que hablan con la misma API:

| Proyecto | Tecnología | Rol |
|---|---|---|
| `barber-flow-api/` | .NET 9 + MongoDB | Backend / API REST, autenticación JWT |
| `barber-flow-mobile/` | React Native (Expo) | App móvil, referencia de UX/paridad visual |
| `barber-flow-web/` | React + TypeScript + Vite | **Este proyecto** — panel web para administradores y barberos |

La web replica pantalla por pantalla el "look and feel" de la app mobile (mismos colores, tipografía, íconos y estructura), pero con una capa de arquitectura más explícita (Clean Architecture) que la app mobile, que usa un patrón feature-folder más simple.

---

## 2. Stack tecnológico

### Núcleo

| Tecnología | Versión (en uso) | Para qué se usa | Documentación |
|---|---|---|---|
| [React](https://react.dev/) | 19.1 | Librería de UI | [react.dev/learn](https://react.dev/learn) |
| [TypeScript](https://www.typescriptlang.org/) | ~6.0 (modo `strict`) | Tipado estático | [typescriptlang.org/docs](https://www.typescriptlang.org/docs/) |
| [Vite](https://vite.dev/) | 6.1 | Bundler / dev server / build | [vite.dev/guide](https://vite.dev/guide/) |
| [React Router](https://reactrouter.com/) | v7 | Enrutamiento SPA | [reactrouter.com/en/main](https://reactrouter.com/en/main) |

### UI

| Tecnología | Versión | Para qué se usa | Documentación |
|---|---|---|---|
| [MUI (Material UI) v6](https://mui.com/material-ui/) | 6.2 | Librería de componentes, sistema de diseño Material Design 3 | [mui.com/material-ui/getting-started](https://mui.com/material-ui/getting-started/) |
| [@emotion/react](https://emotion.sh/) | 11.14 | Motor CSS-in-JS que usa MUI internamente (`sx` prop) | [emotion.sh/docs/introduction](https://emotion.sh/docs/introduction) |
| [@mui/icons-material](https://mui.com/material-ui/material-icons/) | 6.2 | Set de íconos Material | [mui.com/material-ui/material-icons](https://mui.com/material-ui/material-icons/) |

> Elegido para mantener paridad visual con la app mobile, que usa React Native Paper (también Material Design). Ver `ARCHITECTURE_DECISIONS.md` para el detalle de por qué se descartaron shadcn/ui, TailwindCSS y Bootstrap.

### Datos, validación y formularios

| Tecnología | Versión | Para qué se usa | Documentación |
|---|---|---|---|
| [Axios](https://axios-http.com/) | 1.7 | Cliente HTTP (interceptores para JWT y manejo de 401) | [axios-http.com/docs/intro](https://axios-http.com/docs/intro) |
| [Zod](https://zod.dev/) | 3.23 | Validación de esquemas + inferencia de tipos | [zod.dev](https://zod.dev/) |
| [date-fns](https://date-fns.org/) | 4.1 | Manipulación de fechas (calendario, reportes) | [date-fns.org/docs](https://date-fns.org/docs/Getting-Started) |

Los formularios **no** usan una librería externa (no hay React Hook Form ni Formik) — se resuelven con un hook propio, `useForm` (`src/presentation/hooks/useForm.ts`), que integra Zod para validar.

### Internacionalización (configurada, no conectada a la UI todavía)

| Tecnología | Versión | Documentación |
|---|---|---|
| [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) | 23.8 / 14.1 | [react.i18next.com/getting-started](https://react.i18next.com/getting-started) |

Los diccionarios existen en `src/shared/localization/{es,en}.json`, pero hoy la UI está hardcodeada en español — es deuda técnica documentada en `CLAUDE.md`.

### Otras dependencias presentes

| Tecnología | Uso actual |
|---|---|
| [Zustand](https://zustand.docs.pmnd.rs/) | Instalada, pensada para estado complejo/derivado a futuro — hoy el estado global real vive en React Context (`AuthContext`, `ThemeContext`, `NotificationContext`, `AdminAccessContext`, `NotificationInboxContext`, `ConfirmDialogContext`). |
| [Recharts](https://recharts.org/) | Disponible para gráficos, sin uso activo confirmado en las pantallas actuales de Reportes (que usan tarjetas de métricas, no charts). |
| [uuid](https://github.com/uuidjs/uuid) | Generación de identificadores en cliente donde haga falta. |

### Testing (configurado, sin suite todavía)

| Tecnología | Versión | Documentación |
|---|---|---|
| [Vitest](https://vitest.dev/) | 2.1 | [vitest.dev/guide](https://vitest.dev/guide/) |
| [Testing Library (React)](https://testing-library.com/docs/react-testing-library/intro/) | 16.1 | [testing-library.com/docs/react-testing-library/intro](https://testing-library.com/docs/react-testing-library/intro/) |

`npm test` corre Vitest correctamente, pero **no existe ningún archivo `*.test.*` en el proyecto todavía** — es la misma deuda que tiene la app mobile con Jest. `vitest.config.ts` tampoco existe (Vitest toma su configuración base de `vite.config.ts`).

### Calidad de código

| Herramienta | Versión | Uso |
|---|---|---|
| [ESLint](https://eslint.org/) | 9.15 (flat config) | `npm run lint` — `--max-warnings 0`, se trata cualquier warning como error |
| [typescript-eslint](https://typescript-eslint.io/) | 8.10 | Reglas de lint específicas de TS |

---

## 3. Arquitectura del código (Clean Architecture)

El proyecto sigue Clean Architecture con dependencias apuntando siempre hacia adentro: `presentation → application → domain`, con `infrastructure` implementando los contratos que define `domain`.

```
┌──────────────────────────────────────────────┐
│  PRESENTATION   React: componentes, páginas,  │
│                 hooks, Context, rutas, tema   │
├──────────────────────────────────────────────┤
│  APPLICATION    Casos de uso, DTOs            │
│                 (sin dependencia de React)    │
├──────────────────────────────────────────────┤
│  INFRASTRUCTURE HTTP client, APIs concretas,  │
│                 storage local                 │
├──────────────────────────────────────────────┤
│  DOMAIN         Entidades, interfaces de      │
│                 repositorio — sin deps        │
└──────────────────────────────────────────────┘
```

### Estructura real de carpetas (`src/`)

```
src/
├── domain/                  Reglas de negocio, sin dependencias externas
│   ├── entities/            Appointment, Client, Barber, User, Report...
│   ├── interfaces/          IAuthRepository, IClientRepository, IAppointmentRepository...
│   └── types/
│
├── application/             Casos de uso y DTOs (sin React)
│   ├── use-cases/
│   │   ├── auth/            LoginUseCase, LogoutUseCase, ForgotPasswordUseCase...
│   │   ├── appointments/
│   │   ├── clients/
│   │   └── reports/
│   ├── dtos/
│   │   ├── requests/        Formas de los payloads que salen hacia el backend
│   │   └── responses/       Formas de las respuestas que llegan del backend
│   └── mappers/
│
├── infrastructure/          Detalles técnicos, implementan los contratos de domain/
│   ├── http/                AxiosHttpClient (única pieza que conoce Axios)
│   ├── api/                 AuthApi, ClientApi, AppointmentApi, BarberApi, ReportApi...
│   └── storage/             LocalStorageAuthStorage
│
├── presentation/            Todo lo que es React
│   ├── components/          Organizados por feature: appointments/, clients/, dashboard/,
│   │                        notifications/, reports/, settings/, auth/, shared/
│   ├── pages/                Una página por ruta (DashboardPage, ClientsPage...)
│   ├── hooks/                useForm, useAppointments, useClients, useBarbers...
│   ├── context/              AuthContext, ThemeContext, NotificationContext (toasts),
│   │                        AdminAccessContext, NotificationInboxContext, ConfirmDialogContext
│   ├── routes/                Router.tsx — define todas las rutas
│   └── theme/                 appColors.ts, scrollbarSx.ts
│
├── shared/                   Código transversal, sin pertenecer a ninguna capa de negocio
│   ├── constants/
│   ├── types/
│   ├── validation/            Esquemas Zod
│   ├── utils/                 formatters, errorUtils, notificationService (cómputo de notificaciones)
│   └── localization/          es.json / en.json (i18next, no conectado a la UI aún)
│
└── assets/                    Imágenes (hero de fondo, etc.)
```

### Alias de importación

Configurados tanto en `tsconfig.json` como en `vite.config.ts` (deben mantenerse sincronizados si se agrega uno nuevo):

| Alias | Apunta a |
|---|---|
| `@/*` | `src/*` |
| `@domain/*` | `src/domain/*` |
| `@application/*` | `src/application/*` |
| `@infrastructure/*` | `src/infrastructure/*` |
| `@presentation/*` | `src/presentation/*` |
| `@shared/*` | `src/shared/*` |

---

## 4. Flujo de datos de una feature

Ejemplo real: cargar la lista de clientes en `ClientsPage`.

```
ClientsPage (presentation/pages)
    │  usa
    ▼
useClients() (presentation/hooks)
    │  crea internamente
    ▼
new ClientApi(new AxiosHttpClient())   (infrastructure/api + infrastructure/http)
    │  implementa
    ▼
IClientRepository (domain/interfaces)  ← contrato que domain define y application/infrastructure respetan
    │  llamada HTTP real
    ▼
Backend .NET  →  GET /api/clients/search
    │
    ▼
ClientResponse (application/dtos/responses)  →  mapeado a  →  Client (domain/entities)
```

Al agregar una funcionalidad nueva, el orden recomendado (documentado también en `CLAUDE.md`) es:

1. **`domain/`** — entidad + interfaz de repositorio.
2. **`application/`** — DTOs (`requests`/`responses`) + caso de uso si aplica.
3. **`infrastructure/`** — implementación concreta de la API (`XxxApi.ts` implementando la interfaz de `domain`).
4. **`presentation/`** — hook (`useXxx`) → componentes → página → registrar la ruta en `Router.tsx`.
5. Actualizar `shared/localization/{es,en}.json` si hay texto nuevo (aunque hoy solo `es` está conectado).

`AxiosHttpClient` es la **única** pieza del código que sabe que existe Axios — todo lo demás depende de la interfaz `HttpClient` (`infrastructure/http/HttpClient.ts`). Cambiar de librería HTTP en el futuro implica tocar un solo archivo.

---

## 5. Patrones y convenciones clave

- **Componentes**: siempre `React.FC<Props>`, nunca `function Component(props)`.
- **Formularios**: hook `useForm<T>(initialValues, zodSchema)` — expone `values`, `errors`, `touched`, `setFieldValue`, `setFieldTouched`, `validate()`, `reset()`. No hay una librería externa de formularios.
- **Diálogos de confirmación**: `useConfirmDialog()` (`ConfirmDialogContext`) — `confirm({ title, message, confirmText, cancelText, destructive, hideCancel })` devuelve una `Promise<boolean>`. Reemplaza cualquier uso de `window.confirm`/`window.alert` nativo del navegador.
- **Notificaciones tipo toast**: `useNotification()` (`NotificationContext`) — **ojo**, no confundir con `NotificationInboxContext` (la bandeja de notificaciones de negocio de `/notifications`, cómputo derivado de citas/clientes sin backend propio).
- **Tema visual**: todos los colores salen de `presentation/theme/appColors.ts` (paleta oscura/dorada) — nunca colores hardcodeados sueltos ni los defaults de MUI. Scrollbars custom vía `presentation/theme/scrollbarSx.ts`, reutilizado en modales y en el Drawer.
- **Autenticación**: JWT guardado en `localStorage` (`LocalStorageAuthStorage`), adjuntado por un interceptor de request en `AxiosHttpClient` (cada hook crea su propia instancia de `AxiosHttpClient`, por eso el token se lee de `localStorage` en cada instancia en vez de configurarse una sola vez). Interceptor de response redirige a `/login` ante un `401`.
- **Rutas protegidas**: `ProtectedRoute` (requiere sesión) y `OperationalRoute` (además bloquea Citas/Clientes/Reportes/Notificaciones cuando el usuario es Admin con "Modo Seguro" activo — ver `AdminAccessContext`).
- **Errores de API**: `shared/utils/errorUtils.ts` (`getErrorMessage`) centraliza la extracción de mensajes de error consistentemente.

---

## 6. Variables de entorno

Definidas con prefijo `VITE_` (requisito de Vite para exponerlas al bundle del cliente — **nunca poner secretos reales acá**, terminan en el JavaScript público).

| Variable | Ejemplo (`.env.example`) | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:7016` | URL base del backend .NET |
| `VITE_API_TIMEOUT` | `30000` | Timeout de Axios en ms |
| `VITE_APP_ENV` | `development` | Etiqueta informativa del ambiente actual |
| `VITE_PRIVACY_POLICY_URL` | *(opcional)* | Usada por `AboutCard`/`Footer`; si no se define, cae a una URL por defecto hardcodeada en el código |

Archivos: `.env.example` (plantilla versionada) → copiar a `.env.local` (ignorado por git) para desarrollo local. Vite carga automáticamente `.env.local`, `.env.[modo]`, etc. — ver [la guía oficial de env vars de Vite](https://vite.dev/guide/env-and-mode.html).

---

## 7. Desarrollo local

Requisitos: **Node.js 20+** (el `Dockerfile` usa `node:20-alpine`) y el backend corriendo en paralelo (ver `CLAUDE.md` raíz para levantar `barber-flow-api` con MongoDB).

```bash
cd barber-flow-web
cp .env.example .env.local        # ajustar VITE_API_BASE_URL si el backend no está en localhost:7016
npm install
npm run dev                       # Vite dev server, puerto 3000 (auto-incrementa si está ocupado)
```

Antes de dar por terminado cualquier cambio:

```bash
npm run lint                      # ESLint, 0 warnings tolerados
npm run build                     # tsc -b && vite build — valida tipos y que el build de producción compile
npm test                          # Vitest (hoy no hay specs, pero corre limpio)
```

---

## 8. Publicación en 3 ambientes: Desarrollo, Testing y Producción

### Diagnóstico del estado actual del repo (importante, léase antes de seguir)

Hoy conviven **dos configuraciones de CI/CD distintas** en el monorepo, y vale la pena que quede explícito para no asumir que ambas están activas de la misma forma:

1. **`.github/workflows/dotnet-develop-api.yml`** — únicamente para el **backend**. Compila el `.csproj` y despliega a **Railway** (`railway up --service barber.flow.app --environment develop`) en cada push a `main` o `develop`. Esto confirma que **Railway es la plataforma real** que ya se usa para este proyecto (coincide con lo que dice el `CLAUDE.md` raíz).
2. **`.github/workflows/ci-cd.yml`** — pipeline más genérico que compila y testea **frontend y backend**, construye imágenes Docker para ambos (`barber-flow-web/Dockerfile` y `barber-flow-api/.../Dockerfile`) y las publica en GitHub Container Registry, y en el job `deploy` las lleva a un servidor propio vía SSH + `docker-compose.prod.yml`. **Este workflow no tiene ningún paso equivalente al de Railway para la web** — construye la imagen Docker de `barber-flow-web` pero no hay evidencia en el repo de que ese despliegue SSH esté configurado con un host real hoy (depende de secrets `DEPLOY_KEY`/`DEPLOY_HOST`/`DEPLOY_USER`/`DEPLOY_PATH` que hay que verificar si existen en GitHub).

**Recomendación de esta guía:** dado que Railway ya es la plataforma confirmada para el backend, la forma más simple y consistente de tener los 3 ambientes es desplegar **también la web en Railway** (usando el `Dockerfile` que ya existe en `barber-flow-web/`), en vez de mantener dos rutas de despliegue distintas. Se documenta esa ruta abajo; la alternativa Docker Compose + SSH queda mencionada como plan B si en algún momento se prefiere infraestructura propia.

### Los 3 ambientes

| Ambiente | Propósito | Rama sugerida | Dónde corre |
|---|---|---|---|
| **Desarrollo** | Trabajo diario de cada dev | cualquier rama de feature / `develop` | Máquina local (`npm run dev`) + backend local |
| **Testing / Staging** | Validar antes de producción, QA, demos | `develop` | Railway, servicio separado, apuntando a una base de datos de staging |
| **Producción** | Versión que usan los usuarios reales | `main` | Railway, servicio separado, apuntando a la base de datos de producción |

#### 8.1 Ambiente de Desarrollo

Ya cubierto en la [sección 7](#7-desarrollo-local) — corre 100% local, sin necesidad de infraestructura cloud. Cada developer usa su propio `.env.local` apuntando a su backend local (o, si se prefiere, al backend de Testing si no se quiere levantar el backend localmente).

#### 8.2 Ambiente de Testing / Staging (Railway)

1. **Crear el proyecto en Railway** (si no existe todavía uno compartido): [railway.app/new](https://railway.app/new) → "Empty Project".
2. **Agregar un servicio para la web** apuntando a este monorepo:
   - "New Service" → "GitHub Repo" → seleccionar el repo → **Root Directory: `barber-flow-web`** (importante, es un monorepo).
   - Railway detecta el `Dockerfile` existente automáticamente (build con Nixpacks también funcionaría, pero ya hay un `Dockerfile` dedicado — usarlo evita ambigüedad).
3. **Configurar el ambiente**: Railway soporta "Environments" nativos (Settings del proyecto → Environments → crear uno llamado `staging` además del `production` por defecto). Esto permite tener variables y dominios distintos por ambiente dentro del mismo proyecto.
4. **Variables de entorno del servicio** (Settings → Variables), ambiente `staging`:
   - `VITE_API_BASE_URL` → la URL pública del backend de staging (el servicio de `barber-flow-api` con `--environment develop` en Railway, que es justamente el que ya despliega `dotnet-develop-api.yml`).
   - `VITE_APP_ENV=staging`
   - `VITE_API_TIMEOUT=30000`
   - `VITE_PRIVACY_POLICY_URL` si se quiere sobreescribir el default.

   > Nota: como `VITE_*` se resuelven en **build time** (quedan embebidas en el JS generado por `vite build`), hay que asegurarse de que Railway las inyecte *antes* de correr `npm run build` dentro del `Dockerfile` — Railway las expone automáticamente como variables de entorno del contenedor de build, así que funciona sin cambios adicionales al `Dockerfile` actual.
5. **CORS en el backend**: el backend de staging debe incluir el dominio público que Railway le asigne a este servicio web en su configuración de `CORS_ALLOWED_ORIGINS` (ver `docker-compose.prod.yml` como referencia del nombre de la variable usada en el backend).
6. **Dominio**: Railway genera un dominio `*.up.railway.app` automáticamente al hacer "Generate Domain" en el servicio; opcionalmente conectar un subdominio propio (p. ej. `staging.barberflow.app`) vía Settings → Networking → Custom Domain (requiere agregar un registro `CNAME` en el proveedor de DNS).
7. **Despliegue automático**: Settings → Deploy Triggers → conectar la rama `develop` para que cada push la redeploye automáticamente (equivalente a lo que ya hace `dotnet-develop-api.yml` para el backend). Alternativa: agregar un job de GitHub Actions nuevo, gemelo a `dotnet-develop-api.yml` pero para `barber-flow-web` (mismo patrón: `railway up --service <nombre-del-servicio-web> --environment develop`), si se prefiere que el pipeline corra lint/build/test antes de desplegar en vez de dejar que Railway construya directo desde el push.

#### 8.3 Ambiente de Producción (Railway)

Mismos pasos que Testing/Staging, con estas diferencias:

1. Usar el ambiente `production` de Railway (o un proyecto separado, si se prefiere aislar completamente Testing de Producción — más seguro, evita que un error de configuración en staging afecte producción).
2. Variables de entorno apuntando al backend de **producción** (`--environment production` en el equivalente del workflow de Railway del backend) y `VITE_APP_ENV=production`.
3. Dominio público real (p. ej. `app.barberflow.app` o el dominio comercial que se defina) vía Custom Domain, con el `CNAME` correspondiente.
4. Disparador de deploy: la rama `main`, no `develop` — replicar el mismo patrón que ya usa `dotnet-develop-api.yml` pero apuntando `--environment production` cuando la rama sea `main`.
5. **Antes del primer deploy a producción**: correr manualmente `npm run lint && npm run build` localmente (o confirmar que el pipeline de CI lo hace) para no descubrir errores de tipos/lint recién en el build de Railway.

#### 8.4 Plan B — Docker Compose + servidor propio

Si en algún momento se prefiere no depender de Railway (por costo, por requisitos de infraestructura propia, etc.), el repo ya trae lo necesario para ese camino alternativo:

- `barber-flow-web/Dockerfile` — build multi-stage (Node 20 para compilar, sirve el `dist/` estático con el paquete `serve` en el puerto 3000).
- `docker-compose.prod.yml` (raíz del monorepo) — orquesta MongoDB + API + Web en un solo `docker-compose up`, pensado para un único host con Docker instalado.
- `.github/workflows/ci-cd.yml` — ya construye y publica las imágenes en `ghcr.io` y tiene el job `deploy` armado para conectarse por SSH y correr `docker-compose -f docker-compose.prod.yml pull && up -d`.

Para activar este camino haría falta: un servidor (VPS) con Docker y Docker Compose instalados, acceso SSH, y configurar en GitHub (Settings → Secrets and variables → Actions) los secrets `DEPLOY_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH` que el workflow ya espera encontrar.

---

## 9. Checklist de lo que se necesita

### Para desarrollo local
- [ ] Node.js 20+ y npm instalados.
- [ ] Backend (`barber-flow-api`) corriendo localmente o accesible (MongoDB + .NET 9 SDK si se corre local — ver `CLAUDE.md` raíz).
- [ ] `.env.local` creado a partir de `.env.example`.

### Para Testing/Staging y Producción en Railway (ruta recomendada)
- [ ] Cuenta de [Railway](https://railway.app/) con acceso al proyecto (o crear uno nuevo).
- [ ] Repositorio de GitHub conectado a Railway (permisos de lectura sobre el monorepo).
- [ ] Un servicio de Railway por ambiente para la web (Testing y Producción, idealmente también separados para el backend y para MongoDB si no se usa un Atlas gestionado).
- [ ] Backend de staging y de producción ya desplegados y con URL pública conocida (dependencia directa: `VITE_API_BASE_URL`).
- [ ] `RAILWAY_TOKEN` generado (Railway → Account Settings → Tokens) y guardado como secret en GitHub si se automatiza el deploy vía Actions (mismo patrón que `dotnet-develop-api.yml`).
- [ ] Variables `VITE_API_BASE_URL`, `VITE_APP_ENV`, `VITE_API_TIMEOUT` configuradas por ambiente en Railway.
- [ ] CORS del backend actualizado con el dominio público de cada ambiente web.
- [ ] Dominio(s) personalizados (opcional) + registros DNS (`CNAME`) apuntando a Railway.
- [ ] Certificado SSL — Railway lo gestiona automáticamente para dominios `*.up.railway.app` y para dominios propios verificados, no requiere configuración manual.

### Para el plan B (Docker Compose + servidor propio)
- [ ] Servidor Linux (VPS) con Docker + Docker Compose instalados.
- [ ] Acceso SSH con una key dedicada para despliegue.
- [ ] Secrets de GitHub Actions: `DEPLOY_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`.
- [ ] Reverse proxy / SSL en el servidor (el `docker-compose.prod.yml` actual expone puertos directos, sin Nginx/Caddy ni TLS — habría que agregarlo antes de exponer esto públicamente en producción).
- [ ] Valores por defecto de `docker-compose.prod.yml` (usuario/contraseña de Mongo, `JWT_SECRET`) **deben reemplazarse** por secrets reales antes de cualquier uso más allá de un entorno descartable — hoy están hardcodeados en el archivo versionado.

---

## 10. Comandos de referencia rápida

```bash
# Desarrollo
npm run dev              # Vite dev server con HMR

# Calidad
npm run lint             # ESLint (0 warnings tolerados)
npm run build            # tsc -b && vite build → genera dist/
npm run preview           # Sirve dist/ localmente para probar el build de producción

# Testing
npm test                  # Vitest en modo watch
npm test -- <patrón>       # Correr un archivo/suite específico
npm run test:ui            # UI de Vitest en el navegador

# Docker (build local, sin publicar)
docker build -t barber-flow-web .
docker run -p 3000:3000 barber-flow-web
```

---

## 11. Lecturas recomendadas para profundizar

**Fundamentos del proyecto:**
- [React — Learn](https://react.dev/learn) — empezar por acá si se es nuevo en React.
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — especialmente [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) y [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), muy usados en `domain/entities`.
- [Clean Architecture — Robert C. Martin (resumen)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) — el artículo original en el que se basa la estructura de capas de este proyecto.

**Librerías principales:**
- [MUI — `sx` prop en profundidad](https://mui.com/system/getting-started/the-sx-prop/) — clave para entender el 90% del styling del proyecto.
- [MUI Theming](https://mui.com/material-ui/customization/theming/) — para quien quiera migrar `appColors.ts` a un theme de MUI real en vez de tokens sueltos.
- [Zod — Basic usage](https://zod.dev/?id=basic-usage) + [Type inference](https://zod.dev/?id=type-inference).
- [React Router v7 — Tutorial](https://reactrouter.com/en/main/start/tutorial).
- [Axios — Interceptors](https://axios-http.com/docs/interceptors) — para entender `AxiosHttpClient`.
- [date-fns — Guía de formatos](https://date-fns.org/v4.1.0/docs/format).

**Testing (cuando se empiece a escribir specs):**
- [Vitest — Getting Started](https://vitest.dev/guide/).
- [Testing Library — Guiding Principles](https://testing-library.com/docs/guiding-principles/) (probar lo que el usuario ve, no detalles de implementación).

**Deploy:**
- [Vite — Building for Production](https://vite.dev/guide/build.html).
- [Vite — Env Variables and Modes](https://vite.dev/guide/env-and-mode.html).
- [Railway Docs — Environments](https://docs.railway.com/guides/environments).
- [Railway Docs — Dockerfiles](https://docs.railway.com/guides/dockerfiles).
- [Railway Docs — Custom Domains](https://docs.railway.com/guides/public-networking#custom-domains).
- [Docker — Multi-stage builds](https://docs.docker.com/build/building/multi-stage/) — para entender el `Dockerfile` actual.

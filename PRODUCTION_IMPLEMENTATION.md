# Production Implementation

Bitácora completa y detallada de todo el trabajo realizado para llevar **Barber Flow / HairCutsFlow** a producción: dominio propio (`haircutsflowcr.com`), infraestructura en Railway, flujo de CI/CD para `main`, y todos los bugs reales encontrados y corregidos en el proceso. Escrito para poder releerlo en el futuro y entender exactamente qué se hizo, por qué, y cómo se verificó.

Fecha del trabajo: 2026-08-14.

---

## 1. Punto de partida

Antes de este trabajo:

- Todo el código vivía en la rama `develop`. La rama `main` existía pero estaba **desactualizada** — tenía solo 14 commits antiguos de scaffolding (configuración inicial de Dockerfile/CI), y resultó ser un **ancestro directo** de `develop` (es decir, `develop` contenía absolutamente todo lo de `main` más 122 commits adicionales). Esto permitía promover `main` sin conflictos.
- En Railway existía un único proyecto, **`barber-flow-app-dev`**, con un único environment (**`develop`**) y un único servicio desplegado: **`barber.flow.app`** (el backend .NET API), expuesto en `barberflowapp-develop.up.railway.app`.
- La app web (`barber-flow-web`) **nunca se había desplegado a Railway** — solo corría localmente o se buildeaba en CI sin publicarse.
- MongoDB era **Atlas externo** (no el addon de Mongo de Railway).
- El dominio **`haircutsflowcr.com`** ya estaba comprado y su DNS gestionado en **Cloudflare**.
- Existían dos workflows de GitHub Actions relevantes:
  - `.github/workflows/ci-cd.yml`: corría lint/build/test de frontend y backend en push/PR a `main` y `develop`, más dos jobs (`docker`, `deploy`) que buildeaban imágenes Docker y las subían a GHCR, seguido de un deploy por SSH + `docker-compose` a un servidor propio — **mecanismo completamente desconectado de la realidad**, nunca se había usado.
  - `.github/workflows/dotnet-develop-api.yml`: este es el que **sí** hacía el deploy real, ejecutando `railway up --service barber.flow.app --environment develop --detach` en cada push a `main` **o** `develop` — con el environment **hardcodeado a `develop`** sin importar la rama.

---

## 2. Objetivo y decisiones tomadas con el usuario

El pedido fue: replicar en `main` la misma mecánica de CI/CD que ya funcionaba en `develop` (lo que implica crear un API de producción en Railway), dejar todo el dominio `haircutsflowcr.com` configurado apuntando a la app, y agregar una Landing Page pública con el mismo look & feel de la app.

Decisiones confirmadas antes de tocar código:

- **Estructura de subdominios**: `haircutsflowcr.com` (apex) = Landing Page pública · `app.haircutsflowcr.com` = app web (login/dashboard) · `api.haircutsflowcr.com` = API.
- **La Landing Page vive dentro de `barber-flow-web`** (mismas rutas React, mismo build, mismo servicio Railway) — no un proyecto/servicio aparte.
- **Enfoque en fases para la Landing**: primero un placeholder "En Construcción" con el mismo look & feel de la app (para poder salir a producción ya), el contenido completo (features, screenshots, CTA a login, sección "Contenido relevante") queda para una iteración futura.
- **Naming público**: toda la copy visible del dominio público debe decir **"HairCutsFlow"** (o abreviado "HCFlow"), nunca "Barber Flow" — el nombre interno del código/paquetes no se toca.
- **Mongo de producción separado del de dev**, cluster/URI propio en Atlas.
- Los jobs `docker`/`deploy` muertos de `ci-cd.yml` se eliminan.

---

## 3. Cambios de código (rama `develop`)

### 3.1 Landing Page placeholder

Archivos nuevos:
- `barber-flow-web/src/presentation/components/landing/LandingPage.tsx` — el componente real: mismo hero visual que `LoginForm.tsx` (imagen `barber-flow-background-image.jpg`, overlay oscuro, ícono de tijera en círculo dorado, tokens de `appColors`), con un texto grande centrado que alterna cada 3.5s entre **"En Construcción"** y **"Under Construction"** usando `Fade` de MUI para una transición suave (`useEffect` + `setInterval`).
- `barber-flow-web/src/presentation/components/landing/index.ts` — barrel export.
- `barber-flow-web/src/presentation/pages/LandingPage.tsx` — wrapper de página, mismo patrón que `LoginPage.tsx` (delegar al componente real).

Cambios en archivos existentes:
- `barber-flow-web/src/presentation/pages/index.ts` — se agrega el export de `LandingPage`.
- `barber-flow-web/src/presentation/routes/Router.tsx` — la ruta raíz (`/`) antes SIEMPRE redirigía según autenticación (`isAuthenticated ? '/dashboard' : '/login'`). Ahora decide por **hostname**:
  ```ts
  const LANDING_HOSTNAME = 'haircutsflowcr.com';
  const isLandingHost = window.location.hostname === LANDING_HOSTNAME;
  // ruta "/": si isLandingHost -> <LandingPage/>, si no -> el comportamiento de siempre
  ```
  Esto es necesario porque landing y app comparten el mismo build/servicio, pero deben comportarse distinto según el subdominio: `haircutsflowcr.com` muestra la landing, `app.haircutsflowcr.com` (o `localhost` en dev) mantiene el redirect de siempre a login/dashboard.

### 3.2 Rebranding público a "HairCutsFlow"

- `barber-flow-web/index.html`: `<title>` y `<meta name="description">` cambiados de "Barber Flow" a "HairCutsFlow" (aplica a todo el sitio, ya que es un único `index.html` compartido por landing y app).
- Nota: el hero del `LoginForm.tsx` sigue diciendo "BARBER FLOW" — **intencionalmente fuera de alcance**, el pedido de naming era específico para la Landing Page.

### 3.3 Limpieza de `ci-cd.yml`

Se eliminaron por completo los jobs `docker` (build + push a GHCR) y `deploy` (SSH + `docker-compose`), y el bloque `env` (`REGISTRY`, `IMAGE_NAME_API`, `IMAGE_NAME_WEB`) que solo ellos usaban. El job `notify` se ajustó para ya no depender de ellos (`needs: [frontend, backend]`). El resto del pipeline (lint + typecheck + build de frontend, restore + build + test de backend) queda intacto para `main` y `develop`.

### 3.4 Verificación local antes de subir

- `npm run lint` y `npm run build` en `barber-flow-web`: sin errores.
- Verificación visual con `claude-in-chrome`: se probó localmente (con `LANDING_HOSTNAME` temporalmente apuntado a `localhost` solo para el test, revertido después) que la landing renderiza correctamente y que el toggle de texto funciona. Se confirmó también que `localhost/` con sesión activa sigue redirigiendo a `/dashboard` sin regresión.

---

## 4. Flujo de Git: ramas y Pull Requests

Todo el trabajo pasó por PRs, nunca commits directos a `main`. Resumen cronológico:

| PR | Rama → destino | Contenido |
|----|----|----|
| **#52** | `develop → main` | Primer intento de promoción: landing placeholder + naming + limpieza CI + (más adelante) fix de paginación Client. **CI falló primero** por un test flaky real (ver §5.1), se corrigió y se re-verificó antes de mergear. |
| **#53** | `fix/mongo-pagination-tiebreaker → develop` | Fix del mismo bug de paginación en `BarberShop` y `Barber` repos (ver §5.2). |
| **#54** | `develop → main` | Promueve el fix de `BarberShop`/`Barber` a `main` (PR #52 ya se había mergeado antes de terminar este fix). |
| **#55** | `fix/railway-deploy-per-branch → develop` | Corrige que `dotnet-develop-api.yml` desplegaba siempre al environment `develop` de Railway sin importar la rama (ver §5.3). |
| **#56** | `develop → main` | Promueve el fix de PR #55 a `main`. |
| **#57** | `fix/web-dockerfile-bind-host → develop` | Corrige dos bugs reales del `Dockerfile` de `barber-flow-web` encontrados verificando el deploy: bind de host y variables `VITE_*` faltantes en build (ver §6.5 y §6.6). |
| **#58** | `develop → main` | Promueve el fix de PR #57 a `main` — el que finalmente dejó producción 100% funcional. |
| **#59** | `fix/landing-hostname-www → develop` | Fix del hostname que decide cuándo mostrar la Landing Page, tras invertir la dirección del redirect apex↔www (ver §7.8). |
| **#60** | `develop → main` | Promueve el fix de PR #59 a `main`. |
| **#61** | `fix/railway-api-token-env → develop` | Primer fix del deploy automático a `main`: usar `RAILWAY_API_TOKEN` en vez de `RAILWAY_TOKEN` para el Account Token nuevo (ver §5.4). |
| **#62** | `fix/railway-link-project → develop` | Segundo fix del mismo problema: pasar `RAILWAY_PROJECT_ID` explícito (ver §5.4). |
| **#63** | `develop → main` | Promueve los fixes de PR #61/#62 a `main` — primer deploy automático del API realmente exitoso en producción. |

Cada promoción a `main` se hizo con un PR nuevo (no reutilizando el mismo, ya que cada uno se mergeaba antes de que el siguiente fix estuviera listo) — no fue fast-forward puro después del primer merge, porque el propio commit de merge de GitHub en `main` ya no era ancestro literal de `develop`, pero sin conflictos de contenido en ningún caso.

---

## 5. Bugs de backend encontrados y corregidos durante la verificación

### 5.1 Paginación de Clientes devolvía duplicados entre páginas (PR #52)

**Síntoma:** el test `FindAsync_WithPagination_ReturnsRequestedPage` falló en CI (pasaba localmente la mayoría de las veces → indicaba una condición de carrera, no un fallo determinístico). El mensaje de diagnóstico que se recibió inicialmente decía "contaminación de datos entre tests", pero **era incorrecto**.

**Causa raíz real:** en `MongoDbClientRepository.FindAsync`, la consulta paginada ordenaba solo por `CreatedAt`:
```csharp
_collection.Find(filter).SortByDescending(c => c.CreatedAt)
```
El test crea 5 clientes en un loop muy rápido (`for i in 1..5: await sut.CreateAsync(...)`), y varios caían en el **mismo milisegundo** de `CreatedAt` (MongoDB solo tiene precisión de milisegundos). Cuando hay empate en el campo de sort, MongoDB **no garantiza** que el orden se mantenga igual entre dos consultas `Skip`/`Limit` separadas (página 1 y página 2) — así que el mismo documento podía aparecer en ambas páginas. Esto no era solo un problema de test: es un bug de paginación real que podía afectar producción si dos clientes se creaban casi simultáneamente.

**Fix:** agregar `Id` como criterio de desempate secundario, determinístico:
```csharp
_collection.Find(filter)
    .SortByDescending(c => c.CreatedAt)
    .ThenByDescending(c => c.Id)
```
Archivo: `barber-flow-api/Barber.Flow.Api/Barber.Flow.Infrastructure/Services/MongoDb/MongoDbClientRepository.cs`.

**Verificación:** el test se corrió 5 veces seguidas localmente sin fallar, y la suite completa (205 tests) quedó en verde.

### 5.2 Mismo bug en `BarberShop` y `Barber` repositories (PR #53)

Al revisar el resto de los repositorios Mongo se encontró el mismo patrón (`SortByDescending(CreatedAt)` sin desempate) en:
- `MongoDbBarberShopRepository.GetAllAsync`
- `MongoDbBarberRepository.FindAsync`

Se aplicó el mismo fix (`.ThenByDescending(Id)` / `.ThenByDescending(s => s.Id)`) en ambos. Ninguno de los dos tenía un test que lo detectara activamente (a diferencia de Client), pero el bug es idéntico en naturaleza. Suite completa verificada en verde (205 tests) antes de subir.

### 5.3 El workflow de deploy siempre apuntaba al environment `develop` de Railway (PR #55)

**Hallazgo:** al ir a configurar el environment de producción, se encontró que `.github/workflows/dotnet-develop-api.yml` (el mecanismo real de deploy, no `ci-cd.yml`) ejecutaba, en **cualquier push a `main` o `develop`**:
```yaml
run: railway up --service barber.flow.app --environment develop --detach
```
Es decir: **un push a `main` iba a redesplegar el environment `develop`**, no producción — nunca se habría creado nada nuevo en un environment `production` aunque existiera.

**Fix:**
```yaml
- name: Deploy to Railway
  run: |
    if [ "${{ github.ref_name }}" = "main" ]; then
      RAILWAY_ENVIRONMENT="production"
    else
      RAILWAY_ENVIRONMENT="develop"
    fi
    railway up --service barber.flow.app --environment "$RAILWAY_ENVIRONMENT" --detach
```
Nota: como el environment `production` todavía no existía en Railway en el momento de mergear este PR, los primeros pushes a `main` con este workflow fallaban ese paso de forma segura (build seguía pasando, solo no encontraba el environment) hasta que se creó el environment (§6.1).

### 5.4 El deploy automático a `main` seguía fallando en silencio — token mal scopeado (PR #61, #62)

**Hallazgo (varios días después del lanzamiento, reportado por el usuario tras ver el Action fallido en GitHub):** aun después de crear el environment `production` (§6.1) y arreglar el branch-mapping (§5.3), el job "Deploy to Railway" de `dotnet-develop-api.yml` **seguía fallando en todos los pushes a `main`** desde el PR #56 en adelante (#56, #58, #60 — 3 promociones seguidas). El error:
```
Environment "production" not found.
Run `railway environment` to connect to an environment.
```
...a pesar de que el environment sí existía y se usaba activamente durante toda la sesión. Nadie lo había notado porque el servicio Web de producción (que usa la integración nativa Railway↔GitHub, no este workflow) sí se desplegaba solo, y el servicio API se mantuvo actualizado porque cada promoción a `main` en esta sesión se acompañó de un `redeploy` manual disparado por mí vía Railway MCP/dashboard — el pipeline automático nunca se puso a prueba de verdad hasta que el usuario miró el tab de Actions en GitHub.

**Causa raíz:** el secret `RAILWAY_TOKEN` en GitHub era un **Project Token** de Railway — este tipo de token queda enlazado a un solo environment específico en el momento de crearlo, y ningún flag de la CLI (ni `--environment production`) puede hacerlo actuar sobre un environment distinto al que tiene enlazado. El token había sido creado (mucho antes de este trabajo) apuntando solo a `develop`.

**Fix en dos pasos**, ambos necesarios porque cada uno reveló el siguiente problema:

1. **PR #61** — el usuario generó un **Account Token** nuevo en Railway (Account Settings → Tokens, workspace "Guillermo Ramirez's Projects", no "Project Token") y actualizó el secret `RAILWAY_TOKEN` en GitHub. Pero la CLI de Railway espera los tokens de cuenta/equipo bajo un nombre de variable de entorno distinto: `RAILWAY_API_TOKEN`, no `RAILWAY_TOKEN` (ese nombre es específicamente para Project Tokens). Sin este cambio, la CLI rechazaba el token nuevo con `Invalid RAILWAY_TOKEN`.
2. **PR #62** — con el nombre de variable corregido, apareció un tercer error: `No linked project found`. Un Project Token trae implícito a qué proyecto pertenece; un Account Token no, así que la CLI no tenía forma de saber en qué proyecto operar sin un `railway link` previo. Fix: pasar `RAILWAY_PROJECT_ID: ebb6ff97-3097-41df-a558-94ef61eae624` explícito como variable de entorno del step (mismo valor que Railway inyecta en runtime a los propios contenedores desplegados, confirmado revisando las variables del servicio).

**Verificación:** tras el PR #62, un push a `develop` mostró el job "Deploy to Railway" en verde por primera vez. Se promovió a `main` (PR #63) y se confirmó el mismo resultado en verde ahí — el deploy automático del API a producción quedó funcionando de punta a punta por primera vez desde que existe el environment.

---

## 6. Infraestructura en Railway

### 6.1 Creación del environment `production`

Railway **no expone una API/MCP tool para crear environments** — es una operación exclusiva del dashboard. Se creó manualmente: Project → dropdown de environment → "Create New Environment" → **duplicar `develop`** (en vez de vacío), lo que trajo automáticamente una copia del servicio `barber.flow.app` (API) con su configuración de Dockerfile ya lista, ahorrando tener que recrearlo desde cero.

Tras duplicar, se hicieron dos ajustes manuales (tampoco expuestos vía API):
- Cambiar el **branch de origen** del servicio duplicado de `develop` a `main` (Settings → Source).
- (El resto de la config de build, `dockerfilePath: /barber-flow-api/Barber.Flow.Api/Dockerfile`, ya venía correcta de la duplicación).

### 6.2 Variables de producción del API

Seteadas vía Railway MCP (`set-variables`) sobre el servicio `barber.flow.app` en el environment `production`:

| Variable | Valor / origen |
|---|---|
| `MONGODB_URI` | Connection string de un cluster **Atlas de producción separado** del de dev (provisto por el usuario) |
| `Jwt__Key` | String aleatorio de 64 bytes generado con `openssl rand -base64 64`, distinto al de dev |
| `Resend__ApiKey` | API key de Resend provista por el usuario |
| `Resend__FromEmail` | `noreply@haircutsflowcr.com` |
| `Resend__FromName` | `HairCutsFlow` |
| `Cors__AllowedOrigins__0` | `https://haircutsflowcr.com` |
| `Cors__AllowedOrigins__1` | `https://app.haircutsflowcr.com` |

(Las variables `Email__SmtpUsername`/`Email__SmtpPassword` quedaron heredadas de la duplicación de `develop` pero **no se usan** — el código real envía email vía Resend, esas son remanentes de una integración legacy con MailKit que ya no está activa.)

⚠️ Ver **§6.8** — se descubrió *después* de esta configuración inicial que este mismo `MONGODB_URI` estaba duplicado tal cual en `develop`, sin ninguna base de datos separada para dev.

⚠️ Nota sobre el `MONGODB_URI`: inicialmente se le agregó un path `/barberflow_prod?retryWrites=true&w=majority` al connection string que el usuario pasó — esto se **revirtió** al descubrir que el código (`ApplicationExtensions.cs`) obtiene el nombre de la base de datos de `appsettings.Production.json` (`MongoDb:DatabaseName: "barber_flow"`), **no** del path de la URI. Se dejó el connection string exactamente como lo dio el usuario.

### 6.3 Creación del servicio Web de producción

No existía ningún servicio web en Railway (ni siquiera en `develop`). Se creó desde cero vía `create-deployment` (Railway MCP), apuntando al repo `gramirez29/barber.flow.app`, branch `main`, nombre `barber-flow-web`.

**Bug encontrado — build fallaba con "Missing script: build":** el primer deploy falló porque, al no especificarse un `rootDirectory` para el servicio, Railway usaba la **raíz del monorepo** como contexto de build. El `Dockerfile` de `barber-flow-web` hace `COPY package*.json ./` asumiendo que el contexto ya es `barber-flow-web/`, pero como el contexto real era la raíz del repo, copiaba el `package.json` de la raíz del monorepo (un archivo suelto, legacy, sin script `build`, con solo un par de dependencias de i18n de otro propósito) en vez del de la app web.

**Fix:** `update-service` con `rootDirectory: /barber-flow-web` y `dockerfilePath: Dockerfile` (relativo a ese root). Con esto el build encontró el `package.json` correcto y compiló.

**Variables de build seteadas:**

| Variable | Valor |
|---|---|
| `VITE_API_BASE_URL` | `https://api.haircutsflowcr.com` |
| `VITE_APP_ENV` | `production` |
| `VITE_API_TIMEOUT` | `30000` |

### 6.4 Bug — el contenedor de la web no era alcanzable ("connection refused")

Con el build ya exitoso, todas las URLs devolvían `502` con `upstreamErrors: "connection refused"` en los logs de Railway, a pesar de que el contenedor logueaba `Accepting connections at http://localhost:3000` con normalidad.

**Causa:** el comando del `Dockerfile`, `serve -s dist -l 3000`, no especifica una dirección de bind explícita. El proxy privado de Railway se conecta al contenedor por su IP de red interna, no por `localhost`/loopback — si el proceso no está escuchando en `0.0.0.0` (todas las interfaces), esas conexiones externas se rechazan aunque el proceso esté sano y escuchando "en algún lado".

**Fix operativo inmediato** (para destrabar sin esperar un PR): override de `startCommand` en el servicio de Railway a `serve -s dist -l tcp://0.0.0.0:3000`.

**Fix de fondo** (en el repo, PR #57): mismo cambio aplicado directamente en el `Dockerfile`:
```dockerfile
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3000"]
```

### 6.5 Bug — dominios sin puerto asignado

Independiente del bug anterior, se detectó que al generar dominios custom para el servicio web **antes** de que existiera un primer deploy exitoso (el primer intento había fallado por el bug de §6.3), Railway los dejó con el campo de puerto **vacío** (`{}` en vez de `{"port": 3000}`), a diferencia del servicio API (que sí tenía `{"port": 8080}` porque sus dominios se generaron mucho después de tener deploys exitosos previos). Un intento de arreglarlo vía el agente de Railway (`railway-agent`) reportó éxito pero **no persistió realmente** el cambio (falso positivo). Se resolvió manualmente en el dashboard: Settings → Networking → editar cada dominio → asignar puerto `3000` (para el servicio web) u `8080` (para `api.haircutsflowcr.com`, mismo problema apareció ahí también).

### 6.6 Bug — variables `VITE_*` nunca llegaban al build de Vite

Con el sitio ya arriba (`200 OK` en todos los dominios) y la landing funcionando, se probó un login real desde `https://app.haircutsflowcr.com`. El request fue a `https://app.haircutsflowcr.com/api/users/authentication` (¡relativo, contra sí mismo, no contra `api.haircutsflowcr.com`!) y devolvió `200` — pero era el `index.html` de la propia SPA (por el fallback `-s` de `serve`, que devuelve `index.html` para cualquier ruta no encontrada), no una respuesta JSON real. El formulario interpretó ese `200` engañoso como login exitoso y navegó a `/dashboard`, que renderizó en blanco.

**Causa raíz:** `AxiosHttpClient` usa `import.meta.env.VITE_API_BASE_URL` — una variable que Vite **hornea en el bundle en build-time**. Las variables `VITE_API_BASE_URL`/`VITE_APP_ENV`/`VITE_API_TIMEOUT` sí estaban seteadas como variables del **servicio** de Railway (§6.3), pero **Railway no inyecta automáticamente las variables del servicio dentro de un build basado en `Dockerfile`** — Docker aísla el build del entorno del host por diseño. Para que una variable de Railway esté disponible durante un `RUN npm run build`, el `Dockerfile` tiene que declararla explícitamente con `ARG` (Railway auto-completa cualquier `ARG` cuyo nombre coincida con una variable configurada del servicio).

**Fix** (PR #57, mismo PR que el bind host):
```dockerfile
ARG VITE_API_BASE_URL
ARG VITE_API_TIMEOUT
ARG VITE_APP_ENV
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT
ENV VITE_APP_ENV=$VITE_APP_ENV

RUN npm run build
```
(Las líneas `ARG`/`ENV` van **antes** de `RUN npm run build`, después de `COPY . .`.)

**Verificación local antes de subir:** build local con `VITE_API_BASE_URL=https://api.haircutsflowcr.com npm run build`, y `grep -c api.haircutsflowcr.com dist/assets/index-*.js` confirmó que la URL quedó embebida en el bundle generado.

**Verificación en producción tras el deploy:** login de prueba con credenciales inventadas (`testuser`/`testpass123`) mostró el banner real "AUTENTICACIÓN FALLIDA", y una llamada directa con `curl` al endpoint confirmó la respuesta genuina de la API:
```
curl -X POST https://api.haircutsflowcr.com/api/users/authentication \
  -H "Content-Type: application/json" -H "Origin: https://app.haircutsflowcr.com" \
  -d '{"userName":"testuser","password":"testpass123"}'
→ HTTP 400 {"message":"Invalid credentials"}
```

### 6.7 Limpieza de dominios sobrantes

En algún punto del proceso de debugging del puerto (§6.5), el servicio `barber-flow-web` terminó con **3 dominios `.up.railway.app`** generados (uno original + dos duplicados accidentales, probablemente de clicks repetidos en el dashboard). Se identificaron y se eliminaron los 2 sobrantes manualmente (Settings → Networking → Service Domains), dejando solo el original + los 2 custom domains.

### 6.8 Bug crítico descubierto post-lanzamiento — `develop` y `production` compartían la misma base de datos

**Contexto:** días después del lanzamiento, al pedir confirmación de a qué base de Mongo se conecta producción, se verificó directamente en Atlas (Data Explorer del cluster) y en las variables de ambos environments de Railway.

**Hallazgo:** la variable `MONGODB_URI` del servicio `barber.flow.app` en `develop` era **idéntica, carácter por carácter**, a la de `production` — mismo cluster (`cluster0.dolkt8l.mongodb.net`), mismo usuario (`graba29_db_user`), misma contraseña. Además, **ninguno de los dos environments tenía la variable `ASPNETCORE_ENVIRONMENT` seteada explícitamente en Railway** — ambos corrían con el default `Production` que trae el `Dockerfile` del API (`ENV ASPNETCORE_ENVIRONMENT=Production`), así que los dos cargaban `appsettings.Production.json`, cuyo `MongoDb:DatabaseName` es `"barber_flow"`. Resultado: **`develop` y `production` leían y escribían literalmente la misma base de datos**, sin ningún aislamiento. Se confirmó mirando el Data Explorer de Atlas: dentro del cluster solo existía una base relevante, `barber_flow` (8 colecciones, 21 índices) — no había ninguna base separada tipo `barber-flow-dev-db` a pesar de que ese es el nombre configurado en `appsettings.Development.json` (nunca se estaba usando, porque el environment nunca corría en modo `Development`).

**Fix aplicado:** en vez de cambiar `ASPNETCORE_ENVIRONMENT` (que además de la base de datos afecta logging, páginas de error detalladas, y el rate limiting de login — cambios más amplios de los necesarios), se agregó una variable de Railway específica y mínima en el environment **`develop`** únicamente:
```
MongoDb__DatabaseName = barber_flow_dev
```
Esto sobreescribe puntualmente el nombre de base que usa `develop` (la convención `__` de ASP.NET Core mapea `MongoDb__DatabaseName` a la config `MongoDb:DatabaseName`), sin tocar ninguna otra variable ni la config de `production`. Se disparó un redeploy manual del servicio en `develop` para que tomara efecto.

**Verificación:** tras el redeploy, `MongoDbBootstrapper` (que corre en cada arranque, crea índices y siembra el usuario admin inicial si la colección `users` está vacía) generó automáticamente la base `barber_flow_dev` en el mismo cluster — confirmado visualmente en el Data Explorer de Atlas, apareciendo como una base hermana de `barber_flow`, con sus propias colecciones (`appointments`, `barberShops`, `barbers`, `users`, etc.) completamente vacías/independientes. `production` seguía intacta, sin cambios, apuntando a `barber_flow`.

**Nota:** esto es un aislamiento *lógico* (misma cuenta de Atlas, mismo cluster físico, mismas credenciales de acceso), no físico. Si en el futuro se quiere aislamiento completo (cluster separado, credenciales separadas), hay que crear un cluster nuevo en Atlas manualmente y actualizar `MONGODB_URI` de `develop` para que apunte ahí — evaluado y descartado por ahora a favor de la solución rápida.

---

## 7. Configuración de DNS en Cloudflare

### 7.1 Dominios custom creados en Railway

Vía `generate-domain` (Railway MCP), que devuelve el target CNAME a usar:

| Dominio | Servicio Railway | Target CNAME |
|---|---|---|
| `haircutsflowcr.com` | `barber-flow-web` | `g5dd8ffw.up.railway.app` |
| `app.haircutsflowcr.com` | `barber-flow-web` | `ahkf6v7o.up.railway.app` |
| `api.haircutsflowcr.com` | `barber.flow.app` | `dvzou7xj.up.railway.app` |

### 7.2 Primer intento: CNAME manual, modo DNS only

Se crearon los 3 registros CNAME en Cloudflare (`@`/apex con CNAME flattening, `app`, `api`) apuntando a sus targets, en modo **"DNS only"** (nube gris) — necesario porque si se dejan proxeados desde el arranque (nube naranja), Railway no puede completar el challenge HTTP-01 de Let's Encrypt para emitir el certificado.

### 7.3 Bug/paso faltante: falta el registro TXT de verificación

Con solo el CNAME, Railway mostraba un ícono de warning en `haircutsflowcr.com` y `app.haircutsflowcr.com`. Investigando la documentación de Railway se confirmó: **los dominios custom requieren un CNAME (rutea el tráfico) Y un TXT (verifica la propiedad del dominio) — ambos son obligatorios**, y sin el TXT el dominio queda en estado "pending" indefinidamente, nunca emite certificado.

**Resolución:** en vez de copiar el TXT manualmente, se usó el botón **"One-click DNS Setup to Cloudflare"** que ofrece Railway en el detalle de cada dominio (`Show DNS Records` → `Connect`) — autoriza a Railway a crear los registros correctos (CNAME + TXT) directamente en la cuenta de Cloudflare del usuario vía OAuth.

### 7.4 Efecto secundario: el one-click setup activó el proxy de Cloudflare

Tras usar "Connect", los dominios empezaron a responder `{"status":"error","code":404,"message":"Application not found"}` con headers `Server: cloudflare` y `x-railway-fallback: true` — el one-click setup dejó el registro CNAME en modo **Proxied** (nube naranja) por defecto. Cuando Cloudflare proxea el tráfico, termina el TLS con su propio certificado y reenvía a Railway; Railway necesita ver el SNI/Host original para rutear correctamente al servicio, y con el proxy de por medio ese ruteo fallaba (esto está documentado explícitamente por Railway: *"For proxied domains (Cloudflare orange cloud), we may not always be able to issue a certificate for the domain"*).

**Fix:** una vez creados los registros CNAME + TXT vía el one-click, se cambió manualmente cada CNAME de **Proxied (naranja) a DNS only (gris)** en Cloudflare — dejando el TXT sin tocar (no tiene opción de proxy). Se hizo el mismo proceso (Connect → esperar CNAME+TXT → pasar a DNS only) para los 3 dominios, uno por uno, incluyendo una segunda vuelta para `api.haircutsflowcr.com` porque el usuario inicialmente estaba mirando el servicio equivocado en el dashboard (`barber-flow-web` en vez de `barber.flow.app` — nombres confusamente parecidos).

### 7.5 Emisión de certificados

Tras el DNS correcto (CNAME + TXT, sin proxy), Railway emitió certificados Let's Encrypt propios para cada dominio en un plazo de pocos minutos (documentado como normalmente <1 hora, hasta 72h en casos extremos). Verificado con:
```
openssl s_client -connect <dominio>:443 -servername <dominio>
```
confirmando que el `subject=CN=<dominio>` pasó de el certificado wildcard genérico `*.up.railway.app` (fallback antes de la verificación) al certificado propio de cada dominio.

### 7.6 Nota de depuración: caché DNS local

Durante la verificación de `api.haircutsflowcr.com`, `curl` seguía mostrando tráfico vía Cloudflare (`Server: cloudflare`, conectando a una IP `104.21.x.x`) incluso después de confirmar el modo DNS-only, mientras que `nslookup` contra `1.1.1.1` directamente ya mostraba la resolución correcta hacia Railway. Causa: **caché de DNS del resolver local de Windows**, no un problema real de configuración. Se resolvió con `ipconfig /flushdns`.

### 7.7 `www.haircutsflowcr.com` — primer intento (redirect www → apex)

Railway (plan Hobby) limita a **2 custom domains por servicio**, y `barber-flow-web` ya tenía los 2 (`haircutsflowcr.com` + `app.haircutsflowcr.com`) — agregar `www` como un tercer dominio de Railway hubiera requerido upgradear el plan. Primer intento, resuelto íntegramente del lado de Cloudflare sin tocar Railway:

1. **Registro DNS**: nuevo CNAME `www` → `haircutsflowcr.com`, en modo **Proxied** (nube naranja) — distinto de los otros 3 registros (`@`, `app`, `api`), que están en DNS only porque terminan en Railway y necesitan que Railway vea el SNI original. Este caso era distinto: `www` nunca llegaba a Railway, Cloudflare lo interceptaba y redirigía antes, así que el proxy era **requisito** (las Redirect Rules de Cloudflare solo evalúan tráfico proxeado).
2. **Redirect Rule**: template listo de Cloudflare, **"Redirect from WWW to root"**: `https://www.*` → `https://${1}` (301).
3. Al desplegar, Cloudflare avisó que el DNS podía no estar proxeando `www` todavía (chequeo desactualizado, el CNAME recién creado no se había detectado aún) — se ignoró con seguridad.

Verificado funcionando (`www` → apex), pero **este direccionamiento se descartó y se invirtió** — ver §7.8.

### 7.8 `www.haircutsflowcr.com` como dominio canónico (dirección final)

El usuario pidió explícitamente que `www.haircutsflowcr.com` fuera la URL principal/canónica (la que se ve en la barra del navegador), con el apex (`haircutsflowcr.com`) redirigiendo hacia `www` — la dirección opuesta a la de §7.7. Cambio completo:

1. **Railway**: se eliminó el custom domain `haircutsflowcr.com` del servicio `barber-flow-web` (liberando el slot del límite de 2 dominios del plan Hobby), y se agregó `www.haircutsflowcr.com` como custom domain nuevo — puerto 3000 seleccionado directamente desde el detector automático de Railway ("A port was detected by Railway magic"), evitando repetir el bug de puerto vacío de §6.5.
2. **Cloudflare DNS**:
   - El registro `www` se recreó vía el mismo flujo "One-click DNS Setup to Cloudflare" de Railway (CNAME hacia el nuevo target `ktbmfqld.up.railway.app` + TXT de verificación `_railway-verify.www`) — el flujo detectó y pidió confirmar el borrado del CNAME `www` viejo (el de §7.7, que apuntaba a `haircutsflowcr.com`) antes de crear el nuevo.
   - `www` se pasó manualmente a **DNS only** (ya no es un redirect de Cloudflare, ahora termina en Railway de verdad — mismo motivo que `@`/`app`/`api`).
   - El registro del apex (`haircutsflowcr.com`) se editó: target cambiado a `www.haircutsflowcr.com`, proxy pasado a **Proxied**.
3. **Redirect Rule**: la regla existente ("Redirect from WWW to root") se editó en vez de crear una nueva — renombrada a "Redirect from root to WWW", patrón cambiado a `https://haircutsflowcr.com/*`, destino a `https://www.haircutsflowcr.com/${1}`.

**Bug de código encontrado y arreglado en el mismo movimiento:** `Router.tsx` decidía si mostrar la Landing Page comparando `window.location.hostname` contra el string literal `'haircutsflowcr.com'` (el apex). Con la dirección invertida, el apex nunca vuelve a recibir tráfico de verdad (Cloudflare lo redirige antes de que llegue a Railway) — el único hostname que la app React llega a ver en producción es `www.haircutsflowcr.com`, que nunca coincidía con el chequeo. Resultado: la Landing Page dejó de renderizarse por completo, todo visitante caía al comportamiento default de auth-redirect (`/login`). Fix (rama `fix/landing-hostname-www`, PR #59 → `develop`, PR #60 → `main`): `LANDING_HOSTNAME` ahora compara contra `'www.haircutsflowcr.com'`.

**Verificación final:**
```
curl -I https://haircutsflowcr.com/       → 301, Location: https://www.haircutsflowcr.com/
curl -I https://www.haircutsflowcr.com/   → 200 OK, Server: railway-hikari (cert propio, no Cloudflare)
```
Confirmado también visualmente: `haircutsflowcr.com` redirige y la Landing Page carga correctamente en `www.haircutsflowcr.com`.

---

## 8. Verificación end-to-end final

Checklist completo verificado tras todos los fixes:

- ✅ `https://haircutsflowcr.com` → redirige (301) a `https://www.haircutsflowcr.com`.
- ✅ `https://www.haircutsflowcr.com` → landing "En Construcción"/"Under Construction", HTTPS válido con certificado propio, verificado visualmente en navegador real. Dominio canónico.
- ✅ `https://app.haircutsflowcr.com` → redirige a `/login`, HTTPS válido.
- ✅ `https://api.haircutsflowcr.com` → HTTPS válido, responde `404` en la raíz (comportamiento esperado, comparado contra el baseline conocido de `develop`).
- ✅ CORS: preflight `OPTIONS` desde `Origin: https://app.haircutsflowcr.com` contra `https://api.haircutsflowcr.com/api/users/authentication` responde `204` con `access-control-allow-origin: https://app.haircutsflowcr.com`.
- ✅ Login end-to-end real: intento con credenciales inventadas desde el navegador en `app.haircutsflowcr.com` devuelve el error real de la API (`400 Invalid credentials`), confirmando que el flujo completo — build con la URL correcta embebida, DNS, TLS, CORS, y el propio backend — funciona de punta a punta.
- ✅ Los dominios que sirven contenido real (`www`, `app`, `api`) usan certificados propios (no el wildcard de fallback de Railway).
- ✅ Sin dominios ni variables sobrantes/duplicadas en la configuración final de Railway.

---

## 9. Pendientes (no bloquean lo anterior, quedan anotados para retomar)

1. ~~**`www.haircutsflowcr.com`**~~ — **resuelto**, ver §7.7–7.8 (`www` es el dominio canónico, apex redirige hacia él).
2. ~~**Verificación del dominio en Resend**~~ — **resuelto** (2026-08-18). El dominio configurado en Resend no era ni siquiera el correcto: la cuenta solo tenía `barberflowcr.app` (dominio suelto, sin relación con el proyecto, nunca verificado — probablemente un remanente de pruebas), y `haircutsflowcr.com` no estaba dado de alta en absoluto, pese a que `Resend__FromEmail` en Railway producción ya apuntaba a `noreply@haircutsflowcr.com`. Como el plan gratuito de Resend permite un solo dominio, se eliminó `barberflowcr.app` y se agregó `haircutsflowcr.com` (región North Virginia/us-east-1, Sending habilitado, Receiving deshabilitado — el proyecto solo envía OTP). El one-click "Go to Cloudflare" de Resend no completó la integración automáticamente (abrió el dashboard de Cloudflare sin crear registros), así que los 4 registros se agregaron a mano en la zona `haircutsflowcr.com` de Cloudflare, con TTL Auto: TXT `resend._domainkey` (clave DKIM), MX `send` → `feedback-smtp.us-east-1.amazonses.com` (priority 10), TXT `send` → `v=spf1 include:amazonses.com ~all`, TXT `_dmarc` → `v=DMARC1; p=none;`. Verificado en Resend 15 minutos después: `Domain added` 9:08 AM → `DNS verified` 9:21 AM → `Domain verified` 9:23 AM. `noreply@haircutsflowcr.com` ya puede enviar emails reales de producción.
3. **Contenido completo de la Landing Page** (Fase 2 del plan original, explícitamente pospuesta): hero con propuesta de valor + botón "Iniciar sesión", sección de features (Citas/Clientes/Reportes/Notificaciones), footer reusado, screenshots/mockups de la app (a capturar con datos ficticios, nunca clientes reales), sección "Contenido relevante" marcada como "En construcción". Sin sección de pricing (tema a discutir aparte). Todo el naming debe seguir usando "HairCutsFlow"/"HCFlow", nunca "Barber Flow".

---

## 9.1 Rebranding del email de recuperación de contraseña (2026-08-18)

El template HTML del email de OTP (`AuthService.cs`, `GetEmailTemplate`) todavía decía "Barber Flow" en el asunto, el header y el footer, y el footer tenía un copyright hardcodeado a `© 2024` sin link. Se actualizó (rama `features/email-branding-haircutsflow`, PR #65 → `develop`):
- Asunto: `"Barber Flow - Código de recuperación de contraseña"` → `"HairCutsFlow CR - Código de recuperación de contraseña"`.
- Header del email: `BARBER FLOW` → `HAIRCUTSFLOW CR`.
- Footer: `© 2024 Barber Flow. Premium Grooming Experience.` → `© {DateTime.UtcNow.Year} HairCutsFlow CR. Premium Grooming Experience.` (año calculado en runtime, ya no hardcodeado) + link nuevo a `https://www.haircutsflowcr.com`.
- Default de `Resend:FromName` en `appsettings.json` (`"Barber Flow"` → `"HairCutsFlow CR"`) y variable `Resend__FromName` actualizada en Railway en **ambos** environments (`develop` y `production`).

**Bug encontrado al verificar en `develop` con un email real:** el correo seguía llegando desde `onboarding@resend.dev` (el remitente de fallback de Resend) en vez de `noreply@haircutsflowcr.com`, a pesar de que el dominio ya estaba verificado (§9.2). Causa: `Resend__FromEmail` nunca se había configurado como variable de Railway en el environment `develop` — solo se había seteado en `production` en su momento (§6.2), así que `develop` caía al default de `appsettings.json` (`"onboarding@resend.dev"`, pensado como fallback seguro para desarrollo local sin dominio verificado). Fix: se agregó `Resend__FromEmail = noreply@haircutsflowcr.com` también en el environment `develop`.

**Verificación end-to-end:** tras el deploy del PR #65 (workflow "CI/CD - ASP.NET + Railway" en verde) y el redeploy por la variable nueva, se corrió el flujo completo de `/forgot-password` con un email real (`g.raba29@gmail.com`) apuntando el frontend local al backend de `develop` — el correo llegó desde `noreply@haircutsflowcr.com` con el asunto, header y footer nuevos (año dinámico + link), confirmado visualmente por el usuario.

---

## 10. Arquitectura final de referencia

```
Railway — proyecto "barber-flow-app-dev"
├── environment "develop"
│   ├── barber.flow.app (API)          → barberflowapp-develop.up.railway.app
│   └── barber-flow-web-develop (SPA)  → develop.haircutsflowcr.com (staging, detrás de Cloudflare Access)
│
└── environment "production"
    ├── barber.flow.app (API)         → api.haircutsflowcr.com
    │                                    (+ barberflowapp-production.up.railway.app)
    └── barber-flow-web (Web/SPA)     → www.haircutsflowcr.com (landing, dominio canónico)
                                         app.haircutsflowcr.com (login/dashboard)
                                         (+ barber-flow-web-production.up.railway.app)
                                         (haircutsflowcr.com sin www redirige a www vía Cloudflare,
                                          no es un dominio de Railway)

MongoDB Atlas — mismo cluster que dev ("Cluster0"), bases de datos lógicas separadas:
             "barber_flow" (production) / "barber_flow_dev" (develop) — ver §6.8
Resend — mismo proveedor de email que dev, API key y remitente propios de producción
Cloudflare — DNS de haircutsflowcr.com. `www`/`app`/`api` en modo DNS only (sin proxy) para
             no interferir con el ruteo/TLS de Railway; `develop` es la excepción — va
             Proxied a propósito, porque necesita que Cloudflare Access intercepte el
             tráfico (ver §11)
```

Ramas y deploy: push a `main` → Railway (`dotnet-develop-api.yml`) despliega automáticamente el servicio API del environment `production`; el servicio `barber-flow-web` de producción está conectado directo a GitHub (integración nativa de Railway) sobre la rama `main`, sin pasar por GitHub Actions. Mismo patrón en `develop`: push a `develop` despliega el API vía `dotnet-develop-api.yml`, y `barber-flow-web-develop` está conectado directo a GitHub sobre la rama `develop`.

---

## 11. Ambiente de pruebas — `develop.haircutsflowcr.com` (2026-08-20)

Objetivo: tener un ambiente accesible por navegador para probar cambios de `develop` antes de promoverlos a `main`, replicando la infraestructura de producción pero aislado (datos, dominio, acceso).

### 11.1 Punto de partida

El environment `develop` del proyecto Railway `barber-flow-app` ya tenía el API (`barber.flow.app`) desplegado y con su propia base (`barber_flow_dev`, ver §6.8), pero **nunca tuvo un servicio web** — no existía ningún frontend desplegado ahí, ni dominio público para probarlo visualmente.

### 11.2 Servicio web en `develop`

Se intentó reusar el servicio `barber-flow-web` existente (el de producción) agregándole configuración para el environment `develop` vía Railway MCP (`update-service` con `rootDirectory`/`dockerfilePath` scopeados a ese environment). La llamada reportó éxito, pero **no creó una instancia real** — `get-service-config` seguía devolviendo "no configuration in this environment", y el servicio ni siquiera aparecía como nodo en el canvas de Railway al cambiar a `develop`. Investigando se confirmó: Railway no expone ninguna vía (ni API ni dashboard, para un servicio que nunca tuvo un deploy previo en un environment) para "adjuntarle" un environment nuevo a un servicio existente — el dashboard tampoco muestra nodos vacíos para servicios sin deploys en el environment activo.

**Fix:** en vez de reusar el servicio, se creó uno nuevo scopeado únicamente a `develop` (`create-deployment` con `environmentId` del environment `develop`), repo y rama `develop`. Como el nombre `barber-flow-web` ya estaba tomado a nivel de proyecto (los nombres de servicio son únicos por proyecto, no por environment), el servicio nuevo se llamó **`barber-flow-web-develop`**.

Config aplicada (misma que producción, ver §6.3):
- `rootDirectory: /barber-flow-web`, `dockerfilePath: Dockerfile`.
- Variables de build: `VITE_API_BASE_URL=https://barberflowapp-develop.up.railway.app` (se reusa el dominio Railway del API, sin dominio custom nuevo — decisión deliberada para no gastar otro slot de dominio custom del plan Hobby), `VITE_APP_ENV=staging`, `VITE_API_TIMEOUT=30000`.
- A diferencia de cuando se armó producción, **no hizo falta** override de `startCommand` ni ajuste de puerto en el dominio — ambos bugs (§6.4, §6.5) ya estaban corregidos en el `Dockerfile`/flujo desde ese trabajo anterior.

### 11.3 CORS del API en `develop`

Hallazgo: el environment `develop` del API **no tenía ninguna variable `Cors__AllowedOrigins__N` configurada** (a diferencia de producción, §6.2) — solo los defaults hardcodeados de `ApplicationExtensions.cs` (`localhost:3005`/`5173`). Sin este fix, el navegador hubiera bloqueado por CORS cualquier llamada desde el nuevo frontend. Se agregó `Cors__AllowedOrigins__0=https://develop.haircutsflowcr.com` sobre `barber.flow.app`/`develop`.

### 11.4 DNS en Cloudflare

Mismo patrón que producción (§7): dominio custom generado en Railway (`generate-domain`, target `kpyd5fw7.up.railway.app`), CNAME + TXT creados vía "One-click DNS Setup to Cloudflare".

**Diferencia importante respecto a `www`/`app`/`api`:** este CNAME se dejó **Proxied** (nube naranja), no DNS only — al revés de los otros tres. Es intencional: `develop` necesita que Cloudflare Access intercepte el tráfico (§11.5), y Access solo puede hacerlo si el dominio está proxeado. La preocupación original (que el proxy rompe la emisión de certificados de Railway, documentada en §7.4) no aplicó acá porque Access opera como reverse-proxy — valida la sesión y recién después reenvía a Railway con el Host/SNI correcto.

### 11.5 Cloudflare Access

Se protegió `develop.haircutsflowcr.com` con una Access Application (Zero Trust → Access → Applications, self-hosted) con política de login por email (One-Time PIN) restringida a los emails autorizados — a diferencia de producción, este ambiente puede tener features a medio terminar y no debe ser público.

**Decisión explícita:** no se protegió `app.haircutsflowcr.com` (producción) de la misma forma — Access exige autenticarse contra una lista fija de emails, incompatible con usuarios reales de negocio que no controla el desarrollador. El login propio de la app (usuario/contraseña contra el backend) sigue siendo la única puerta de entrada en producción.

### 11.6 Landing page también en `develop`

`Router.tsx` decidía mostrar la Landing Page comparando el hostname contra el string literal `'www.haircutsflowcr.com'` — con eso, `develop.haircutsflowcr.com` nunca iba a mostrarla, cayendo siempre al redirect de la app (login/dashboard). Como el plan es iterar el contenido completo de la Landing (pendiente #3 de §9) en este ambiente antes de promoverlo a producción, se cambió a una lista (`LANDING_HOSTNAMES`) que incluye ambos dominios (rama `feature/staging-landing-hostname`, PR #71 → `develop`).

### 11.7 Verificación end-to-end

- `curl` sin sesión contra `https://develop.haircutsflowcr.com/` → `302` con `Www-Authenticate: Cloudflare-Access`, redirige a `hair-cuts-flow-team.cloudflareaccess.com` — confirma que Access está interceptando correctamente el tráfico no autenticado.
- Con sesión de Access ya autenticada (navegador real): la SPA carga completa, incluyendo el hero con imagen de fondo (un `404` transitorio visto en la primera verificación resultó ser una respuesta cacheada por Cloudflare de un momento anterior a que el deploy terminara de propagar — se confirmó con una consulta directa al origen de Railway, que devolvió `200`, y se resolvió solo tras un segundo request; no era un bug real).
- Preflight CORS (`OPTIONS` desde `Origin: https://develop.haircutsflowcr.com` contra el API de `develop`) → `204` con `access-control-allow-origin: https://develop.haircutsflowcr.com` correcto.
- Tras el merge del PR #71: `develop.haircutsflowcr.com/` muestra la Landing Page (antes redirigía a `/login`), confirmado visualmente por el usuario. `www.haircutsflowcr.com`/`app.haircutsflowcr.com` en producción sin cambios de comportamiento.

### 11.8 Pendiente para retomar

- El servicio quedó nombrado `barber-flow-web-develop` (no `barber-flow-web`) por la colisión de nombre a nivel de proyecto — cosmético, no afecta funcionalidad.
- El link del footer del email de recuperación de contraseña (`AuthService.cs`, `GetEmailTemplate`) sigue hardcodeado a `https://www.haircutsflowcr.com` — un OTP disparado desde `develop` muestra ese link de producción en el footer. No bloquea el flujo (el código OTP no depende del link). No corregido en este trabajo.
- No se protegió el dominio del API de `develop` (`barberflowapp-develop.up.railway.app`) con Access — queda abierto, aunque al no ser un dominio "lindo"/anunciado el riesgo es bajo. Evaluar si conviene sumarlo si en algún momento se expone más.

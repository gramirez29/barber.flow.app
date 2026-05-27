# Store Submission Content — Barber Flow

Todo el contenido de esta guía debe copiarse manualmente en las consolas de cada tienda al momento de subir la app.

---

## 1. Store Listing — Metadata

### App Store (App Store Connect)

| Campo | Valor |
|-------|-------|
| **Title** (30 chars) | `Barber Flow` |
| **Subtitle** (30 chars) | `Barbershop Management App` |
| **Category** | Business |
| **Age Rating** | 4+ |
| **Keywords** (100 chars) | `barber,barbershop,haircut,appointment,booking,clients,salon,grooming,schedule,hair stylist` |
| **Promotional Text** (170 chars) | `Manage your barbershop with ease — schedule appointments, track clients, and view business reports, all from your phone.` |

### Play Store (Google Play Console)

| Campo | Valor |
|-------|-------|
| **Title** (50 chars) | `Barber Flow` |
| **Short Description** (80 chars) | `Manage clients, appointments & reports for your barbershop.` |
| **Category** | Business |
| **Content Rating** | Everyone |
| **Tags** | appointment booking, business management, barber |

---

## 2. Descripciones Largas (ambas tiendas)

### Inglés

```
Barber Flow is a complete barbershop management app built for professional barbers and hair stylists who want to run their shop without the paperwork.

APPOINTMENTS
Schedule and manage all your appointments in one place. View your day, week, or full history at a glance.

CLIENTS
Build your own client database with names, phone numbers, and contact details. Find any client in seconds.

REPORTS
Track your business performance with revenue and appointment summaries. Know how your shop is doing at any time.

IN-APP NOTIFICATIONS
Get alerts for upcoming appointments and important updates — all within the app.

PERSONALIZATION
Switch between dark and light mode. Available in English and Spanish.

PRIVACY FIRST
Your data stays yours. Delete your account and all associated data at any time directly from the app.

Barber Flow — your shop in your pocket.
```

### Español

```
Barber Flow es una app completa de gestión de barbería, pensada para barberos y estilistas profesionales que quieren administrar su negocio sin complicaciones.

CITAS
Agenda y administra todas tus citas en un solo lugar. Visualiza tu día, semana o historial completo fácilmente.

CLIENTES
Construye tu propia base de datos de clientes con nombres, teléfonos y datos de contacto. Encuentra cualquier cliente en segundos.

REPORTES
Seguí el desempeño de tu negocio con resúmenes de ingresos y citas. Siempre sabé cómo está tu barbería.

NOTIFICACIONES
Recibí alertas de citas próximas y actualizaciones importantes — todo dentro de la app.

PERSONALIZACIÓN
Cambiá entre modo oscuro y claro. Disponible en inglés y español.

PRIVACIDAD PRIMERO
Tus datos son tuyos. Eliminá tu cuenta y toda la información asociada en cualquier momento desde la app.

Barber Flow — tu barbería en tu bolsillo.
```

---

## 3. Play Store — Data Safety Form

### Tipos de datos recopilados

| Categoría | Dato | ¿Requerido? |
|-----------|------|-------------|
| Personal info | Name | Requerido |
| Personal info | Email address | Opcional |
| Personal info | Phone number | Requerido |
| Photos and videos | Photos | Opcional |
| App activity | Other actions (appointments/clients) | Requerido |

### Respuestas para cada tipo de dato

- **¿Se recopila, comparte, o ambos?** → Collected
- **¿Se procesa de forma efímera?** → No
- **¿Es requerido o puede el usuario elegir?** → Name/Phone: Required / Email/Photo: Optional
- **¿Para qué se recopila?** → App functionality
- **¿Está vinculado a la identidad del usuario?** → Yes

### Seguridad de datos

- **¿Todos los datos están encriptados en tránsito?** → Yes
- **¿Se ofrece forma de eliminar los datos del usuario?** → Yes

---

## 4. App Store — Privacy Nutrition Labels

En **App Store Connect → Tu App → Privacy**:

**Data Used to Track You** → **No** (la app no rastrea entre otras apps o sitios)

**Data Linked to You:**

| Categoría | Dato | Uso |
|-----------|------|-----|
| Contact Info | Name | App Functionality |
| Contact Info | Email Address | App Functionality |
| Contact Info | Phone Number | App Functionality |
| Photos or Videos | Photos | App Functionality |
| User Content | Other User Content (citas) | App Functionality |

---

## 5. Play Store — Content Rating (Cuestionario IARC)

| Pregunta | Respuesta |
|----------|-----------|
| ¿Contiene violencia? | No |
| ¿Contiene contenido sexual? | No |
| ¿Contiene lenguaje inapropiado? | No |
| ¿Contiene sustancias controladas? | No |
| ¿Permite interacción entre usuarios? | No |
| ¿Comparte ubicación? | No |
| ¿Contiene juegos de azar? | No |

**Resultado esperado: Everyone / PEGI 3**

---

## 6. Screenshots — Requisitos

### App Store
- **Obligatorio**: iPhone 6.7" → 1290×2796 px (iPhone 15 Pro Max)
- **Recomendado**: también iPhone 5.5" → 1242×2208 px (iPhone 8 Plus)
- Mínimo 3 screenshots por tamaño de dispositivo

### Play Store
- Mínimo 2 screenshots, máximo 8
- Tamaño recomendado: 1080×1920 px (portrait)

### Pantallas sugeridas para capturar
1. Login / pantalla de inicio
2. Dashboard / inicio del barber
3. Lista de citas
4. Detalle de una cita
5. Lista de clientes
6. Pantalla de reportes
7. Configuración / perfil

---

## 7. Pasos para subir la app

### Orden de ejecución

1. Generar builds de producción:
   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```
2. **Google Play Console** (`play.google.com/console`):
   - Crear nueva app
   - Subir el archivo `.aab`
   - Completar Store listing (sección 1 y 2 de este doc)
   - Completar Data safety (sección 3)
   - Completar Content rating (sección 5)
   - Subir screenshots (sección 6)
   - Enviar para revisión

3. **App Store Connect** (`appstoreconnect.apple.com`):
   - Crear nueva app
   - Subir el archivo `.ipa`
   - Completar App Information (sección 1 y 2)
   - Completar Privacy practices (sección 4)
   - Subir screenshots (sección 6)
   - Enviar para revisión

---

## 8. Pendientes

- [ ] **Privacy Policy URL** — el archivo HTML ya está creado en el backend (`wwwroot/privacy-policy/index.html`) y `UseStaticFiles()` ya está habilitado. La URL quedará activa automáticamente al desplegar el backend:
  - **URL a registrar en las tiendas:** `https://barberflowapp-develop.up.railway.app/privacy-policy/`
  - Esta misma URL va en App Store Connect → App Information → Privacy Policy URL
  - Y en Google Play Console → App content → Privacy Policy
- [ ] **Screenshots** — tomar capturas en simulador o dispositivo real
- [ ] **Cuenta de desarrollador Google Play** — requiere pago único de USD 25
- [ ] **Cuenta de desarrollador Apple** — requiere suscripción anual de USD 99

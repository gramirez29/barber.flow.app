# Agenda: spots de 15 min + duración de cita ajustable — plan y decisiones

> Estado: **plan acordado con el usuario (2026-10-02), sin implementar.** Extiende `AGENDA_DAY_VIEW_PLAN.md` (§8 "Duración variable por cita"). Documento vivo: marcar las casillas al terminar cada fase.

## 1. Objetivo

Las citas siguen siendo de **30 min por defecto**, pero hay clientes que toman ~15 min. Por eso:

- La agenda pasa a **spots de 15 min** (una cita de 30 min ocupa 2 spots; una de 15, uno).
- Desde la agenda se puede **acortar a 15 min** (o volver a alargar a 30) una cita; el spot que queda libre se puede ocupar con otra cita.
- Interacción (calcada de Google Calendar):

| Plataforma | Abrir formulario | Mover | Cambiar duración |
|---|---|---|---|
| Mobile y web en pantalla chica | un toque | presión larga + arrastrar (ya existe) | la presión larga muestra un punto arriba y otro abajo del bloque; se arrastran en pasos de 15 min |
| Web en pantalla grande (md+) | un clic | arrastrar con el mouse (ya existe) | el cursor cambia a `↕` en el borde superior/inferior del bloque; se arrastra desde ahí |

## 2. Decisiones tomadas (con el usuario)

| # | Decisión | Detalle |
|---|---|---|
| D1 | Duración por defecto 30 min | `DurationMinutes` nullable; **null = 30** (las citas existentes no cambian). |
| D2 | Regla de choque pasa de "hora exacta" a **traslape** | Una cita de 30 min a las 11:00 bloquea las 11:15 hasta que se acorte. El fin es **exclusivo** (11:00+30 → 11:30; una cita a las 11:30 es válida). |
| D3 | **Punto superior incluido desde la v1** | Cambia la **hora de inicio y la duración** (fin fijo): 11:00–11:30 → 11:15–11:30. El inferior cambia solo el fin. |
| D4 | Hueco de 15 min: se crea **automáticamente de 15** | Al tocar un spot vacío con solo 15 min libres hasta la siguiente cita, el formulario precarga duración 15 (si hay ≥30 libres, 30). El backend igual valida. |
| D5 | Duraciones permitidas | El backend acepta múltiplos de 15 entre 15 y 120 (para crecer); la UI v1 ofrece **15 y 30** y el estiramiento llega hasta donde haya espacio libre. |
| D6 | Selector de duración también en el formulario | Alternativa accesible a los gestos (teclado, lector de pantalla) y forma de ver/editar la duración sin la agenda. |
| D7 | **Web primero, mobile después** | Igual que el plan de la agenda: se valida con el usuario en web antes de portar. La agenda sigue detrás del feature flag. |
| D8 | **Feature flag por barbero, apagado por defecto** | `Barber.Settings.EnableAppointmentDurations` (bool), lo cambia **solo el admin** (mismo patrón que `MaxRecurringAppointments`). Permite activarlo solo para el usuario piloto y apagarlo sin desplegar si algo falla. Ver §3.1. |

## 3.1 Feature flag por barbero (D8)

El flag de dispositivo de la agenda no basta: la regla de choque vive en el backend y afecta a todos los clientes (lista y agenda). Por eso hay **dos capas**, y ambas deben estar encendidas para ver la función completa:

| Capa | Dónde vive | Quién la cambia | Qué controla |
|---|---|---|---|
| **Ajuste del barbero** `EnableAppointmentDurations` | Backend (`Barber.Settings`) | El admin, desde Configuración → Usuarios de aplicación | Regla de choque por traslape, duración efectiva, endpoint `resize`, spots de 15 min, selector de duración en el formulario |
| **Flag de dispositivo** de la agenda (ya existe) | `localStorage`/AsyncStorage | El propio usuario, en Configuración → Preferencias | Si se muestra la agenda por horas (y por tanto los gestos de redimensionar) |

**Con el ajuste apagado (por defecto) todo es idéntico a hoy:**
- Regla de choque: hora exacta (sí **acotada al barbero**, ver §3: es un arreglo de bug, no depende del flag).
- La duración guardada se **ignora en las reglas** (se trata como 30 min). La respuesta devuelve la duración guardada (30 si no hay); **los clientes la ignoran** cuando el ajuste del barbero está apagado (decisión de implementación: resolver el flag por dueño en cada respuesta de lista no valía el costo).
- `PATCH /resize/{id}` responde `400 { code: "FEATURE_DISABLED" }`.
- La agenda sigue con spots de 30 min y sin puntos; el formulario no muestra el selector de duración.

**Reversible sin pérdida de datos:** `DurationMinutes` es un campo aditivo; si el admin apaga el ajuste después de usarlo, las citas acortadas a 15 min se ven de 30 (pueden quedar visualmente encimadas) y todo vuelve al encenderlo. Nada se borra ni se migra.

**Cómo se lee en el cliente:** igual que la cantidad de citas recurrentes: `getBarberByUserName` del usuario logueado (web: `useBarbers`; mobile: `settingsService`). La cuenta `admin` (sin `Barber` vinculado) lo ve siempre apagado. En el backend, `AppointmentService` ya resuelve el `Barber` del dueño para las recurrentes.

## 3. Hallazgo importante (bug preexistente, se arregla en la Fase 1)

`HasConflictAsync(date, time, excludeId)` **no filtra por barbero**: solo compara fecha + hora + estado ≠ cancelada. Como los datos son privados por barbero (`CreatedBy`), hoy una cita del barbero A a las 11:00 **impide al barbero B agendar a las 11:00** y le revela que ese horario está ocupado. Con la regla de traslape esto empeoraría. La nueva regla se **acota al dueño (`CreatedBy`)**. El `excludeId` y los cancelados siguen igual.

## 4. Backend (`barber-flow-api`) — Fase 1

- **Modelo:** `Appointments.DurationMinutes` (`int?`). Constantes: default 30, paso 15, mínimo 15, máximo 120.
- **Flag (D8):** `BarberSettings.EnableAppointmentDurations` (bool, default `false`) en entidad, DTOs y `BarberRequestValidator`; solo se cambia por `PUT /api/barbers/update/{id}` (ya exclusivo del admin). **Cuidado con el bug conocido de `Settings`:** el repositorio reemplaza el bloque completo, así que el diálogo de usuarios debe reenviar comisión, gasto fijo y tope de recurrentes ya cargados para no pisarlos (igual que se hizo con las recurrentes). `AppointmentService` lee el flag del dueño (`IBarberRepository.GetByUserNameAsync`) y, si está apagado, se comporta como hoy (§3.1).
- **DTOs:** `AppointmentRequest` gana `int? DurationMinutes = null` al final (opcional: los clientes viejos y los tests posicionales siguen compilando). `AppointmentResponse` devuelve siempre la duración **efectiva** (`DurationMinutes ?? 30`). Validator: múltiplo de 15 en 15..120 cuando viene.
- **Update (PUT):** si el request **no trae** duración se **conserva la existente** (si no, cada edición desde un cliente viejo la reiniciaría a 30; mismo patrón de bug que ya tuvimos con `Settings`). Se revalida el traslape **solo si cambió fecha, hora o duración** (marcar completada/cancelada una cita pasada nunca se bloquea).
- **Move (PATCH):** conserva la duración y valida el traslape con ella.
- **Endpoint nuevo `PATCH /api/appointments/resize/{id}`** con `{ durationMinutes, time? }`: cambia el fin (solo duración) o el inicio+duración (punto superior). Valida el rango final contra el traslape, excluyendo la propia cita. Respuesta igual que move; choque → `400 { code: "SLOT_TAKEN" }` (los frontends ya lo manejan).
- **Regla de choque:** `HasConflictAsync` → `HasOverlapAsync(owner, date, startMinutes, durationMinutes, excludeId)`: trae las citas **no canceladas del dueño en esa fecha** y compara en memoria (`a.start < nuevoFin && nuevoInicio < a.fin`, con `a.duración = DurationMinutes ?? 30`). Mongo + InMemory. Mensaje: "Ya existe una cita entre 11:00 y 11:30."
- **Citas recurrentes:** cada ocurrencia usa el mismo chequeo con la duración de la cita base.
- **Datos existentes:** las citas que ya se traslapan (p. ej. 11:00 y 11:10 creadas con la regla vieja) **no se tocan**; la regla solo se aplica al crear o cambiar fecha/hora/duración.
- **Tests con el flag:** apagado → choque exacto, duración ignorada (siempre 30), `resize` rechazado, y el reparto por barbero sigue funcionando; encendido → todo lo anterior. Un test confirma que apagar el flag no borra `DurationMinutes`.
- **Tests:** reescribir los de `HasConflictAsync`/choque exacto y agregar: adyacentes OK (11:00–11:30 y 11:30), traslape de 15 bloqueado, acortar libera el spot, cancelada ignorada, **otro barbero ignorado**, legado null=30, update conserva duración, resize (válido, inválido, choque, con `time`), recurrentes con duración.

## 5. Web (`barber-flow-web`) — Fase 2 (detrás del ajuste del barbero **y** del flag de la agenda)

- **Ajuste en Configuración → Usuarios de aplicación (`ApplicationUsersDialog`):** interruptor "Duración de citas ajustable" (oculto para la cuenta `admin`); solo envía `settings` si cambió, reenviando los valores ya cargados. **Lectura:** un hook pequeño (`useAppointmentDurationsEnabled`) con `getBarberByUserName`, como el de las recurrentes en `AppointmentsPage`.
- **Ajuste apagado = agenda actual:** spots de 30 min, sin puntos ni bordes de redimensionar, formulario sin selector de duración.

- **Constantes/lógica pura** (`shared/constants/agenda.ts`, `shared/utils/agendaLayout.ts` + tests): `SLOT_MINUTES = 15`, `SLOT_HEIGHT_PX = 32` (una cita de 30 min mide 64 px; con 26 px los puntos de una cita de 15 min no se podrían agarrar), duración por defecto 30. El fin de cada bloque pasa a `inicio + duración`; los carriles se calculan por traslape real (solo aparecerá con datos legados); el snapping del arrastre pasa a 15; funciones nuevas: `getResizeResult` (limita a rango visible, mínimo 15 y a la cita vecina) y `getFreeMinutesFrom` (para D4).
- **Dominio/API:** `Appointment.durationMinutes`, DTOs y schemas Zod, `AppointmentApi.resize`, `useAppointments.resizeAppointment` (actualización optimista + rollback, `SLOT_TAKEN` como `warning`, igual que `moveAppointment`).
- **`AgendaAppointmentBlock`/`AgendaDayView`:** alto por duración; estado `selectedId` (modo edición); al presionar largo en touch se selecciona y aparecen los dos puntos (área táctil ~28 px, sobresalen del bloque); en escritorio zonas de borde de ~8 px con cursor `ns-resize` y `setPointerCapture`. Arrastrar el cuerpo mueve (dnd-kit, ya existe); arrastrar un punto/borde redimensiona con punteros propios (`touch-action: none` en modo edición). Etiqueta en vivo "11:00 – 11:15"; se sale tocando fuera o con `Esc`.
- **Formulario:** selector de duración (15 / 30) y precarga según D4 al venir de un spot vacío; el toque/clic simple abre el formulario sin retraso (no hay doble toque).
- **Tests:** ampliar `agendaLayout.test.ts` (mínimo 15, límites con la cita vecina, snapping, `getFreeMinutesFrom`).

## 5.1 Implementación en web (Fase 2, rama `feat/web-appointment-duration`)

- **Lógica pura** (`shared/utils/agendaLayout.ts`, `shared/constants/agenda.ts`): la grilla es un parámetro (`AgendaGrid`). `LEGACY_GRID` (30 min, 52 px, la duración se ignora) es la de siempre y los 16 tests anteriores pasan sin cambios; `DURATION_GRID` (15 min, 32 px) se usa con el ajuste encendido. Funciones nuevas: `getAppointmentDuration`, `durationToHeight`, `getBusyRanges`, `getResizeResult` (mínimo 15, máximo 120, limitado a la cita vecina y al rango visible; el punto superior mueve el inicio con el fin fijo), `getFreeMinutesFrom`, `getDefaultDurationForSlot` (D4) y `formatTimeRange`. 17 tests nuevos (`agendaDuration.test.ts`).
- **Hook** `useAppointmentDurationsEnabled(refreshKey)`: lee `settings.enableAppointmentDurations` del barbero logueado (`getBarberByUserName`); apagado mientras carga, sin `Barber` vinculado (cuenta `admin`) o si falla.
- **Agenda:** `AgendaTimeGrid` dibuja spots de la grilla (hora sólida, :30 rayada, cuartos punteados); `AgendaAppointmentBlock` mide según la duración (una sola línea si mide menos de 52 px) y suma los **bordes ↕ de 6 px (escritorio)** y los **puntos de 36 px de área táctil (arriba a la derecha y abajo a la izquierda)** que aparecen tras la presión larga; los puntos se quitan al tocar fuera o con `Esc`. `AgendaDayView` guarda la cita seleccionada, calcula el redimensionado con `getResizeResult`, muestra la etiqueta en vivo "11:00 – 11:15", aplica el cambio de forma optimista y lo revierte si el backend rechaza (`SLOT_TAKEN` como `warning`). El redimensionado y el arrastre no se estorban (`stopPropagation` en los puntos) y soltar no abre el formulario.
- **Datos:** `Appointment.durationMinutes`, `ResizeAppointmentRequest`, `IAppointmentRepository.resize` → `PATCH /api/appointments/resize/{id}`, `useAppointments.resizeAppointment` (sin toast de éxito), `BarberSettings.enableAppointmentDurations`.
- **Formulario:** selector "Duración" (15 / 30 min; muestra también otro valor si la cita ya tiene uno, p. ej. 45) solo con el ajuste encendido; al venir de un spot vacío precarga 15 si solo quedan 15 min libres, si no 30.
- **Admin:** `ApplicationUsersDialog` suma la sección "Agenda" con el interruptor (oculto para la cuenta `admin`); solo envía `settings` si algo cambió y reenvía comisión/gasto cargados.
- **Verificado en navegador** (API local en memoria, barbero de prueba con el ajuste encendido y la cuenta `admin` con el ajuste apagado): 48 spots de 32 px y bloques de 60/28 px; acortar 30→15 (vista previa y persistencia); estirar el borde inferior 15→45; punto superior con fin fijo (13:45–14:45) con la confirmación de "hora ya pasada"; choque real (cita oculta al lado) → `warning` y el bloque vuelve a su tamaño; formulario con duración 15 en el spot de 15 min libres y 30 en uno amplio; presión larga táctil simulada → aparecen los puntos, sin abrir el formulario; se quitan al tocar fuera y con `Esc`; con el ajuste apagado la agenda es idéntica a hoy (24 spots de 52 px, sin bordes); el interruptor del admin enciende/apaga y conserva la comisión.
- **No verificado:** arrastrar los puntos con un **dedo real** en un celular (la presión larga y el redimensionado se simularon con eventos), ni el comportamiento con el scroll de la página en iOS/Android.

## 6. Mobile — Fase 4 (PENDIENTE; backend y web ya están hechos)

**Estado (verificado contra el código el 2026-10-02):** mobile no tiene nada de esta feature (no existe `durationMinutes`, `resize` ni el ajuste del barbero; la agenda usa `SLOT_MINUTES: 30`). El backend (Fase 1, PR #111) y la web (Fase 2 y ajustes de feedback, PRs #112–#115) están en `develop`. Mobile debe **copiar el diseño ya validado en web**; conviene empezar cuando el usuario confirme la web en un dispositivo real. Estimación: ~1.5–2 días, más prueba en dispositivo (iOS y Android). Sin dependencias nativas nuevas (`react-native-gesture-handler` y `react-native-reanimated` ya están instalados) → no requiere más que un build normal.

Rutas relativas a `barber-flow-mobile/Barber.Flow.Mobile/src/`.

### 6.1 Checklist por archivo
1. **Datos y servicio** — `features/appointments/appointments.types.ts`: `durationMinutes?: number` en `Appointment` y `AppointmentDraft`. `services/appointmentService.ts`: mapear `durationMinutes` en `mapRequest`/`mapResponse` y agregar `resize(id, durationMinutes, newTime?)` → `PATCH /api/appointments/resize/{id}` con `{ DurationMinutes, NewTime? }`. `features/appointments/appointment.store.ts`: acción `resizeAppointment` (actualiza la cita con la respuesta).
2. **Ajuste del barbero** — `types/settings.ts`: `enableAppointmentDurations?: boolean` en `BarberSettingsPayload`; leerlo como ya se lee `maxRecurringAppointments` (`services/settingsService.ts`, `getMaxRecurringAppointments`): un `getAppointmentDurationsEnabled` (o un `getBarberSettings` único) que devuelva `false` si falla, si no hay `Barber` vinculado o mientras carga. La cuenta `admin` siempre lo tiene apagado.
3. **Lógica pura** — `utils/agendaLayout.ts`: hoy es un puerto de la lógica web con `AGENDA.SLOT_MINUTES = 30` fijo. Parametrizarla con una `AgendaGrid` igual que web (`LEGACY_GRID` 30 min / 52 px = comportamiento actual; `DURATION_GRID` 15 min / **32 px**), y portar de `barber-flow-web/src/shared/utils/agendaLayout.ts`: `getAppointmentDuration`, `durationToHeight`, `getBusyRanges`, `getResizeResult`, `getFreeMinutesFrom`, `getDefaultDurationForSlot`, `formatTimeRange`, `formatDuration`. `layoutLanes`/`getVisibleRange` pasan a usar `inicio + duración`. Mobile no tiene `jest`: comprobar con un script de Node (`node --experimental-strip-types`) como se hizo con `getDropMinutes`, además de `tsc` + `lint`.
4. **Agenda** — `components/agenda/AgendaDayView.tsx` (ya tiene arrastre con `Gesture.Pan().activateAfterLongPress(250)` + `Gesture.Tap`, scroll bloqueado con `onDragActiveChange`, optimista con `pendingTimes`): 
   - spots de la grilla en uso; alto del bloque según la duración (una sola línea si mide < ~52 px);
   - **modo edición:** la presión larga **selecciona** el bloque (en `onStart`) y al soltar sin mover aparecen **dos puntos** (arriba a la derecha, abajo a la izquierda; **área táctil 36×36**, punto visible 12 px, sobresalen del bloque: sacarlos del contenedor con `overflow: hidden`); los puntos se ocultan **mientras** se arrastra el cuerpo;
   - arrastrar un punto con `Gesture.Pan` propio (sin `activateAfterLongPress`) que calcule `getResizeResult` y muestre la etiqueta en vivo "11:00 – 11:15"; el de abajo cambia el fin, el de arriba cambia el **inicio con el fin fijo** (envía `NewTime`); paso de 15 min, mín. 15 / máx. 120, limitado a las citas vecinas y al rango visible;
   - actualización optimista con **rollback** si el backend rechaza (`SLOT_TAKEN` ya llega como `ApiError.code` desde PR #104 → alert "Horario ocupado");
   - confirmación de "hora ya pasada" solo cuando el punto superior lleva el inicio a una hora pasada;
   - solo citas Agendadas/Confirmadas son redimensionables.
5. **`screens/CalendarScreen.tsx`** — con el ajuste encendido usar `DURATION_GRID` y pasar `onResizeAppointment`; apagado = agenda actual sin cambios. Mantener el flag de dispositivo (`FeatureFlagsContext`) como segunda capa.
6. **Formulario** — `components/calendar/AppointmentForm.tsx` + `features/appointments/useAppointmentForm.ts` + `screens/AppointmentFormScreen.tsx`: selector "Duración" (15 / 30 min; si la cita ya trae otro valor, mostrarlo) solo con el ajuste encendido; al tocar un spot de la agenda con solo 15 min libres precargar 15 (`getDefaultDurationForSlot`), si no 30 (pasar por `initialDraft`). Enviar `durationMinutes` solo si el ajuste está encendido. "Mover cita" y editar no deben reiniciar la duración (el backend conserva la guardada si no se envía).
7. **Admin** — `components/settings/ManageApplicationUsersForm.tsx` (+ `features/settings/settingsForm.ts`, `types/settings.ts`): interruptor "Duración ajustable de citas" (oculto para la cuenta `admin`), mismo patrón que `maxRecurringAppointments`: **solo enviar `settings` si algo cambió** y reenviar comisión/gasto/tope ya cargados (el repositorio reemplaza el bloque completo; el backend conserva solo los campos que llegan nulos).
8. **Localización** — `localization/{es,en}.ts`: etiqueta del interruptor y su descripción, "Duración", "15 min / 30 min", mensajes de acortada/extendida, "hora ya pasada" para el inicio, etiquetas de accesibilidad de los puntos.

### 6.2 Comportamientos acordados con el usuario al probar la web (deben nacer así en mobile)
- **Salir del modo edición:** los puntos desaparecen al **soltar un punto** (acortada, alargada o sin cambios) y al **soltar la cita movida a otro horario**. Una presión larga que se suelta **sin mover nada** mantiene los puntos para poder redimensionar. Tocar fuera de la cita también los quita.
- **Aviso de éxito** al ajustar la duración: "Cita acortada correctamente: ahora dura 15 min" / "Cita extendida correctamente: ahora dura 45 min" ("Cita actualizada correctamente" si no cambió la duración). Decidir el mecanismo: `showAlert` (modal) es pesado para un gesto frecuente → preferible un **Snackbar ligero** (react-native-paper); los rechazos del backend siguen siendo alert.
- **Destino del arrastre por el borde superior del bloque, no por el dedo:** en web fue un bug (PR #115) — con una cita alta el spot bajo el dedo hacía saltar la cita varios spots. En mobile `getDropMinutes` ya calcula por **desplazamiento** (`translationY`): mantenerlo así, verificar con una cita de 1 h agarrada por abajo, y conservar que un roce menor a medio spot no mueva la cita.
- **Spots de 32 px** (con 26 px los puntos de una cita de 15 min no se pueden agarrar) y bloques de 15 min en una sola línea.
- **No se portan:** el botón "Refrescar App" (no aplica a la app nativa), los bordes con cursor `↕`, las pastillas de hover y el arreglo del `:hover` pegado (React Native no tiene hover).

### 6.3 Riesgos y criterio de aceptación
- **Riesgo principal:** conflicto entre scroll de la pantalla, el arrastre tras la presión larga y el arrastre de los puntos en iOS y Android; solo se valida en **dispositivo real** (en web se simuló con eventos y el usuario encontró dos problemas solo al usarlo con el dedo).
- **Criterio:** con el ajuste apagado la pantalla es idéntica a hoy (24 spots de 52 px, sin puntos); encendido: acortar/alargar/mover persiste tras recargar, los choques revierten el bloque con el alert "Horario ocupado", y los puntos se quitan como en 6.2. `npx tsc --noEmit` y `npm run lint` sin errores.

## 7. Fases

- [x] **Fase 1 — Backend (implementada 2026-10-02, 341 tests en verde: 146 Application / 127 Infrastructure / 68 Api)** (1.5–2 días): campo y ajuste `EnableAppointmentDurations`, DTOs/validator, regla de traslape acotada al dueño (condicional al flag), `resize`, update/move/recurrentes, tests. *Criterio:* `dotnet test` en verde; con el flag apagado el comportamiento es el de hoy (más el arreglo por barbero); con clientes viejos (sin duración) todo se comporta como 30 min.
- [x] **Fase 2 — Web, tras el ajuste y el flag (implementada 2026-10-02, pendiente de validación del usuario)** (2–2.5 días): interruptor del admin, spots de 15, modo edición, resize, formulario. *Criterio:* con el ajuste apagado la pantalla es idéntica a hoy; encendido, acortar/alargar/mover persiste tras recargar y los choques revierten el bloque.
- [ ] **Fase 3 — Validación con el usuario en web.** Aquí se confirma el comportamiento real antes de portar.
- [ ] **Fase 4 — Mobile** (~1.5–2 días, **pendiente**; checklist por archivo en §6): mismo diseño. *Requiere prueba en dispositivo real* (presión larga vs. scroll vs. arrastre de puntos en iOS/Android).
- [ ] **Fase 5 — Documentación y PR a `main`** (la documentación de la web y el backend ya está; falta lo de mobile al terminar la Fase 4) (`claude.md` del backend, este plan, `CLAUDE.md` de web) y PR a `main`.

Cada fase va en su propio PR a `develop`. Gracias al ajuste por barbero (D8), la Fase 1 **no cambia nada para nadie** hasta que el admin lo encienda para un barbero; el piloto es solo el usuario que lo pidió. Estimación total: ~5 a 6 días.

**Respaldo:** antes de empezar se creó una copia de `main` (incluye el PR #108): rama `backup/main-2026-10-02` y etiqueta `main-backup-2026-10-02`, ambas en `bf423ce`.

## 8. Riesgos y notas

- **Cambio de regla visible (solo con el ajuste encendido):** quien hoy apila citas a las 11:00 y 11:10 ya no podrá crear la segunda sin acortar la primera (decisión D2, aceptada). Las ya existentes se respetan.
- **Dos barberos, dos reglas:** como el choque ya se acota por dueño, un barbero con el ajuste encendido y otro apagado no se afectan entre sí.
- **Admin:** la cuenta `admin` (sin `Barber`) siempre usa la regla actual; no puede probar la función con esa cuenta (para verificar en local hace falta un barbero de prueba, como con las recurrentes).
- **Gestos en touch:** presión larga (selecciona/mueve), arrastre de puntos y scroll comparten el mismo bloque; solo se valida bien en dispositivo real.
- **Cita de 15 min con spots de 32 px:** el bloque cabe una línea (cliente); el servicio solo se ve en bloques de 30 min o más.
- **Fuera de alcance v1:** estirar a 45/60 desde la UI (el backend ya lo soporta), duración por servicio, horario configurable por barbería.

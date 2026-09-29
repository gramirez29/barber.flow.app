# Vista de agenda por horas (día) — plan y decisiones

> Estado: **fases 1 y 2 implementadas en web, detrás del feature flag (apagado por defecto)** — pendiente de validación del usuario (2026-09-29). Mobile sin tocar. Documento vivo: marcar las casillas de cada fase al terminarla y anotar los hallazgos.

## 1. Objetivo

Una vista de **día tipo agenda** (referencia: Google Calendar / imagen que compartió el usuario) para la pantalla de Citas:

- Franjas ("spots") de **30 minutos** entre las 8:00 y las 20:00.
- Botón **"Añadir el 16 sept"** (fecha seleccionada) que abre el formulario de cita; además, **tocar un spot vacío** abre el formulario con esa hora precargada.
- En el formulario se **selecciona el cliente** y se llenan los campos necesarios.
- Al guardar, el bloque muestra el **nombre del cliente** y el **servicio** (corte, barba, etc.).
- Se puede **presionar y arrastrar** un bloque a otro spot; la hora cambia automáticamente.

Motivación: hoy el día es una lista de tarjetas; no se ve de un vistazo qué huecos libres hay (caso real: cliente que escribe a las 11:10 pidiendo el hueco de las 11:30).

## 2. Decisiones tomadas (con el usuario)

| # | Decisión | Detalle |
|---|---|---|
| D1 | **1 spot (30 min) por cita** | Cada cita ocupa exactamente una franja de 30 min; el bloque tiene el alto de una franja. **Duración variable (p. ej. corte + barba = 60 min) NO está en la v1: se valora después según el uso real** (ver §8). |
| D2 | **Horario 8:00–20:00** | Constante en v1 (`shared/constants/agenda.ts`). El componente recibe `startHour`/`endHour` por props para poder volverlo un **setting de la barbería** más adelante (§8). Se amplía automáticamente si existe una cita fuera de rango (nunca se oculta una cita). |
| D3 | **Convive con la vista actual, detrás de un feature flag** | Flag **apagado por defecto** en Configuración → Preferencias. Apagado = se ve exactamente la vista actual (lista de tarjetas). Encendido = agenda por horas. Los modos Mes y Semana no cambian. |
| D4 | **Web primero, mobile no se toca** | Mobile solo se aborda cuando el usuario confirme que la web funciona. Hasta entonces mobile queda igual. |
| D5 | **Componentes nuevos, sin reescribir los existentes** | Todo el feature vive en componentes/hooks nuevos; los archivos existentes solo reciben cambios **aditivos** (ver §4). |
| D6 | **Backend: sin cambios en las fases 1–2** | Se usan los endpoints actuales tal cual. Si en el futuro se toca backend, solo cambios **aditivos y retrocompatibles** (§8). |

## 3. Feature flag

- **Qué es:** preferencia **por dispositivo** (`localStorage`, clave `barber_flow_flag_agenda_day_view`), default `false`. Mismo patrón que `barber_flow_theme_mode` y `notificationsEnabled`.
- **Dónde se cambia:** `PreferencesCard` (Configuración) — interruptor "Vista de agenda por horas (beta)".
- **Cómo se lee:** un `FeatureFlagsContext` nuevo (`presentation/context/FeatureFlagsContext.tsx`) expone `agendaDayViewEnabled` / `setAgendaDayViewEnabled`, montado en `App.tsx` junto a los demás providers.
- **Por qué local y no backend:** permite probar sin tocar API ni afectar a otros usuarios/dispositivos, y es reversible al instante. Si más adelante se quiere activar por barbero/barbería, el contexto es el único punto a cambiar (leería de la API en vez de `localStorage`).
- **Regla de oro:** con el flag apagado el comportamiento debe ser **idéntico** al actual (sin regresión); cualquier render nuevo cuelga de `if (agendaDayViewEnabled)`.

## 4. Arquitectura (web)

Capas según `ARCHITECTURE_DECISIONS.md`; todo en `presentation/` + lógica pura en `shared/`.

**Archivos nuevos**
```
src/shared/constants/agenda.ts                      SLOT_MINUTES=30, AGENDA_START_HOUR=8, AGENDA_END_HOUR=20, SLOT_HEIGHT_PX
src/shared/utils/agendaLayout.ts                    lógica PURA y testeable (ver abajo)
src/shared/utils/agendaLayout.test.ts               tests vitest (web tiene vitest configurado pero sin tests)
src/presentation/context/FeatureFlagsContext.tsx    flag agenda (localStorage)
src/presentation/components/agenda/
  AgendaDayView.tsx        contenedor: cabecera del día, grid, botón "Añadir el {fecha}"
  AgendaTimeGrid.tsx       líneas por hora / media hora, etiquetas, línea de "ahora", spots vacíos clicables
  AgendaAppointmentBlock.tsx  bloque: cliente + servicio + hora + color de estado (draggable)
  AgendaAddButton.tsx      pill flotante "Añadir el 16 sept"
  ClientAutocomplete.tsx   buscador de cliente (reusa useClients.searchClients) para el formulario
  index.ts
src/presentation/hooks/useAgendaDrag.ts             drag & drop (dnd-kit) + reglas de soltado
```

**`agendaLayout.ts` (funciones puras):** generar los spots del rango; `timeToOffset(time)` / `offsetToTime(px)`; `snapToSlot(minutes)` (→ `:00`/`:30`); `getVisibleRange(appointments, start, end)` (amplía si hay citas fuera); `layoutLanes(appointments)` (citas que se traslapan visualmente van en carriles lado a lado, p. ej. una cita a las 11:00 y otra a las 11:10); `isSameSlot`.

**Archivos existentes que se tocan (solo cambios aditivos)**
- `AppointmentsPage.tsx`: en `viewMode === 'day'`, `agendaDayViewEnabled ? <AgendaDayView/> : <AppointmentAgendaList/>`; nuevos handlers `handleAddAt(time?)` y `handleDropMove` (reusa `moveAppointment`).
- `AppointmentForm.tsx`: prop opcional `defaultTime` y prop opcional para mostrar `ClientAutocomplete` (solo con flag encendido). Sin la prop, el formulario es igual que hoy.
- `PreferencesCard.tsx`: interruptor del flag.
- `App.tsx`: montar `FeatureFlagsProvider`.
- `package.json`: `@dnd-kit/core` (+ `@dnd-kit/modifiers`).

## 5. Comportamiento detallado

**Render**
- Línea sólida por hora, punteada por media hora; etiquetas a la izquierda; línea de "ahora" solo si el día es hoy; al abrir, scroll a la hora actual (o a la primera cita del día).
- Cada cita se dibuja en su **minuto exacto** (`top` proporcional) con alto de 1 spot; si dos se traslapan, carriles lado a lado.
- Bloque: nombre del cliente (negrita), servicio (debajo), hora, y color por estado (mismo mapa que `AppointmentCard`: scheduled `#3B82F6`, confirmed dorado, completed `#10B981`, cancelled rojo). Tocar el bloque abre la edición (flujo actual).

**Agregar**
- Botón "Añadir el {d} {mes}" → formulario con la fecha seleccionada.
- Tocar un spot vacío → formulario con fecha y **hora del spot** precargadas.
- Formulario (flag encendido): `ClientAutocomplete` arriba; al elegir un cliente precarga nombre, teléfono y método de pago (mismo mapeo que `buildAppointmentPrefill`); sigue pudiendo escribirse a mano.

**Arrastrar y soltar (fase 2)**
- Librería: **`@dnd-kit`** (mouse + touch). El `drag` nativo de HTML5 **no funciona con touch** y la web se usa desde el celular / app instalada. En touch, el arrastre empieza con **presión larga** (`TouchSensor` con `delay`) para no pelear con el scroll; en mouse, tras mover unos píxeles.
- Al soltar el destino se **ajusta al spot** (`:00`/`:30`) y se llama a `moveAppointment(id, mismaFecha, nuevaHora)` → `PATCH /api/appointments/move/{id}` (ya soporta `newTime`).
- Actualización **optimista** en pantalla; si el backend falla, el bloque **vuelve a su lugar**.
- **Spot ocupado** (misma hora exacta de otra cita no cancelada): el backend responde `400 SLOT_TAKEN` → advertencia `warning` existente y el bloque vuelve. No se duplica la regla en el cliente.
- **Hora pasada:** confirmación con `useConfirmDialog` (mismo patrón que crear/mover), no bloqueo.
- Solo se pueden arrastrar citas **Agendadas o Confirmadas** (igual que "Mover cita"); Completadas/Canceladas no.
- En una **serie recurrente** se mueve solo esa ocurrencia (cada cita es independiente).
- Arrastre solo dentro del mismo día en v1 (cambiar de día = "Mover cita" del formulario, o arrastrar entre días queda como mejora).

## 6. Backend

**Fases 1–2: ninguno.** Contratos usados, todos existentes y sin modificar:
- `GET /api/appointments/search?date=` (citas del día).
- `PATCH /api/appointments/move/{id}` con `{ newDate, newTime }` (ya usado por la card "Mover cita").
- Regla de choque exacto + `400 { code: "SLOT_TAKEN" }` (ver `barber-flow-api/Barber.Flow.Api/claude.md`).

## 7. Fases

- [x] **Fase 1 — Timeline de día (web, sin drag):** constantes, `agendaLayout.ts` + tests, `FeatureFlagsContext` + interruptor, `AgendaDayView`/`Grid`/`Block`/`AddButton`, integración en `AppointmentsPage`, spot vacío + botón abren el formulario con hora precargada, `ClientAutocomplete`. *Criterio:* con el flag apagado la pantalla es idéntica a hoy; encendido muestra la agenda y permite crear/editar citas.
- [x] **Fase 2 — Arrastrar y soltar (web):** `useAgendaDrag`, dnd-kit, snap, optimista + rollback, `SLOT_TAKEN`, confirmación de hora pasada. *Criterio:* mover con mouse y con touch (presión larga) funciona y persiste tras recargar.
- [ ] **Fase 3 — Validación con el usuario en producción** (flag encendido solo en sus dispositivos). Ajustes de UX según feedback. **Aquí se decide si se pasa a mobile.**
- [ ] **Fase 4 — Mobile:** timeline (`CalendarScreen`, modo día) con el mismo diseño; `react-native-gesture-handler` + `reanimated` (ya instalados) para el arrastre con presión larga; `appointmentService.move` debe **enviar también la hora** (hoy solo manda `NewDate`). Feature flag equivalente en Settings. Requiere build nuevo.
- [ ] **Fase 5 (opcional) — Setting de horario y/o duración variable** (ver §8).

## 7.1 Implementación (lo que quedó en el código)

**Estilo:** todo usa `appColors` (fondo oscuro, dorado `#C9A84C`, texto `#FFF`/`#A1A1AA`), Roboto del theme MUI y el mismo lenguaje de las demás pantallas (bordes de 1px, radios 10–20px, pill dorada tipo "Nueva cita", scrollbar dorado de `scrollbarSx`). Colores de estado en `presentation/theme/statusColors.ts` (mismo mapa que `AppointmentCard`).

**Archivos nuevos**
- `shared/constants/agenda.ts` — `AGENDA` (spot 30 min, 8–20, alto de spot 52 px, gutter 56 px) y la clave del flag.
- `shared/utils/agendaLayout.ts` (+ `agendaLayout.test.ts`, 16 tests vitest) — funciones puras: rango visible (se amplía con citas fuera de horario), spots, offsets, carriles (`layoutLanes`), etiquetas AM/PM, `isAgendaMovable`.
- `presentation/context/FeatureFlagsContext.tsx` — `agendaDayViewEnabled` (localStorage `barber_flow_flag_agenda_day_view`, default `false`, tolerante a localStorage no disponible). Montado en `App.tsx`.
- `presentation/components/agenda/`: `AgendaDayView` (contenedor + `DndContext`), `AgendaTimeGrid` (spots clicables/droppables, línea de "ahora"), `AgendaAppointmentBlock` (bloque arrastrable), `AgendaAddButton` ("Añadir el 29 sep"), `ClientAutocomplete` (buscador de cliente).
- `presentation/theme/statusColors.ts`.

**Archivos existentes tocados (solo cambios aditivos)**
- `AppointmentsPage.tsx`: en `viewMode === 'day'` renderiza `AgendaDayView` si el flag está encendido, si no la lista de siempre; `openCreateForm(time?)`, `handleAddAt`, `handleAgendaMove` (confirma hora pasada y llama a `moveAppointment`).
- `AppointmentForm.tsx`: props opcionales `defaultTime` y `enableClientPicker` (sin ellas el formulario es igual que antes; el buscador solo aparece al crear).
- `PreferencesCard.tsx`: interruptor "Vista de agenda por horas (beta)".
- `package.json`: `@dnd-kit/core` (sin `@dnd-kit/modifiers`: el bloqueo al eje vertical es un modifier de 1 línea).

**Decisiones técnicas**
- Detección de destino con `pointerWithin` sobre un droppable por spot (`slot-HH:mm`); el bloque solo se mueve en vertical.
- Sensores: `MouseSensor` (distancia 6 px) y `TouchSensor` (presión larga 250 ms, tolerancia 8 px) para no pelear con el scroll en celular. Tras soltar se ignora el click 300 ms para no abrir la edición.
- Actualización optimista con mapa `pendingTimes`: la cita se ve en la hora nueva (atenuada) mientras corre el `PATCH`; al terminar (éxito o error) se limpia y se muestra lo que dicen los datos, así que un rechazo (`SLOT_TAKEN`) la devuelve a su lugar.
- Hora pasada: `useConfirmDialog` ("Hora ya pasada"); si se cancela, la cita vuelve.
- El bloque mide 1 spot (D1). Citas en el mismo rango de 30 min se reparten en carriles (nombre truncado con "…" en pantallas angostas).
- **Altura responsive (2026-09-29):** en **celular** la agenda se ve a altura completa (24 spots, sin scroll interno) y es la **página** la que se desplaza: al entrar a "hoy", si la línea de "ahora" queda fuera de pantalla, la página se desplaza para dejarla a ~1/3 de la altura (una vez por día mostrado). En **pantallas grandes (md, 900px+)** la agenda va en una caja de `68vh` con scroll propio (scrollbar dorado) que se posiciona en la hora actual / primera cita. El botón "Añadir el {fecha}" es `position: sticky` al borde inferior de la pantalla. Detalle: el wrapper sticky mide 0px de alto y usa `alignItems: flex-end` para que el botón crezca hacia arriba (con `stretch` el hijo se aplastaba a 0px y `translateY(-100%)` no lo subía, dejándolo cortado por el pie de la pantalla); además se oculta con un fade cuando el borde superior de la agenda asoma a menos de 96px del pie de la pantalla, porque un sticky se clava al borde superior de su contenedor y ahí no cabría entero. Antes de este ajuste todo era una caja de 62vh/68vh con scroll interno en ambos casos.
- **Selector de vistas de Citas (2026-09-29):** el orden ahora es **Día · Semana · Mes** y la vista por defecto al abrir Citas es **Día** (antes Mes). Aplica con el flag apagado o encendido.
- Verificado en navegador local (barbero de prueba): flag apagado = vista actual intacta; encendido = agenda; spot vacío y botón abren el formulario (con/sin hora); buscador de cliente precarga nombre/teléfono/pago; cita creada aparece en su spot con cliente + servicio; arrastrar a otro spot persiste (confirmado con la API); soltar en hora pasada pide confirmación y cancelar revierte; soltar en un horario ocupado muestra la advertencia y revierte; tocar un bloque abre "Editar cita"; layout correcto a ~390 px. **No probado:** arrastre con touch real (presión larga) en un celular.

## 8. Futuro (no incluido, decidido posponer)

**Duración variable por cita (D1).** Si el uso real lo pide:
- Campo **aditivo** `DurationMinutes` (nullable, default 30) en `Appointments` + DTOs; las citas existentes (`null`) se comportan como 30 min → nada se rompe.
- El bloque pasaría a medir `duración/30` spots y se podría estirar para cambiarla.
- **Riesgo a decidir entonces:** la regla de choque hoy es "misma fecha+hora exacta" (acordada con el usuario). Con duraciones habría que pasar a "se traslapan", lo que **cambia una regla de negocio**; hacerlo detrás de la existencia de `DurationMinutes` para no afectar citas antiguas.

**Horario como setting de la barbería (D2).** Campos aditivos nullable `OpenHour`/`CloseHour` en `BarberShop` (+ endpoint de lectura/edición, validación 0–24 y `open < close`); si son `null`, se usa 8–20. El cliente los lee del `ShopId` del barbero. Hoy no se hace porque no hay UI/endpoint para editar la barbería y los barberos no pueden actualizar sus settings (solo el admin).

## 9. Riesgos y notas

- **Scroll vs. arrastre en touch:** por eso presión larga (`TouchSensor` + `delay`); probar en un celular real.
- **Citas fuera de la grilla (11:10):** se dibujan en su minuto; al arrastrar se ajustan a `:00`/`:30`. Un traslape visual **no** es choque (solo lo es la misma hora exacta).
- **Zona horaria / "hoy":** usar la fecha y hora locales del dispositivo (mismo criterio que el resto de la app).
- **Tests:** la lógica de posiciones/carriles va en funciones puras con `vitest` (web tiene el runner sin tests). Mobile no tiene `jest` (`npm test` roto): se validará con `tsc` + prueba en dispositivo.
- **Modo Seguro del admin:** no cambia; el admin sigue sin ver Citas con el modo activo.
- **Verificación local:** un barbero de prueba (el admin no ve Citas con Modo Seguro y no tiene `Barber` vinculado), como se hizo con las citas recurrentes.

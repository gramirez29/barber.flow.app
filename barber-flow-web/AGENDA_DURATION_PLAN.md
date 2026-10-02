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

## 3. Hallazgo importante (bug preexistente, se arregla en la Fase 1)

`HasConflictAsync(date, time, excludeId)` **no filtra por barbero**: solo compara fecha + hora + estado ≠ cancelada. Como los datos son privados por barbero (`CreatedBy`), hoy una cita del barbero A a las 11:00 **impide al barbero B agendar a las 11:00** y le revela que ese horario está ocupado. Con la regla de traslape esto empeoraría. La nueva regla se **acota al dueño (`CreatedBy`)**. El `excludeId` y los cancelados siguen igual.

## 4. Backend (`barber-flow-api`) — Fase 1

- **Modelo:** `Appointments.DurationMinutes` (`int?`). Constantes: default 30, paso 15, mínimo 15, máximo 120.
- **DTOs:** `AppointmentRequest` gana `int? DurationMinutes = null` al final (opcional: los clientes viejos y los tests posicionales siguen compilando). `AppointmentResponse` devuelve siempre la duración **efectiva** (`DurationMinutes ?? 30`). Validator: múltiplo de 15 en 15..120 cuando viene.
- **Update (PUT):** si el request **no trae** duración se **conserva la existente** (si no, cada edición desde un cliente viejo la reiniciaría a 30; mismo patrón de bug que ya tuvimos con `Settings`). Se revalida el traslape **solo si cambió fecha, hora o duración** (marcar completada/cancelada una cita pasada nunca se bloquea).
- **Move (PATCH):** conserva la duración y valida el traslape con ella.
- **Endpoint nuevo `PATCH /api/appointments/resize/{id}`** con `{ durationMinutes, time? }`: cambia el fin (solo duración) o el inicio+duración (punto superior). Valida el rango final contra el traslape, excluyendo la propia cita. Respuesta igual que move; choque → `400 { code: "SLOT_TAKEN" }` (los frontends ya lo manejan).
- **Regla de choque:** `HasConflictAsync` → `HasOverlapAsync(owner, date, startMinutes, durationMinutes, excludeId)`: trae las citas **no canceladas del dueño en esa fecha** y compara en memoria (`a.start < nuevoFin && nuevoInicio < a.fin`, con `a.duración = DurationMinutes ?? 30`). Mongo + InMemory. Mensaje: "Ya existe una cita entre 11:00 y 11:30."
- **Citas recurrentes:** cada ocurrencia usa el mismo chequeo con la duración de la cita base.
- **Datos existentes:** las citas que ya se traslapan (p. ej. 11:00 y 11:10 creadas con la regla vieja) **no se tocan**; la regla solo se aplica al crear o cambiar fecha/hora/duración.
- **Tests:** reescribir los de `HasConflictAsync`/choque exacto y agregar: adyacentes OK (11:00–11:30 y 11:30), traslape de 15 bloqueado, acortar libera el spot, cancelada ignorada, **otro barbero ignorado**, legado null=30, update conserva duración, resize (válido, inválido, choque, con `time`), recurrentes con duración.

## 5. Web (`barber-flow-web`) — Fase 2 (detrás del flag de la agenda)

- **Constantes/lógica pura** (`shared/constants/agenda.ts`, `shared/utils/agendaLayout.ts` + tests): `SLOT_MINUTES = 15`, `SLOT_HEIGHT_PX = 32` (una cita de 30 min mide 64 px; con 26 px los puntos de una cita de 15 min no se podrían agarrar), duración por defecto 30. El fin de cada bloque pasa a `inicio + duración`; los carriles se calculan por traslape real (solo aparecerá con datos legados); el snapping del arrastre pasa a 15; funciones nuevas: `getResizeResult` (limita a rango visible, mínimo 15 y a la cita vecina) y `getFreeMinutesFrom` (para D4).
- **Dominio/API:** `Appointment.durationMinutes`, DTOs y schemas Zod, `AppointmentApi.resize`, `useAppointments.resizeAppointment` (actualización optimista + rollback, `SLOT_TAKEN` como `warning`, igual que `moveAppointment`).
- **`AgendaAppointmentBlock`/`AgendaDayView`:** alto por duración; estado `selectedId` (modo edición); al presionar largo en touch se selecciona y aparecen los dos puntos (área táctil ~28 px, sobresalen del bloque); en escritorio zonas de borde de ~8 px con cursor `ns-resize` y `setPointerCapture`. Arrastrar el cuerpo mueve (dnd-kit, ya existe); arrastrar un punto/borde redimensiona con punteros propios (`touch-action: none` en modo edición). Etiqueta en vivo "11:00 – 11:15"; se sale tocando fuera o con `Esc`.
- **Formulario:** selector de duración (15 / 30) y precarga según D4 al venir de un spot vacío; el toque/clic simple abre el formulario sin retraso (no hay doble toque).
- **Tests:** ampliar `agendaLayout.test.ts` (mínimo 15, límites con la cita vecina, snapping, `getFreeMinutesFrom`).

## 6. Mobile — Fase 4 (después de validar web)

Portar `utils/agendaLayout.ts`, `AgendaDayView` (modo edición con `Gesture.Pan` sobre los puntos + el arrastre actual; la presión larga selecciona al activarse; scroll bloqueado mientras se arrastra), `appointmentService.resize`, tipos/store, selector de duración en el formulario y traducciones. Sin build nativo nuevo (gesture-handler y reanimated ya están).

## 7. Fases

- [ ] **Fase 1 — Backend** (1–1.5 días): campo, DTOs/validator, regla de traslape acotada al dueño, `resize`, update/move/recurrentes, tests. *Criterio:* `dotnet test` en verde; con clientes viejos (sin duración) todo se comporta como 30 min.
- [ ] **Fase 2 — Web, tras el flag** (1.5–2 días): spots de 15, modo edición, resize, formulario. *Criterio:* acortar/alargar/mover persiste tras recargar; choques revierten el bloque.
- [ ] **Fase 3 — Validación con el usuario en web.** Aquí se confirma el comportamiento real antes de portar.
- [ ] **Fase 4 — Mobile** (~1.5 días): mismo diseño. *Requiere prueba en dispositivo real* (presión larga vs. scroll vs. arrastre de puntos en iOS/Android).
- [ ] **Fase 5 — Documentación** (`claude.md` del backend, este plan, `CLAUDE.md` de web) y PR a `main`.

Cada fase va en su propio PR a `develop`. La Fase 1 es retrocompatible, pero **cambia la regla de choque para todos los clientes** (lista y agenda), no solo para quien use la agenda por horas.

## 8. Riesgos y notas

- **Cambio de regla visible:** quien hoy apila citas a las 11:00 y 11:10 ya no podrá crear la segunda sin acortar la primera (decisión D2, aceptada). Las ya existentes se respetan.
- **Gestos en touch:** presión larga (selecciona/mueve), arrastre de puntos y scroll comparten el mismo bloque; solo se valida bien en dispositivo real.
- **Cita de 15 min con spots de 32 px:** el bloque cabe una línea (cliente); el servicio solo se ve en bloques de 30 min o más.
- **Fuera de alcance v1:** estirar a 45/60 desde la UI (el backend ya lo soporta), duración por servicio, horario configurable por barbería.

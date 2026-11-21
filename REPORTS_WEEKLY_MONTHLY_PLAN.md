# Plan de implementación — Reportes semanal y mensual

Estado: **plan, sin implementar** (2026-11-20). El reporte diario ya existe en web y mobile y **no se modifica**.

## 1. Objetivo y alcance

Agregar a la pantalla de reportes de **web y mobile** dos periodos nuevos junto al diario: **Semana** y **Mes**.
Cada periodo muestra las mismas métricas del diario (clientes atendidos, ingresos brutos, comisión, gasto fijo, ganancia neta, desglose por método de pago), con la **misma apariencia que el reporte diario**. Además, un botón **"Ver detalle"** despliega una tabla con los números de cada día del periodo (ver §2).

Fuera de alcance: exportar a PDF/Excel, gráficos, comparar contra el periodo anterior, mover el reporte diario de mobile al backend (ver §9, riesgo 4).

## 2. Decisiones ya tomadas

| Tema | Decisión |
|---|---|
| Inicio de semana | **Domingo a sábado** (confirmado). |
| Gasto fijo diario | Se resta **por cada día del periodo**, y si el periodo sigue en curso **solo hasta hoy** (hora de Costa Rica). Así el neto semanal es exactamente la suma de los netos diarios. El valor por defecto es ₡0, así que hoy no cambia ninguna cifra. |
| Comisión | Se calcula **por día y se redondea por día** (como el diario) y se suman; así el total del periodo cuadra al céntimo con la suma de los diarios. |
| Detalle por día | **Confirmado:** la pantalla muestra solo los totales (como el diario); un botón **"Ver detalle"** despliega la tabla por día (fecha, clientes, bruto, neto) y vuelve a ocultarse ("Ocultar detalle"). Por defecto está oculta. Se despliega **en la misma pantalla**, sin modal ni navegación nueva, en web y en mobile. Tocar una fila abre el reporte **diario** de ese día. |
| Mobile | Semana y mes consumen el **backend** (un solo lugar de cálculo); el diario de mobile sigue calculándose en el teléfono. |
| Notificaciones | Se paginan aparte (10 + "Ver más"); no dependen de este plan. |
| Título de la pantalla | **Confirmado:** pasa de "Reporte diario" / "Cierre diario" a **"Reportes"**. Mobile: la etiqueta de la pestaña (`navigation.dailyReport`) y el título de la pantalla (`dailyReport.title`, hoy "Cierre diario") en `es.ts` y `en.ts`; se conservan los nombres de las llaves para no mover código. Web: el menú ya dice "Reportes"; el título del hero cambia según el periodo ("Reporte de cierre diario / semanal / mensual"). |

### 2.1 Reglas de UI (obligatorias en web y mobile)

Todo lo que se agregue a la interfaz **debe usar los temas, colores, tipografías, espaciados y componentes que ya usa cada app**, sin inventar estilos nuevos:

- **Web:** colores solo desde `appColors` (`src/presentation/theme/appColors.ts`: `surface`, `surfaceElevated`, `border`, `accent`, `textPrimary`/`textSecondary`, `error`, `onAccent`…), sin hex nuevos; tipografía del tema MUI (`theme.ts`), mismas tarjetas (radio 20 px, borde `border`, fondo `surface`), mismas pills para el selector Día · Semana · Mes que el selector de vistas de Citas, y el botón "Ver detalle" con el mismo estilo de los botones secundarios existentes (p. ej. el "Hoy" del hero de reportes).
- **Mobile:** todo con `useAppTheme()` y `createStyles(theme)` (`theme.colors.*`), de modo que respete el modo claro y oscuro; mismos estilos de tarjeta, chips y botones que ya tiene `DailyReportScreen` (`btnPrimary`/`btnSecondary`, `card`, `eyebrow`, `sectionTitle`), `react-native-paper` solo donde ya se use, y **todos los textos por `translateText` con llaves en `es.ts` y `en.ts`** (nada de textos fijos).
- Montos con los formateadores existentes (`formatCurrency`, mismo `Intl.NumberFormat` en ₡).
- Verificación visual obligatoria antes de dar el trabajo por listo: web en navegador (claro/oscuro si aplica) y mobile en dispositivo real, en modo claro y oscuro.

## 3. Prerrequisito

**PR #130 (tope de 50 citas) debe estar mergeado y desplegado antes de usar estos reportes en serio.** La búsqueda de citas por rango siempre cortaba a 50 resultados; sin ese arreglo, el mes saldría incompleto sin ningún error.

## 4. Backend (`barber-flow-api`)

### 4.1 Contrato

Dos endpoints nuevos, ambos `RequireAuthorization()`, en `ReportsApi.cs`:

- `GET /api/reports/weekly?date=yyyy-MM-dd` → la semana (dom–sáb) que contiene esa fecha. Sin `date` = hoy (hora de Costa Rica).
- `GET /api/reports/monthly?month=yyyy-MM` → el mes calendario. Sin `month` = mes actual.
- Parámetro inválido → `400 { message }` (mismo estilo que el diario).

Respuesta común `PeriodReportResponse`:

```
periodType            "weekly" | "monthly"
from, to              fechas (yyyy-MM-dd) del periodo completo
countedDays           días a los que se les resta gasto fijo (hasta hoy si el periodo está en curso)
totalCustomersServed  int
grossRevenue          decimal
commissionAmount      decimal   (suma de comisiones diarias redondeadas)
fixedDailyExpense     decimal   (gasto fijo por día, el valor configurado)
fixedExpenseTotal     decimal   (fixedDailyExpense × countedDays)
netProfit             decimal   (gross − commission − fixedExpenseTotal)
paymentMethodBreakdown[]  igual que el diario (cash, sinpeMovil, transfer, none)
days[]                { date, totalCustomersServed, grossRevenue, commissionAmount, fixedExpense, netProfit }
generatedAt
```

`days` trae **todos** los días del periodo (también los de cero ventas), ordenados por fecha, para que la lista por día no necesite rellenar huecos.

### 4.2 Cambios por capa

- **Domain**
  - `ReportPeriods` (value object estático, puro): `GetWeek(DateOnly anchor)` → (from, to) dom–sáb; `GetMonth(int year, int month)` → (primer día, último día).
  - `PeriodReport` / `PeriodReportDay` (entidades, junto a `DailyReport`).
  - `IReportRepository.GetPeriodReportAsync(DateOnly from, DateOnly to, string periodType, DateOnly today, string? requestingUserName, CancellationToken)`. Recibir `today` evita que el repositorio dependa del reloj y facilita los tests.
- **Application**
  - `IReportService`/`ReportService`: `GetWeeklyReportAsync(DateOnly anchor, ...)` y `GetMonthlyReportAsync(int year, int month, ...)` → calculan el rango con `ReportPeriods` y delegan.
  - "Hoy" se calcula con **UTC−6** (Costa Rica no tiene horario de verano; evita depender de `tzdata` en el contenedor). Centralizarlo en un `CostaRicaClock` pequeño e inyectable.
- **Infrastructure**
  - `MongoDbReportRepository`: extraer lo compartido con el diario (`NormalizePaymentMethod`, armado del desglose) a métodos privados y agregar `GetPeriodReportAsync`:
    1. Resolver el `Barber` del usuario (igual que el diario) → comisión %, gasto fijo y filtro `createdBy`.
    2. `FindAsync(date: from, endDate: to, status: "completed", createdBy: ...)` (sin paginar, ver §3).
    3. Agrupar por fecha; por cada día del periodo calcular bruto, comisión redondeada y gasto fijo (solo si `date <= today`).
    4. Sumar para los totales y el desglose por método de pago.
  - `InMemoryReportRepository`: implementar sumando los reportes diarios falsos que ya genera (solo para desarrollo local y tests de API).
- **Api**: DTOs en `DTOs/Responses/PeriodReportResponse.cs`, parseo de `month`/`date`, mapeo.

### 4.3 Tests

- **Domain** (`ReportPeriodsTests`): semana que cruza fin de mes y de año; ancla en domingo y en sábado; febrero bisiesto y no bisiesto; meses de 28/29/30/31 días.
- **Infrastructure** (`MongoDbReportRepositoryTests`, con mocks como los del diario):
  - el total de la semana = suma de los diarios (bruto, comisión, neto, clientes);
  - gasto fijo: periodo pasado = todos los días; en curso = solo hasta hoy; futuro = 0;
  - comisión redondeada por día (caso con centavos que difiere de redondear el total);
  - filtro por barbero (`createdBy`) y cuenta admin sin filtro; sin `Barber` → 40 % / ₡0 por defecto;
  - citas no completadas se ignoran; método de pago viejo `sinpe_movil` se normaliza; el desglose cuadra con el bruto;
  - periodo vacío devuelve todos los días en cero.
- **Api** (`ReportsApiTests`): sin token → 401; fecha/mes inválidos → 400; forma de la respuesta con `days` completo.

## 5. Web (`barber-flow-web`)

- **Dominio/DTOs:** `PeriodReport`, `PeriodReportDay` en `domain/entities/Report.ts`; `IReportRepository.getWeeklyReport(date)` y `getMonthlyReport(month)`; `ReportApi` con las dos llamadas; constantes de endpoints.
- **Hook `useReports`:** estado `period: 'daily' | 'weekly' | 'monthly'`, `periodReport`, `fetchWeekly`, `fetchMonthly`, y navegación anterior/siguiente (±7 días, ±1 mes). El diario no cambia.
- **Utilidades puras** (`shared/utils/reportPeriods.ts` + tests con vitest): inicio/fin de semana dom–sáb, etiqueta legible ("dom 15 – sáb 21 nov"), mes anterior/siguiente, formato `yyyy-MM`.
- **UI** (`ReportsPage` + `components/reports/`):
  - Selector **Día · Semana · Mes** arriba (mismo estilo de pills que el selector de vistas de Citas).
  - `ReportHeroCard`: títulos y selector según periodo — día: `input date` + "Hoy" (como hoy); semana: `input date` + etiqueta del rango + flechas; mes: `input month` + flechas.
  - Reutilizar sin cambios de lógica: `ReportMetricsGrid`, `ReportCollectionsCard`; `ReportFormulaCard` muestra el gasto como "₡X × N días".
  - Nuevo `ReportDaysList`: una fila por día (fecha, clientes, bruto, neto); tocar una fila abre el reporte **diario** de ese día. Va **oculto por defecto** detrás de un botón **"Ver detalle" / "Ocultar detalle"** (estado local del componente, sin llamada extra: `days` ya viene en la respuesta). En semana/mes **no se muestra** `ReportAttendanceList` (la lista de citas del día solo existe en el diario).
- Textos en español fijo, igual que el resto de las pantallas de reportes de web (sin i18n).
- Verificación: `npm run lint` (0 avisos), `vitest`, `npm run build`, y prueba en navegador con la API local.

## 6. Mobile (`barber-flow-mobile`)

- **Servicio y tipos:** `services/reportService.ts` (`GET /weekly` y `/monthly` vía `apiFetch`, con normalización de mayúsculas como en los otros servicios) y `types/reports.ts`.
- **Hook** `features/reports/usePeriodReport.ts`: periodo, ancla, `isLoading`, `error`, `refetch`, anterior/siguiente.
- **UI:** `DailyReportScreen` (641 líneas) no debe crecer más:
  - chips **Día · Semana · Mes** en el hero (el selector de fecha del diario queda igual);
  - componente nuevo `components/reports/PeriodReportView` con métricas, fórmula y cobros (mismas tarjetas que el diario), y debajo un botón **"Ver detalle" / "Ocultar detalle"** que despliega la tabla por día en la misma pantalla; flechas anterior/siguiente en lugar del `DateTimePicker` (que solo elige días);
  - tocar una fila del detalle cambia al diario con esa fecha.
- **i18n:** llaves nuevas en `es.ts` y `en.ts` (`dailyReport.period.*`, etiquetas de rango, "N días", "Ver detalle" / "Ocultar detalle"). Renombrar a "Reportes" la etiqueta de la pestaña (`navigation.dailyReport`) y el título de la pantalla (`dailyReport.title`).
- **Estilos:** seguir las reglas de §2.1 (tema claro/oscuro, `createStyles(theme)`, sin colores fijos).
- Verificación: `npx tsc --noEmit`, `npm run lint` (4 avisos preexistentes). **Requiere build nuevo** (sin `expo-updates`) y no se puede probar en emulador desde este entorno; hay que validarlo en un dispositivo.

## 7. Orden de trabajo y PRs

1. **PR backend** (después de mergear y desplegar #130): dominio, servicio, repositorio, endpoints y tests. Es lo más grande y lo que sostiene el resto.
2. **PR web**: hook, utilidades, UI y tests.
3. **PR mobile**: servicio, hook, UI, textos.
4. Cada PR sale de `develop` actualizado; web y mobile se pueden hacer en paralelo una vez que el backend esté en `develop`.

Estimado: backend 5–7 h, web 4–6 h, mobile 5–7 h (**14–20 h** en total).

## 8. Plan de verificación de punta a punta

1. API local con repositorios en memoria: crear citas completadas en 3 días distintos de una semana, con métodos de pago distintos.
2. Comprobar que `weekly` = suma de los tres `daily` (bruto, comisión redondeada, neto) y que el desglose por método cuadra con el bruto.
3. Cambiar la comisión del barbero y el gasto fijo (Configuración) y confirmar que se reflejan en semana y mes.
4. Probar una semana que cruza de mes y el mes actual (el gasto fijo solo cuenta hasta hoy).
5. Probar con un barbero distinto: no debe ver las citas del primero; con la cuenta admin se ve el agregado de todos (igual que el diario hoy).

## 9. Riesgos y puntos abiertos

1. **Tope de 5000 resultados** (de #130): un barbero normal queda muy por debajo (un mes ≈ 300 citas); si se superara, el periodo se cortaría sin aviso.
2. **Hora de Costa Rica:** "hoy" y el cambio de periodo en curso dependen de UTC−6; cubierto con tests inyectando `today`.
3. **Cuenta admin:** sus reportes de periodo son el agregado de **todos** los barberos con comisión 40 % / ₡0 por defecto (igual que el diario actual). Se mantiene tal cual; conviene recordarlo al revisar cifras.
4. **Diario local vs. periodo en backend (mobile):** el diario de mobile calcula en el teléfono (comisión desde AsyncStorage, sin normalizar métodos de pago viejos) y semana/mes vendrán del backend, así que podrían diferir por centavos o categorías en casos raros. Mitigación: la prueba manual del punto 8.2 y, más adelante, mover también el diario de mobile al backend (cambio aparte).
5. **Gasto fijo:** si algún día se quiere restar solo en días trabajados, es una regla distinta (días con citas completadas). Hoy no importa porque el valor es ₡0; si se confirma que no se necesita, también puede retirarse el campo (limpieza aparte).
6. **Sin puntos pendientes de decisión:** el detalle por día (botón "Ver detalle") y el título "Reportes" ya están confirmados.

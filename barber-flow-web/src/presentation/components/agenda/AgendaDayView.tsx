import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  Modifier,
  MouseSensor,
  TouchSensor,
  CollisionDetection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Appointment } from '@domain/entities/Appointment';
import { AGENDA, AgendaGrid, LEGACY_GRID } from '@shared/constants/agenda';
import {
  ResizeHandle,
  ResizeResult,
  getBusyRanges,
  getNearestSlot,
  getResizeResult,
  getVisibleRange,
  isAgendaMovable,
  layoutLanes,
  minutesToOffset,
  minutesToTime,
  timeToMinutes,
} from '@shared/utils/agendaLayout';
import { appColors } from '@presentation/theme/appColors';
import { scrollbarSx } from '@presentation/theme/scrollbarSx';
import { AgendaAddButton } from './AgendaAddButton';
import { AgendaAppointmentBlock } from './AgendaAppointmentBlock';
import { AgendaTimeGrid } from './AgendaTimeGrid';

/** Alto del botón (46) + margen inferior (16) + holgura: por debajo de esto el botón no cabe entero. */
const ADD_BUTTON_CLEARANCE_PX = 96;

interface AgendaDayViewProps {
  date: Date;
  /** Citas del día mostrado. */
  appointments: Appointment[];
  startHour?: number;
  endHour?: number;
  /**
   * Grilla de spots. Por defecto la de siempre (30 min, cada cita ocupa un spot). Con `DURATION_GRID`
   * (ajuste "duración ajustable" del barbero) los spots son de 15 min y cada cita ocupa su duración.
   */
  grid?: AgendaGrid;
  /** Botón "Añadir el {fecha}" (sin hora) o toque en un spot vacío (con la hora del spot). */
  onAddAt: (time?: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  /**
   * Se llama al soltar una cita en otro spot. Debe mover la cita (y lanzar si falla). Si se omite, el
   * arrastre queda deshabilitado. Mientras la promesa está pendiente la cita se muestra en su nueva hora.
   */
  onMoveAppointment?: (appointment: Appointment, newTime: string) => Promise<void>;
  /**
   * Se llama al soltar un punto/borde de redimensionar. `newTime` solo viene cuando también cambió el inicio
   * (punto superior). Debe guardar y lanzar si falla (el bloque vuelve a su tamaño). Si se omite, no se puede
   * redimensionar (ajuste del barbero apagado).
   */
  onResizeAppointment?: (appointment: Appointment, durationMinutes: number, newTime?: string) => Promise<void>;
}

// Solo movimiento vertical: la cita cambia de hora, nunca de carril/día.
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

// El destino es el spot cuyo borde superior queda más cerca del borde superior del BLOQUE arrastrado, no el spot
// que está bajo el dedo/cursor: en una cita alta (p. ej. de 1 h) dónde se agarre no debe cambiar a qué hora cae,
// y el spot resaltado es exactamente donde empezará la cita.
const topEdgeCollision: CollisionDetection = ({ collisionRect, droppableRects, droppableContainers }) => {
  const slotTops: { id: string; top: number }[] = [];
  for (const container of droppableContainers) {
    const rect = droppableRects.get(container.id);
    if (rect) slotTops.push({ id: String(container.id), top: rect.top });
  }
  const id = getNearestSlot(slotTops, collisionRect.top);
  return id ? [{ id }] : [];
};

interface PendingChange {
  time?: string;
  durationMinutes?: number;
}

export const AgendaDayView: React.FC<AgendaDayViewProps> = ({
  date,
  appointments,
  startHour = AGENDA.START_HOUR,
  endHour = AGENDA.END_HOUR,
  grid = LEGACY_GRID,
  onAddAt,
  onSelectAppointment,
  onMoveAppointment,
  onResizeAppointment,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  // El botón "Añadir" solo se muestra cuando cabe COMPLETO: un sticky se clava al borde superior de su
  // contenedor, así que cuando la agenda apenas asoma por el pie de la pantalla quedaría asomado y cortado.
  const [showAddButton, setShowAddButton] = useState(true);
  const pageScrolledFor = useRef<string | null>(null);
  const theme = useTheme();
  // Pantallas grandes: la agenda va en una caja con scroll propio. Celular: altura completa y scrollea la página.
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const suppressClickUntil = useRef(0);
  // Cambios "optimistas" (hora y/o duración) de las citas que se están guardando en el backend.
  const [pending, setPending] = useState<Record<string, PendingChange>>({});
  // Cita seleccionada con presión larga (touch): muestra los puntos de redimensionar.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const dragEnabled = Boolean(onMoveAppointment);
  const resizeEnabled = Boolean(onResizeAppointment) && grid.durationsEnabled;

  // Ratón: arranca al mover unos píxeles. Touch: presión larga (así no pelea con el scroll vertical).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  // Citas con la hora/duración "optimista" de las que se están guardando.
  const displayed = useMemo(
    () =>
      appointments.map((a) => {
        const change = a.id ? pending[a.id] : undefined;
        if (!change) return a;
        return {
          ...a,
          ...(change.time ? { time: change.time } : {}),
          ...(change.durationMinutes ? { durationMinutes: change.durationMinutes } : {}),
        };
      }),
    [appointments, pending]
  );

  const range = useMemo(() => getVisibleRange(displayed, startHour, endHour, grid), [displayed, startHour, endHour, grid]);
  const laidOut = useMemo(() => layoutLanes(displayed, grid), [displayed, grid]);

  const showingToday = isToday(date);
  const nowMinutes = showingToday ? now.getHours() * 60 + now.getMinutes() : null;

  // La línea de "ahora" se actualiza cada minuto (solo si se está viendo hoy).
  useEffect(() => {
    if (!showingToday) return;
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [showingToday]);

  useEffect(() => {
    const update = () => {
      const top = rootRef.current?.getBoundingClientRect().top;
      if (top === undefined) return;
      setShowAddButton(top < window.innerHeight - ADD_BUTTON_CLEARANCE_PX);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // La selección se limpia al tocar fuera del bloque seleccionado, con Esc o al cambiar de día.
  useEffect(() => {
    if (!selectedId) return;
    const onPointerDown = (event: PointerEvent) => {
      const block = (event.target as HTMLElement | null)?.closest('[data-agenda-block-id]');
      if (block?.getAttribute('data-agenda-block-id') !== selectedId) setSelectedId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedId]);

  const dateKey = format(date, 'yyyy-MM-dd');
  useEffect(() => setSelectedId(null), [dateKey]);

  const hasAppointments = appointments.length > 0;
  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;

    if (isDesktop) {
      // Caja con scroll propio: al cambiar de día (o llegar las citas) va a la hora actual / primera cita.
      let anchor: number | null = null;
      if (showingToday) {
        anchor = new Date().getHours() * 60 + new Date().getMinutes();
      } else if (hasAppointments) {
        const first = Math.min(...appointments.map((a) => timeToMinutes(a.time)).filter((m) => !Number.isNaN(m)));
        anchor = Number.isFinite(first) ? first : null;
      }
      gridEl.scrollTo({ top: anchor === null ? 0 : Math.max(0, minutesToOffset(anchor - 60, range, grid)) });
      return;
    }

    // Celular: se muestra TODO el horario y es la página la que se desplaza. Al entrar a "hoy", si la línea
    // de "ahora" queda fuera de pantalla se lleva a la vista (una sola vez por día mostrado).
    if (!showingToday || pageScrolledFor.current === dateKey) return;
    pageScrolledFor.current = dateKey;

    const current = new Date();
    const nowMinutesLocal = current.getHours() * 60 + current.getMinutes();
    const lineTop = gridEl.getBoundingClientRect().top + window.scrollY + 10 + minutesToOffset(nowMinutesLocal, range, grid);
    const viewportTop = window.scrollY + 80; // deja libre la barra superior
    const viewportBottom = window.scrollY + window.innerHeight - 120; // deja libre el botón "Añadir"
    if (lineTop < viewportTop || lineTop > viewportBottom) {
      window.scrollTo({ top: Math.max(0, lineTop - window.innerHeight / 3) });
    }
    // Solo al cambiar de día / aparecer las primeras citas / cambiar de layout; no en cada movimiento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, hasAppointments, isDesktop]);

  const handleDragStart = (event: DragStartEvent) => {
    suppressClickUntil.current = Number.MAX_SAFE_INTEGER;
    // Presión larga en touch = seleccionar el bloque (aparecen los puntos de redimensionar). Con mouse no.
    const isTouch = typeof TouchEvent !== 'undefined' && event.activatorEvent instanceof TouchEvent;
    if (isTouch && resizeEnabled) {
      const dragged = appointments.find((a) => a.id === String(event.active.id));
      setSelectedId(dragged && isAgendaMovable(dragged.status) ? String(event.active.id) : null);
    } else {
      setSelectedId(null);
    }
  };

  const clearPending = useCallback((id: string) => {
    setPending((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    // El "soltar" no debe abrir la edición de la cita.
    suppressClickUntil.current = Date.now() + 300;

    const { active, over, delta } = event;
    if (!over || !onMoveAppointment) return;
    // Un roce menor a medio spot no mueve la cita (evita que una cita con hora "suelta", p. ej. 11:10, se ajuste sola).
    if (Math.abs(delta.y) < grid.slotHeightPx / 2) return;

    const overId = String(over.id);
    if (!overId.startsWith('slot-')) return;

    const id = String(active.id);
    const appointment = appointments.find((a) => a.id === id);
    if (!appointment) return;

    const newTime = overId.slice('slot-'.length);
    if (newTime === appointment.time) return;

    // Al soltar una cita en otro horario se sale del modo de edición (los puntos desaparecen).
    setSelectedId(null);
    setPending((current) => ({ ...current, [id]: { ...current[id], time: newTime } }));
    try {
      await onMoveAppointment(appointment, newTime);
    } catch {
      // El error (p. ej. SLOT_TAKEN) ya se notificó en useAppointments; la cita vuelve a su lugar.
    } finally {
      clearPending(id);
    }
  };

  const handleDragCancel = () => {
    suppressClickUntil.current = Date.now() + 300;
  };

  // --- Redimensionar -------------------------------------------------------------------------------------

  // Durante el arrastre de un punto: nuevo inicio/duración, limitados a las citas vecinas y al rango visible.
  const computeResize = useCallback(
    (appointment: Appointment, handle: ResizeHandle, deltaPx: number): ResizeResult =>
      getResizeResult({
        startMinutes: timeToMinutes(appointment.time),
        durationMinutes: displayed.find((a) => a.id === appointment.id)?.durationMinutes ?? appointment.durationMinutes ?? 30,
        handle,
        deltaPx,
        range,
        busy: getBusyRanges(displayed, appointment.id, grid),
        grid,
      }),
    [displayed, range, grid]
  );

  const handleResizeCommit = async (appointment: Appointment, result: ResizeResult) => {
    const id = appointment.id;
    if (!id || !onResizeAppointment) return;

    const startChanged = result.startMinutes !== timeToMinutes(appointment.time);
    const newTime = startChanged ? minutesToTime(result.startMinutes) : undefined;
    setPending((current) => ({
      ...current,
      [id]: { ...current[id], durationMinutes: result.durationMinutes, ...(newTime ? { time: newTime } : {}) },
    }));
    try {
      await onResizeAppointment(appointment, result.durationMinutes, newTime);
    } catch {
      // El error (p. ej. SLOT_TAKEN) ya se notificó en useAppointments; el bloque vuelve a su tamaño.
    } finally {
      clearPending(id);
    }
  };

  const handleResizeActiveChange = (active: boolean) => {
    // Al soltar el punto no debe abrirse el formulario de la cita.
    suppressClickUntil.current = active ? Number.MAX_SAFE_INTEGER : Date.now() + 300;
    // Al soltar el punto (acortada, alargada o sin cambios) se sale del modo de edición: los puntos desaparecen.
    if (!active) setSelectedId(null);
  };

  const addLabel = `Añadir el ${format(date, "d MMM", { locale: es }).replace('.', '')}`;

  return (
    <Box ref={rootRef} sx={{ position: 'relative', mt: 2 }}>
      {!hasAppointments && (
        <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mb: 1 }}>
          Todavía no hay reservas para este día. Toca una franja libre para agendar.
        </Typography>
      )}

      <Box
        ref={gridRef}
        sx={{
          // Celular: altura completa (sin scroll interno). Escritorio: caja de 68vh con scroll propio.
          maxHeight: { xs: 'none', md: '68vh' },
          overflowX: 'hidden',
          overflowY: { xs: 'hidden', md: 'auto' },
          borderRadius: '14px',
          border: `1px solid ${appColors.border}`,
          backgroundColor: appColors.background,
          ...scrollbarSx,
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={topEdgeCollision}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <AgendaTimeGrid range={range} nowMinutes={nowMinutes} grid={grid} onSelectSlot={(time) => onAddAt(time)}>
            {laidOut.map(({ appointment, startMinutes, lane, laneCount }) => (
              <AgendaAppointmentBlock
                key={appointment.id ?? `${appointment.date}-${appointment.time}-${appointment.phone}`}
                appointment={appointment}
                top={minutesToOffset(startMinutes, range, grid)}
                lane={lane}
                laneCount={laneCount}
                grid={grid}
                draggable={dragEnabled && isAgendaMovable(appointment.status)}
                resizable={resizeEnabled && isAgendaMovable(appointment.status) && Boolean(appointment.id)}
                selected={Boolean(appointment.id) && appointment.id === selectedId}
                isPending={Boolean(appointment.id && pending[appointment.id])}
                isClickSuppressed={() => Date.now() < suppressClickUntil.current}
                onClick={onSelectAppointment}
                computeResize={computeResize}
                onResizeCommit={handleResizeCommit}
                onResizeActiveChange={handleResizeActiveChange}
              />
            ))}
          </AgendaTimeGrid>
        </DndContext>
      </Box>

      {/* Pegado al borde inferior de la pantalla mientras se recorre la agenda. */}
      {/* El wrapper mide 0px de alto: con alignItems flex-end el botón crece hacia ARRIBA desde el borde inferior. */}
      <Box sx={{ position: 'sticky', bottom: 16, height: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 6 }}>
        <Box
          sx={{
            opacity: showAddButton ? 1 : 0,
            pointerEvents: showAddButton ? 'auto' : 'none',
            transition: 'opacity 0.15s ease',
          }}
        >
          <AgendaAddButton label={addLabel} onClick={() => onAddAt()} />
        </Box>
      </Box>
    </Box>
  );
};

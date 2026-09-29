import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import {
  DndContext,
  DragEndEvent,
  Modifier,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Appointment } from '@domain/entities/Appointment';
import { AGENDA } from '@shared/constants/agenda';
import {
  getVisibleRange,
  isAgendaMovable,
  layoutLanes,
  minutesToOffset,
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
  /** Botón "Añadir el {fecha}" (sin hora) o toque en un spot vacío (con la hora del spot). */
  onAddAt: (time?: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  /**
   * Se llama al soltar una cita en otro spot. Debe mover la cita (y lanzar si falla). Si se omite, el
   * arrastre queda deshabilitado. Mientras la promesa está pendiente la cita se muestra en su nueva hora.
   */
  onMoveAppointment?: (appointment: Appointment, newTime: string) => Promise<void>;
}

// Solo movimiento vertical: la cita cambia de hora, nunca de carril/día.
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export const AgendaDayView: React.FC<AgendaDayViewProps> = ({
  date,
  appointments,
  startHour = AGENDA.START_HOUR,
  endHour = AGENDA.END_HOUR,
  onAddAt,
  onSelectAppointment,
  onMoveAppointment,
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
  const [pendingTimes, setPendingTimes] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => new Date());

  const dragEnabled = Boolean(onMoveAppointment);

  // Ratón: arranca al mover unos píxeles. Touch: presión larga (así no pelea con el scroll vertical).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  // Citas con la hora "optimista" de las que se están moviendo.
  const displayed = useMemo(
    () => appointments.map((a) => (a.id && pendingTimes[a.id] ? { ...a, time: pendingTimes[a.id] } : a)),
    [appointments, pendingTimes]
  );

  const range = useMemo(() => getVisibleRange(displayed, startHour, endHour), [displayed, startHour, endHour]);
  const laidOut = useMemo(() => layoutLanes(displayed), [displayed]);

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

  const dateKey = format(date, 'yyyy-MM-dd');
  const hasAppointments = appointments.length > 0;
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    if (isDesktop) {
      // Caja con scroll propio: al cambiar de día (o llegar las citas) va a la hora actual / primera cita.
      let anchor: number | null = null;
      if (showingToday) {
        anchor = new Date().getHours() * 60 + new Date().getMinutes();
      } else if (hasAppointments) {
        const first = Math.min(...appointments.map((a) => timeToMinutes(a.time)).filter((m) => !Number.isNaN(m)));
        anchor = Number.isFinite(first) ? first : null;
      }
      grid.scrollTo({ top: anchor === null ? 0 : Math.max(0, minutesToOffset(anchor - 60, range)) });
      return;
    }

    // Celular: se muestra TODO el horario y es la página la que se desplaza. Al entrar a "hoy", si la línea
    // de "ahora" queda fuera de pantalla se lleva a la vista (una sola vez por día mostrado).
    if (!showingToday || pageScrolledFor.current === dateKey) return;
    pageScrolledFor.current = dateKey;

    const current = new Date();
    const nowMinutesLocal = current.getHours() * 60 + current.getMinutes();
    const lineTop = grid.getBoundingClientRect().top + window.scrollY + 10 + minutesToOffset(nowMinutesLocal, range);
    const viewportTop = window.scrollY + 80; // deja libre la barra superior
    const viewportBottom = window.scrollY + window.innerHeight - 120; // deja libre el botón "Añadir"
    if (lineTop < viewportTop || lineTop > viewportBottom) {
      window.scrollTo({ top: Math.max(0, lineTop - window.innerHeight / 3) });
    }
    // Solo al cambiar de día / aparecer las primeras citas / cambiar de layout; no en cada movimiento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, hasAppointments, isDesktop]);

  const handleDragStart = () => {
    suppressClickUntil.current = Number.MAX_SAFE_INTEGER;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    // El "soltar" no debe abrir la edición de la cita.
    suppressClickUntil.current = Date.now() + 300;

    const { active, over } = event;
    if (!over || !onMoveAppointment) return;

    const overId = String(over.id);
    if (!overId.startsWith('slot-')) return;

    const id = String(active.id);
    const appointment = appointments.find((a) => a.id === id);
    if (!appointment) return;

    const newTime = overId.slice('slot-'.length);
    if (newTime === appointment.time) return;

    setPendingTimes((current) => ({ ...current, [id]: newTime }));
    try {
      await onMoveAppointment(appointment, newTime);
    } catch {
      // El error (p. ej. SLOT_TAKEN) ya se notificó en useAppointments; la cita vuelve a su lugar.
    } finally {
      setPendingTimes((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  };

  const handleDragCancel = () => {
    suppressClickUntil.current = Date.now() + 300;
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
          collisionDetection={pointerWithin}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <AgendaTimeGrid range={range} nowMinutes={nowMinutes} onSelectSlot={(time) => onAddAt(time)}>
            {laidOut.map(({ appointment, startMinutes, lane, laneCount }) => (
              <AgendaAppointmentBlock
                key={appointment.id ?? `${appointment.date}-${appointment.time}-${appointment.phone}`}
                appointment={appointment}
                top={minutesToOffset(startMinutes, range)}
                lane={lane}
                laneCount={laneCount}
                draggable={dragEnabled && isAgendaMovable(appointment.status)}
                isPending={Boolean(appointment.id && pendingTimes[appointment.id])}
                isClickSuppressed={() => Date.now() < suppressClickUntil.current}
                onClick={onSelectAppointment}
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

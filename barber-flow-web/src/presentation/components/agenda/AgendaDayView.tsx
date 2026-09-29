import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
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
  const scrollRef = useRef<HTMLDivElement | null>(null);
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

  // Al cambiar de día (o llegar las citas), desplaza a la hora actual / primera cita.
  const dateKey = format(date, 'yyyy-MM-dd');
  const hasAppointments = appointments.length > 0;
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let anchor: number | null = null;
    if (showingToday) {
      anchor = new Date().getHours() * 60 + new Date().getMinutes();
    } else if (hasAppointments) {
      const first = Math.min(...appointments.map((a) => timeToMinutes(a.time)).filter((m) => !Number.isNaN(m)));
      anchor = Number.isFinite(first) ? first : null;
    }

    const target = anchor === null ? 0 : Math.max(0, minutesToOffset(anchor - 60, range));
    container.scrollTo({ top: target });
    // Solo cuando cambia el día o aparecen las primeras citas; no en cada movimiento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, hasAppointments]);

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
    <Box sx={{ position: 'relative', mt: 2 }}>
      {!hasAppointments && (
        <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mb: 1 }}>
          Todavía no hay reservas para este día. Toca una franja libre para agendar.
        </Typography>
      )}

      <Box
        ref={scrollRef}
        sx={{
          maxHeight: { xs: '62vh', md: '68vh' },
          overflowY: 'auto',
          overflowX: 'hidden',
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

      <AgendaAddButton label={addLabel} onClick={() => onAddAt()} />
    </Box>
  );
};

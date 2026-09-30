import { describe, expect, it } from 'vitest';
import { Appointment } from '@domain/entities/Appointment';
import {
  formatHourLabel,
  getGridHeight,
  getSlotStarts,
  getVisibleRange,
  isAgendaMovable,
  layoutLanes,
  minutesToOffset,
  minutesToTime,
  snapToSlot,
  timeToMinutes,
} from './agendaLayout';

const apt = (id: string, time: string): Appointment => ({
  id,
  clientName: `Cliente ${id}`,
  phone: '8888-0000',
  date: '2026-09-29',
  time,
  status: 'scheduled',
});

describe('timeToMinutes / minutesToTime', () => {
  it('convierte HH:mm en ambos sentidos', () => {
    expect(timeToMinutes('08:00')).toBe(480);
    expect(timeToMinutes('11:30')).toBe(690);
    expect(minutesToTime(690)).toBe('11:30');
    expect(minutesToTime(480)).toBe('08:00');
  });

  it('devuelve NaN para formatos inválidos', () => {
    expect(timeToMinutes('')).toBeNaN();
    expect(timeToMinutes('abc')).toBeNaN();
    expect(timeToMinutes('9')).toBeNaN();
  });
});

describe('getVisibleRange', () => {
  it('usa 8:00–20:00 por defecto', () => {
    expect(getVisibleRange([])).toEqual({ startMinutes: 480, endMinutes: 1200 });
  });

  it('se amplía si hay citas fuera del horario, sin ocultar ninguna', () => {
    const range = getVisibleRange([apt('1', '06:45'), apt('2', '20:30')]);
    expect(range.startMinutes).toBe(360); // 6:00
    expect(range.endMinutes).toBe(1260); // 21:00 (20:30 + 30 min)
  });

  it('ignora citas con hora inválida', () => {
    expect(getVisibleRange([apt('1', 'xx')])).toEqual({ startMinutes: 480, endMinutes: 1200 });
  });

  it('no sale de 0–24h', () => {
    const range = getVisibleRange([apt('1', '00:10'), apt('2', '23:50')]);
    expect(range.startMinutes).toBe(0);
    expect(range.endMinutes).toBe(1440);
  });
});

describe('spots y posiciones', () => {
  const range = { startMinutes: 480, endMinutes: 1200 };

  it('genera un spot cada 30 minutos', () => {
    const slots = getSlotStarts(range);
    expect(slots).toHaveLength(24);
    expect(slots[0]).toBe(480);
    expect(slots[1]).toBe(510);
    expect(slots[slots.length - 1]).toBe(1170);
  });

  it('calcula el offset y el alto total en función del spot', () => {
    expect(minutesToOffset(480, range)).toBe(0);
    expect(minutesToOffset(510, range)).toBe(52);
    expect(minutesToOffset(495, range)).toBe(26); // 8:15 = medio spot
    expect(getGridHeight(range)).toBe(24 * 52);
  });

  it('ajusta al inicio del spot que contiene la hora', () => {
    expect(snapToSlot(690)).toBe(690);
    expect(snapToSlot(671)).toBe(660); // 11:11 -> 11:00
    expect(snapToSlot(689)).toBe(660); // 11:29 -> 11:00
  });

  it('formatea las etiquetas de hora en punto', () => {
    expect(formatHourLabel(480)).toBe('8 AM');
    expect(formatHourLabel(720)).toBe('12 PM');
    expect(formatHourLabel(0)).toBe('12 AM');
    expect(formatHourLabel(1200)).toBe('8 PM');
  });
});

describe('layoutLanes', () => {
  it('una cita sola ocupa un carril completo', () => {
    const [only] = layoutLanes([apt('1', '10:00')]);
    expect(only).toMatchObject({ lane: 0, laneCount: 1, startMinutes: 600 });
  });

  it('citas en spots distintos no se reparten carriles', () => {
    const laid = layoutLanes([apt('1', '11:00'), apt('2', '11:30'), apt('3', '12:00')]);
    expect(laid.map((l) => l.laneCount)).toEqual([1, 1, 1]);
    expect(laid.every((l) => l.lane === 0)).toBe(true);
  });

  it('citas que se traslapan visualmente van lado a lado (11:00 y 11:10)', () => {
    const laid = layoutLanes([apt('1', '11:00'), apt('2', '11:10')]);
    expect(laid.map((l) => [l.appointment.id, l.lane, l.laneCount])).toEqual([
      ['1', 0, 2],
      ['2', 1, 2],
    ]);
  });

  it('reutiliza el carril libre dentro del mismo grupo de traslape', () => {
    // 11:00 y 11:10 se traslapan; 11:30 ya no (la 1ª terminó a las 11:30) y reutiliza el carril 0
    const laid = layoutLanes([apt('1', '11:00'), apt('2', '11:10'), apt('3', '11:30')]);
    const byId = Object.fromEntries(laid.map((l) => [l.appointment.id, l]));
    expect(byId['3'].lane).toBe(0);
    expect(byId['1'].laneCount).toBe(2);
    expect(byId['3'].laneCount).toBe(2);
  });

  it('ordena por hora aunque lleguen desordenadas y descarta horas inválidas', () => {
    const laid = layoutLanes([apt('b', '13:00'), apt('bad', 'zz'), apt('a', '09:00')]);
    expect(laid.map((l) => l.appointment.id)).toEqual(['a', 'b']);
  });
});

describe('isAgendaMovable', () => {
  it('solo Agendadas y Confirmadas se pueden arrastrar', () => {
    expect(isAgendaMovable('scheduled')).toBe(true);
    expect(isAgendaMovable('confirmed')).toBe(true);
    expect(isAgendaMovable('completed')).toBe(false);
    expect(isAgendaMovable('cancelled')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { Appointment } from '@domain/entities/Appointment';
import { DURATION_GRID, LEGACY_GRID } from '@shared/constants/agenda';
import {
  durationToHeight,
  formatDuration,
  formatTimeRange,
  getAppointmentDuration,
  getBusyRanges,
  getDefaultDurationForSlot,
  getFreeMinutesFrom,
  getGridHeight,
  getResizeResult,
  getSlotStarts,
  getVisibleRange,
  layoutLanes,
  minutesToOffset,
  snapToSlot,
} from './agendaLayout';

const apt = (id: string, time: string, durationMinutes?: number, status: Appointment['status'] = 'scheduled'): Appointment => ({
  id,
  clientName: `Cliente ${id}`,
  phone: '8888-0000',
  date: '2026-10-02',
  time,
  status,
  durationMinutes,
});

const m = (hhmm: string) => {
  const [h, min] = hhmm.split(':').map(Number);
  return h * 60 + min;
};

describe('grilla de duraciones (spots de 15 min)', () => {
  const range = { startMinutes: m('08:00'), endMinutes: m('20:00') };

  it('genera spots de 15 min y mide 32 px por spot', () => {
    expect(getSlotStarts(range, DURATION_GRID)).toHaveLength(48);
    expect(getSlotStarts(range, LEGACY_GRID)).toHaveLength(24);
    expect(getGridHeight(range, DURATION_GRID)).toBe(48 * 32);
    expect(minutesToOffset(m('09:00'), range, DURATION_GRID)).toBe(4 * 32);
    expect(durationToHeight(30, DURATION_GRID)).toBe(64);
    expect(durationToHeight(15, DURATION_GRID)).toBe(32);
  });

  it('ajusta al spot de 15 min', () => {
    expect(snapToSlot(m('11:20'), DURATION_GRID)).toBe(m('11:15'));
    expect(snapToSlot(m('11:20'), LEGACY_GRID)).toBe(m('11:00'));
  });

  it('con la grilla de siempre ignora la duración; con la de duraciones la usa (30 por defecto)', () => {
    expect(getAppointmentDuration(apt('a', '11:00', 15), LEGACY_GRID)).toBe(30);
    expect(getAppointmentDuration(apt('a', '11:00', 15), DURATION_GRID)).toBe(15);
    expect(getAppointmentDuration(apt('a', '11:00'), DURATION_GRID)).toBe(30);
  });

  it('amplía el rango según el fin real de la cita', () => {
    expect(getVisibleRange([apt('a', '19:45', 30)], 8, 20, DURATION_GRID).endMinutes).toBe(m('21:00'));
    expect(getVisibleRange([apt('a', '19:45', 15)], 8, 20, DURATION_GRID).endMinutes).toBe(m('20:00'));
  });

  it('una cita de 30 min y otra de 15 min a las :30 quedan en el mismo carril (no se traslapan)', () => {
    const laid = layoutLanes([apt('a', '11:00', 30), apt('b', '11:30', 15)], DURATION_GRID);
    expect(laid.map((l) => [l.appointment.id, l.lane, l.laneCount, l.durationMinutes])).toEqual([
      ['a', 0, 1, 30],
      ['b', 0, 1, 15],
    ]);
  });

  it('citas legadas que se traslapan se reparten en carriles', () => {
    const laid = layoutLanes([apt('a', '11:00', 30), apt('b', '11:10', 30)], DURATION_GRID);
    expect(laid.map((l) => [l.lane, l.laneCount])).toEqual([[0, 2], [1, 2]]);
  });
});

describe('getResizeResult', () => {
  const range = { startMinutes: m('08:00'), endMinutes: m('20:00') };
  const base = { startMinutes: m('11:00'), durationMinutes: 30, range, grid: DURATION_GRID };

  it('el punto de abajo acorta de 30 a 15 min (arrastrar un spot hacia arriba)', () => {
    expect(getResizeResult({ ...base, handle: 'bottom', deltaPx: -32, busy: [] })).toEqual({
      startMinutes: m('11:00'),
      durationMinutes: 15,
    });
  });

  it('nunca baja de 15 min', () => {
    expect(getResizeResult({ ...base, handle: 'bottom', deltaPx: -200, busy: [] }).durationMinutes).toBe(15);
  });

  it('el punto de abajo alarga hasta donde haya espacio libre (no invade a la siguiente cita)', () => {
    const busy = [{ startMinutes: m('11:45'), endMinutes: m('12:15') }];
    expect(getResizeResult({ ...base, handle: 'bottom', deltaPx: 32 * 6, busy }).durationMinutes).toBe(45);
  });

  it('el punto de abajo no pasa de 120 min ni del fin del rango', () => {
    expect(getResizeResult({ ...base, handle: 'bottom', deltaPx: 32 * 40, busy: [] }).durationMinutes).toBe(120);
    const late = { ...base, startMinutes: m('19:30'), handle: 'bottom' as const, deltaPx: 32 * 4, busy: [] };
    expect(getResizeResult(late).durationMinutes).toBe(30);
  });

  it('el punto de arriba cambia el inicio y deja el fin fijo (11:00–11:30 -> 11:15–11:30)', () => {
    expect(getResizeResult({ ...base, handle: 'top', deltaPx: 32, busy: [] })).toEqual({
      startMinutes: m('11:15'),
      durationMinutes: 15,
    });
  });

  it('el punto de arriba no baja de 15 min ni invade a la cita anterior', () => {
    expect(getResizeResult({ ...base, handle: 'top', deltaPx: 32 * 10, busy: [] }).durationMinutes).toBe(15);
    const busy = [{ startMinutes: m('10:15'), endMinutes: m('10:45') }];
    expect(getResizeResult({ ...base, handle: 'top', deltaPx: -32 * 6, busy })).toEqual({
      startMinutes: m('10:45'),
      durationMinutes: 45,
    });
  });
});

describe('espacio libre y duración de una cita nueva en un spot', () => {
  const busy = getBusyRanges([apt('a', '11:30', 30), apt('b', '12:30', 30, 'cancelled')], undefined, DURATION_GRID);

  it('las canceladas no ocupan espacio', () => {
    expect(busy).toEqual([{ startMinutes: m('11:30'), endMinutes: m('12:00') }]);
  });

  it('con 30 min libres la cita nueva es de 30; con solo 15 libres es de 15 (D4)', () => {
    expect(getDefaultDurationForSlot(m('11:00'), busy)).toBe(30);
    expect(getDefaultDurationForSlot(m('11:15'), busy)).toBe(15);
    expect(getDefaultDurationForSlot(m('12:00'), busy)).toBe(30);
  });

  it('un spot ocupado tiene 0 minutos libres', () => {
    expect(getFreeMinutesFrom(m('11:30'), busy)).toBe(0);
    expect(getFreeMinutesFrom(m('11:45'), busy)).toBe(0);
  });

  it('getBusyRanges excluye la cita que se redimensiona', () => {
    expect(getBusyRanges([apt('a', '11:00', 30), apt('b', '11:30', 15)], 'a', DURATION_GRID)).toEqual([
      { startMinutes: m('11:30'), endMinutes: m('11:45') },
    ]);
  });
});

describe('formatTimeRange', () => {
  it('muestra inicio – fin', () => {
    expect(formatTimeRange(m('11:00'), 15)).toBe('11:00 – 11:15');
  });
});

describe('formatDuration', () => {
  it('formatea minutos y horas', () => {
    expect(formatDuration(15)).toBe('15 min');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(formatDuration(120)).toBe('2 h');
  });
});

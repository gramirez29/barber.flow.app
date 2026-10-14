import { describe, expect, it } from 'vitest';
import { formatDateTime, formatTime } from './formatters';

describe('formatTime', () => {
  it('convierte HH:mm de 24 h a 12 h con AM/PM', () => {
    expect(formatTime('00:00')).toBe('12:00 AM');
    expect(formatTime('08:05')).toBe('8:05 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('12:30')).toBe('12:30 PM');
    expect(formatTime('15:30')).toBe('3:30 PM');
    expect(formatTime('23:45')).toBe('11:45 PM');
  });

  it('acepta HH:mm:ss y horas de un dígito', () => {
    expect(formatTime('15:30:00')).toBe('3:30 PM');
    expect(formatTime('9:00')).toBe('9:00 AM');
  });

  it('devuelve el texto tal cual si no es una hora', () => {
    expect(formatTime('')).toBe('');
    expect(formatTime('mañana')).toBe('mañana');
  });
});

describe('formatDateTime', () => {
  it('usa la hora en formato de 12 h', () => {
    expect(formatDateTime('2026-10-03', '15:30')).toContain('3:30 PM');
  });
});

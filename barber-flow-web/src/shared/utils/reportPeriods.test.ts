import { describe, expect, it } from 'vitest';
import {
  formatDayLabel,
  formatMonthLabel,
  formatWeekLabel,
  fromMonthInputValue,
  getWeekRange,
  parseDateKey,
  shiftAnchor,
  toDateKey,
  toMonthInputValue,
  toMonthKey,
} from './reportPeriods';

describe('reportPeriods', () => {
  describe('parseDateKey / toDateKey', () => {
    it('conserva el día calendario sin desfase de zona horaria', () => {
      const date = parseDateKey('2026-11-18');
      expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 18]);
      expect(toDateKey(date)).toBe('2026-11-18');
    });
  });

  describe('getWeekRange', () => {
    it.each([
      ['2026-11-15', '2026-11-15', '2026-11-21'], // domingo
      ['2026-11-16', '2026-11-15', '2026-11-21'], // lunes
      ['2026-11-18', '2026-11-15', '2026-11-21'], // miércoles
      ['2026-11-21', '2026-11-15', '2026-11-21'], // sábado
      ['2026-11-22', '2026-11-22', '2026-11-28'], // el domingo siguiente abre otra semana
      ['2026-12-02', '2026-11-29', '2026-12-05'], // cruza de mes
      ['2027-01-01', '2026-12-27', '2027-01-02'], // cruza de año
    ])('la semana de %s va de %s a %s (domingo a sábado)', (anchor, from, to) => {
      expect(getWeekRange(anchor)).toEqual({ from, to });
    });
  });

  describe('shiftAnchor', () => {
    it('avanza y retrocede un día en el diario', () => {
      expect(shiftAnchor('daily', '2026-11-30', 1)).toBe('2026-12-01');
      expect(shiftAnchor('daily', '2026-01-01', -1)).toBe('2025-12-31');
    });

    it('avanza y retrocede 7 días en el semanal', () => {
      expect(shiftAnchor('weekly', '2026-11-18', 1)).toBe('2026-11-25');
      expect(shiftAnchor('weekly', '2026-11-18', -1)).toBe('2026-11-11');
    });

    it('avanza y retrocede un mes en el mensual, sin salirse de mes cuando el día no existe', () => {
      expect(shiftAnchor('monthly', '2026-11-18', 1)).toBe('2026-12-18');
      expect(shiftAnchor('monthly', '2026-01-18', -1)).toBe('2025-12-18');
      expect(toMonthKey(shiftAnchor('monthly', '2026-03-31', -1))).toBe('2026-02');
      expect(toMonthKey(shiftAnchor('monthly', '2026-01-31', 1))).toBe('2026-02');
    });
  });

  describe('etiquetas', () => {
    it('etiqueta una semana dentro de un mismo mes', () => {
      expect(formatWeekLabel('2026-11-18')).toBe('dom 15 – sáb 21 nov');
    });

    it('etiqueta una semana que cruza de mes con ambos meses', () => {
      expect(formatWeekLabel('2026-12-02')).toBe('dom 29 nov – sáb 5 dic');
    });

    it('etiqueta el mes con la primera letra en mayúscula', () => {
      expect(formatMonthLabel('2026-11-18')).toBe('Noviembre de 2026');
    });

    it('etiqueta un día de la lista de detalle', () => {
      expect(formatDayLabel('2026-11-16')).toBe('lun 16 nov');
    });
  });

  describe('input de mes', () => {
    it('convierte entre la fecha ancla y el valor de <input type="month">', () => {
      expect(toMonthInputValue('2026-11-18')).toBe('2026-11');
      expect(fromMonthInputValue('2026-11')).toBe('2026-11-01');
    });
  });
});

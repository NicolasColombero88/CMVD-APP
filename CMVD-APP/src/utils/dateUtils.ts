// src/utils/dateUtils.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(utc);
dayjs.extend(customParseFormat);

// Aceptamos los formatos presentes en la app + ISO
const ACCEPTED = [
  'DD/MM/YYYY', 'DD-MM-YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD', 'YYYY/MM/DD',
  'YYYY-MM-DDTHH:mm:ss[Z]',
  'YYYY-MM-DDTHH:mm:ss.SSS[Z]',
];

export function parseStrict(v: unknown) {
  if (v instanceof Date) return dayjs(v);
  if (typeof v === 'number') return dayjs(v);
  if (typeof v === 'string') {
    const d = dayjs(v, ACCEPTED, true);
    return d.isValid() ? d : dayjs(v);
  }
  return dayjs.invalid();
}

/** Canon para comparar/filtrar: YYYY-MM-DD (sin hora) */
export function toCanon(v: unknown): string {
  return parseStrict(v).utc().startOf('day').format('YYYY-MM-DD');
}

/** Visual único en toda la app */
export function toDisplay(v: unknown): string {
  const d = parseStrict(v);
  return d.isValid() ? d.format('DD/MM/YYYY') : '';
}

/** Fechas límite RFC3339 en Z para un único día */
export function toDayBoundsZ(v: unknown) {
  const base = toCanon(v); // YYYY-MM-DD
  return {
    from: `${base}T00:00:00Z`,
    to:   `${base}T23:59:59Z`,
  };
}

/** Para DatePicker que espera Date */
export function toDateObj(v: unknown): Date | null {
  const d = parseStrict(v);
  return d.isValid() ? d.toDate() : null;
}

/** Solo si necesitás 'DD/MM/YYYY HH:mm:ss' */
export function toDisplayDateTimeZ(v: unknown): string {
  const d = parseStrict(v).utc();
  return d.isValid() ? d.format('DD/MM/YYYY HH:mm:ss') : '';
}

/** Ya existente, lo dejamos igual por compatibilidad */
export function toApiISOString(date: string, time: string): string {
  return dayjs(`${date}T${time}`).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
}

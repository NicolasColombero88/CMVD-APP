// src/modules/waybills/presentation/mapper.ts
// 100% listo para pegar

type Nullable<T> = T | null | undefined;

export type ApiWaybill = {
  _id: string;
  waybill_number?: string;
  pickup_datetime?: string;        // string legado, puede venir viejo
  withdrawal_date?: string;        // fecha real (ISO/RFC o YYYY-MM-DD)
  delivery_date?: string;          // fecha (ISO/RFC o YYYY-MM-DD)
  delivery_hour?: string;          // "HH:mm"
  company_name?: string;
  sender?: { name?: string; phone?: string; email?: string };
  receiver?: { name?: string; phone?: string; email?: string; address?: string };
  sender_address?: string;
  receiver_address?: string;
  shipping_cost?: number;
  status?: string;
  cadete?: { name?: string; user_name?: string };
  cadete_name?: string;
  rider_name?: string;
  updated_at?: string;
};

export type UiWaybillRow = {
  id: string;
  waybill_number: string;
  company_name: string;
  sender_address: string;
  receiver_address: string;
  receiver_phone: string;
  cadete_name: string;
  status: string;
  shipping_cost: string;
  pickup_datetime: string;     // DD/MM/YYYY [HH:mm]
  delivery_datetime: string;   // DD/MM/YYYY [HH:mm]
  updated_at: string;
};

function toDateSafe(input: Nullable<string | Date>): Nullable<Date> {
  if (!input) return null;
  if (input instanceof Date && !isNaN(input.getTime())) return input;

  // Intentos de parseo comunes
  const layouts = [
    (s: string) => new Date(s), // RFC3339/ISO (si es válido)
    (s: string) => {
      // YYYY-MM-DD
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
      if (!m) return new Date('invalid');
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
      return d;
    },
  ];

  for (const parse of layouts) {
    const d = parse(String(input).trim());
    if (d instanceof Date && !isNaN(d.getTime())) return d;
  }
  return null;
}

function formatDDMMYYYY(d: Nullable<Date>): string {
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatHHmmFromString(hhmm?: string): string {
  if (!hhmm) return "";
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  if (!m) return "";
  return `${m[1]}:${m[2]}`;
}

/**
 * Regla:
 * - pickup_datetime (UI) debe mostrarse con el DÍA que viene en withdrawal_date (fuente real).
 * - Si querés conservar una hora, priorizamos delivery_hour? No: la hora de retiro la tomamos del propio pickup_datetime si existiera (legacy).
 *   Es decir, split de pickup_datetime y usamos "lo que hay" como HH:mm.
 */
function buildPickupDisplay(withdrawal_date?: string, legacyPickup?: string): string {
  const wd = toDateSafe(withdrawal_date || null);
  const day = formatDDMMYYYY(wd);

  // intentar extraer hora del legacy string "YYYY-MM-DD HH:mm"
  let legacyHour = "";
  if (legacyPickup && legacyPickup.includes(" ")) {
    const parts = legacyPickup.trim().split(" ");
    const tail = parts.slice(1).join(" ").trim(); // puede ser "HH:mm" o incluso "HH:mm:ss"
    const m = /^([01]\d|2[0-3]):([0-5]\d)/.exec(tail);
    if (m) legacyHour = `${m[1]}:${m[2]}`;
  }

  return day ? `${day}${legacyHour ? ` ${legacyHour}` : ""}` : "";
}

/**
 * Regla:
 * - delivery_datetime (UI) muestra el día de delivery_date y,
 *   si hay delivery_hour "HH:mm" válido, lo concatena.
 */
function buildDeliveryDisplay(delivery_date?: string, delivery_hour?: string): string {
  const dd = toDateSafe(delivery_date || null);
  const day = formatDDMMYYYY(dd);
  const hhmm = formatHHmmFromString(delivery_hour || "");
  return day ? `${day}${hhmm ? ` ${hhmm}` : ""}` : "";
}

function money(n: unknown): string {
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(num);
}

function resolveCadeteName(w: ApiWaybill): string {
  return (
    w.cadete?.name ||
    w.cadete?.user_name ||
    w.cadete_name ||
    w.rider_name ||
    ""
  );
}

export function mapWaybillRows(input: ApiWaybill[]): UiWaybillRow[] {
  return (input || []).map((w) => {
    const pickupDisplay = buildPickupDisplay(w.withdrawal_date, w.pickup_datetime);
    const deliveryDisplay = buildDeliveryDisplay(w.delivery_date, w.delivery_hour);

    const updatedAt = toDateSafe(w.updated_at || null);

    return {
      id: w._id,
      waybill_number: w.waybill_number || "",
      company_name: w.company_name || "",
      sender_address: w.sender_address || "",
      receiver_address: w.receiver_address || w.receiver?.address || "",
      receiver_phone: w.receiver?.phone || "",
      cadete_name: resolveCadeteName(w),
      status: w.status || "",
      shipping_cost: money(w.shipping_cost),
      pickup_datetime: pickupDisplay,
      delivery_datetime: deliveryDisplay,
      updated_at: updatedAt ? `${formatDDMMYYYY(updatedAt)}` : "",
    };
  });
}

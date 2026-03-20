// src/pages/FormWaybill.tsx
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/es";
import { Waybills } from "@/modules/waybills/infrastructure/waybillsService";
import { Users } from "@/modules/users/infrastructure/usersService";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Icon } from "@mdi/react";
import { mdiArrowLeft } from "@mdi/js";

dayjs.locale("es");
dayjs.extend(customParseFormat);

/** ================== Tipos ================== */
type Address = {
  city?: string;
  neighborhood?: string;
  street?: string;
  apartment?: string;
  [k: string]: any;
};

type Receiver = {
  name?: string;
  email?: string;
  phone?: string;
  address?: Address;
  [k: string]: any;
};

type PackageItem = {
  id?: string;
  description?: string;
  desc?: string;
  name?: string;
  quantity?: number | string;
  weight?: number | string; // kg
  length?: number | string; // cm
  width?: number | string; // cm
  height?: number | string; // cm
  value?: number | string;
  fragile?: boolean;
  dimensions?: { length?: number | string; width?: number | string; height?: number | string };
  [k: string]: any;
};

type WaybillView = {
  id?: string;
  cadete_id?: string;
  cadete_name?: string;
  cadete?: { id?: string; name?: string; user_name?: string; email?: string };
  company_name?: string;
  branch_id?: string;
  withdrawal_date?: string | Date;
  delivery_date?: string | Date;
  pickup_datetime?: string;
  pickup_start?: string;
  pickup_end?: string;
  delivery_hour?: string;
  shipping_cost?: number | string;
  who_pays?: "Remitente" | "Destinatario" | string;
  notes?: string;
  receiver?: Receiver;
  sender?: { phone?: string; address?: Address; name?: string; [k: string]: any };
  status?: string;
  payment_status?: string;
  packages?: PackageItem[];
  items?: PackageItem[];
  package_detail?: Record<string, any> | PackageItem[];
  package_details?: any;
  client_email?: string;
  company_email?: string;
  user_id?: string;
  created_by?: string;
  [k: string]: any;
};

/** ================== Helpers Fecha ================== */
const DDMMYYYY = "DD-MM-YYYY";
const KNOWN_FORMATS = [
  DDMMYYYY,
  "YYYY-MM-DD",
  "DD/MM/YYYY",
  "YYYY/MM/DD",
  "YYYY-MM-DDTHH:mm:ssZ",
  "YYYY-MM-DDTHH:mm:ss.SSSZ",
  "YYYY-MM-DDTHH:mm:ss",
];

function parseToDate(input: any): Date | null {
  if (!input) return null;
  if (input instanceof Date && !isNaN(input.getTime())) return input;
  if (typeof input === "object" && input?.$date) {
    const d = new Date(input.$date);
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(input).trim();
  for (const fmt of KNOWN_FORMATS) {
    const d = dayjs(s, fmt, true);
    if (d.isValid()) return d.toDate();
  }
  // fallback: try Date constructor
  const d2 = dayjs(s);
  return d2.isValid() ? d2.toDate() : null;
}

function formatView(dateLike: any): string {
  const d = parseToDate(dateLike);
  return d ? dayjs(d).format("DD/MM/YYYY") : "-";
}

/** ================== Util mostrar objeto genérico ================== */
function renderKeyValue(key: string, value: any) {
  if (value === null || typeof value === "undefined" || value === "") return null;
  return (
    <div key={key} className="py-1">
      <div className="text-xs text-gray-500">{key}</div>
      <div className="font-medium">{String(value)}</div>
    </div>
  );
}

/** ================== Extra helpers ================== */
// Extrae una fecha desde pickup_datetime (si viene "YYYY-MM-DD 09:00 - 12:00" o "DD-MM-YYYY ...")
function extractDateFromPickupDatetime(s?: string): Date | null {
  if (!s || typeof s !== "string") return null;
  // Buscar YYYY-MM-DD primero
  const reISO = /(\d{4}-\d{2}-\d{2})/;
  const m1 = s.match(reISO);
  if (m1) {
    const d = parseToDate(m1[0]);
    if (d) return d;
  }
  // Buscar DD-MM-YYYY
  const reDD = /(\d{2}-\d{2}-\d{4})/;
  const m2 = s.match(reDD);
  if (m2) {
    const d = parseToDate(m2[0]);
    if (d) return d;
  }
  // fallback: tomar primer token y probar
  const first = s.split(" ").filter(Boolean)[0];
  if (first) {
    const d = parseToDate(first);
    if (d) return d;
  }
  return null;
}

/** ================== Componente ================== */
export default function FormWaybill() {
  const token = useSelector((state: any) => state.auth.token);
  const navigate = useNavigate();
  const { id } = useParams();

  const [title] = useState("Información de guía");
  const [loading, setLoading] = useState(false);
  const [wb, setWb] = useState<WaybillView | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!id) return;
        setLoading(true);

        // 1) Traer la guía (aceptar res o res.data)
        const raw = await Waybills.getById(id, token);
        const mid = (raw && (raw.data || raw)) || null;
        if (!mid) {
          console.error("Waybills.getById devolvió vacío:", raw);
          setWb(null);
          setLoading(false);
          return;
        }

        // console.debug para debugging del payload (descomenta si querés inspeccionar)
        // console.log("DEBUG waybill raw:", mid);

        // normalizar
        let normalized = normalizeWaybill(mid);

        // Si no vino cadete_name pero hay cadete_id, intentar resolver por Users.getById (si existe)
        try {
          const hasCadeteId = normalized.cadete_id && String(normalized.cadete_id).trim() !== "";
          if (hasCadeteId && (!normalized.cadete_name || String(normalized.cadete_name).trim() === "")) {
            if (Users && typeof (Users as any).getById === "function") {
              try {
                const resp = await (Users as any).getById(normalized.cadete_id, token);
                const r = resp?.data || resp;
                const resolvedName =
                  (r && (r.name || r.user_name || r.fullname || r.displayName)) ||
                  r?.data?.name ||
                  r?.data?.user_name ||
                  "";
                if (resolvedName) {
                  normalized.cadete_name = resolvedName;
                  normalized.cadete = normalized.cadete || {};
                  normalized.cadete.name = normalized.cadete.name || resolvedName;
                }
              } catch (err) {
                // ignore per-user resolution errors
              }
            }
          }
        } catch (e) {
          // no rompemos si falla la resolución del cadete
          console.warn("No se pudo resolver cadete por id:", e);
        }

        // --- resolver email del cliente si no vino en el payload ---
        try {
          const hasEmail = normalized.client_email && String(normalized.client_email).trim() !== "";
          if (!hasEmail) {
            // 1) tratar de obtener email desde campos directos ya presentes en raw
            const possibleDirectEmails =
              mid.client?.email ||
              mid.customer?.email ||
              mid.user?.email ||
              mid.created_by?.email ||
              mid.creator?.email ||
              mid.contact_email ||
              mid.email ||
              mid.customer_email ||
              "";
            if (possibleDirectEmails && String(possibleDirectEmails).trim() !== "") {
              normalized.client_email = possibleDirectEmails;
            } else {
              // 2) si no hay email directo, intentar resolver por userId(s)
              const candidateIds = [
                normalized.user_id,
                mid.user_id,
                mid.client_id,
                mid.customer_id,
                mid.created_by,
                mid.creator_id,
                mid.creator,
                mid.user?.id,
                mid.client?.id,
                mid.customer?.id,
              ].filter(Boolean);

              let resolvedEmail = "";
              if (candidateIds.length && Users && typeof (Users as any).getById === "function") {
                for (const uid of candidateIds) {
                  try {
                    const resp = await (Users as any).getById(uid, token);
                    const u = (resp && (resp.data || resp)) || resp;
                    const cand =
                      u?.email ||
                      u?.email_address ||
                      u?.contact_email ||
                      u?.data?.email ||
                      u?.user?.email ||
                      u?.user?.email_address ||
                      "";
                    if (cand && String(cand).trim() !== "") {
                      resolvedEmail = cand;
                      break;
                    }
                  } catch (err) {
                    /* ignore and continue to next id */
                  }
                }
              }

              // 3) fallback final a propiedades sueltas en mid
              if (!resolvedEmail) {
                resolvedEmail =
                  mid.client?.email ||
                  mid.customer?.email ||
                  mid.user?.email ||
                  mid.created_by?.email ||
                  mid.creator?.email ||
                  mid.email ||
                  mid.customer_email ||
                  "";
              }

              if (resolvedEmail && String(resolvedEmail).trim() !== "") {
                normalized.client_email = resolvedEmail;
              }
            }
          }
        } catch (err) {
          console.warn("No se pudo resolver client_email automáticamente:", err);
        }
        // --- end resolver email ---

        setWb(normalized);
      } catch (e: any) {
        console.error("Error cargando guía:", e);
        setWb(null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  // Normalización flexible: acepta variantes en nombres de campos
  function normalizeWaybill(raw: any): WaybillView {
    const w = { ...(raw || {}) } as any;
    // ID
    w.id = raw.id || raw._id || raw.waybill_id || raw.id_waybill || raw.waybill?.id;

    // cadete info
    w.cadete_id =
      raw.cadete_id ||
      raw.rider_id ||
      raw.cadete?.id ||
      raw.rider?.id ||
      raw.assignment?.cadete_id ||
      raw.assigned_to ||
      raw.assignment?.rider_id ||
      "";
    w.cadete_name =
      raw.cadete_name ||
      raw.rider_name ||
      (raw.cadete && (raw.cadete.name || raw.cadete.user_name)) ||
      raw.cadete?.name ||
      raw.cadete?.user_name ||
      raw.assignment?.cadete_name ||
      raw.assigned_to_name ||
      "";

    // keep cadete object if exists
    w.cadete = raw.cadete || raw.rider || raw.assignment?.cadete || w.cadete || {};

    // dates / pickup
    w.pickup_datetime =
      raw.pickup_datetime || raw.pickup_date || raw.withdrawal_date || raw.withdrawal_at || raw.pickup_at || raw.pickup || "";
    // also set explicit withdrawal_date (helps getWithdrawalDateForView)
    w.withdrawal_date = raw.withdrawal_date || raw.withdrawal_at || raw.pickup_datetime || raw.pickup_date || raw.withdrawal || raw.pickup?.date || "";

    // prefer explicit start/end if provided separately
    w.pickup_start = raw.pickup_start || raw.pickup_hour_start || raw.pickup_time_start || raw.pickup_from || raw.pickup?.start || "";
    w.pickup_end = raw.pickup_end || raw.pickup_hour_end || raw.pickup_time_end || raw.pickup_to || raw.pickup?.end || "";

    w.delivery_date = raw.delivery_date || raw.delivery_at || raw.delivery_datetime || raw.deliver_at || raw.delivery || "";
    w.delivery_start = raw.delivery_start || raw.delivery_hour_start || raw.delivery_time_start || "";
    w.delivery_end = raw.delivery_end || raw.delivery_hour_end || raw.delivery_time_end || "";

    // email cliente: más fallbacks
    w.client_email =
      raw.client_email ||
      raw.company_email ||
      raw.email ||
      raw.customer_email ||
      (raw.client && (raw.client.email || raw.client.contact_email)) ||
      (raw.user && raw.user.email) ||
      raw.created_by?.email ||
      raw.customer?.email ||
      raw.user_email ||
      raw.contact_email ||
      "";

    // remitente (branch / sender)
    const branch = raw.branch || raw.branch_data || raw.sender_branch || raw.origin || {};
    const sender = raw.sender || raw.from || raw.origin || {};
    w.sender = {
      ...sender,
      phone:
        sender.phone ||
        sender.telefono ||
        raw.client_phone ||
        raw.sender_phone ||
        raw.phone ||
        sender?.contact_phone ||
        branch?.phone ||
        raw.user_phone ||
        "",
      address: {
        city:
          sender.city ||
          branch.city ||
          sender.address?.city ||
          sender.address?.locality ||
          branch?.city ||
          raw.origin_city ||
          "",
        neighborhood:
          sender.neighborhood ||
          branch.neighborhood ||
          sender.address?.neighborhood ||
          sender.address?.barrio ||
          branch?.neighborhood ||
          raw.origin_neighborhood ||
          "",
        street:
          sender.address?.street ||
          sender.address?.street_name ||
          sender.address ||
          branch.address ||
          sender.street ||
          raw.origin_street ||
          "",
        apartment: sender.address?.apartment || sender.apartment || branch.address?.apartment || sender.flat || "",
      },
    };

    // destinatario: primer elemento de recipients / receiver / receivers
    const recipientsArr = raw.recipients || raw.receiver || raw.receivers || raw.recipients_list || [];
    const firstReceiver =
      (Array.isArray(recipientsArr) && recipientsArr.length > 0 ? recipientsArr[0] : recipientsArr) ||
      raw.receiver ||
      raw.to ||
      raw.recipient ||
      {};
    const receiverNormalized: Receiver = {
      name:
        firstReceiver.name ||
        firstReceiver.recipient_name ||
        firstReceiver.fullname ||
        firstReceiver.to_name ||
        firstReceiver.displayName ||
        raw.to_name ||
        "",
      email:
        firstReceiver.email ||
        firstReceiver.recipient_email ||
        firstReceiver.to_email ||
        firstReceiver.contact_email ||
        firstReceiver.email_address ||
        firstReceiver.email ||
        "",
      phone:
        firstReceiver.phone ||
        firstReceiver.recipient_phone ||
        firstReceiver.to_phone ||
        firstReceiver.contact_phone ||
        firstReceiver.telefono ||
        "",
      address: {
        city: firstReceiver.city || firstReceiver.address?.city || firstReceiver.to_city || "",
        neighborhood: firstReceiver.neighborhood || firstReceiver.address?.neighborhood || firstReceiver.barrio || "",
        street: firstReceiver.address?.street || firstReceiver.address || firstReceiver.street || firstReceiver.to_address || "",
        apartment: firstReceiver.apartment || firstReceiver.address?.apartment || firstReceiver.flat || "",
      },
    };
    w.receiver = receiverNormalized;

    // paquetes: varios nombres distintos posibles
    if (Array.isArray(raw.packages)) {
      w.packages = raw.packages;
    } else if (Array.isArray(raw.items)) {
      w.packages = raw.items;
    } else if (Array.isArray(raw.package_details)) {
      w.packages = raw.package_details;
    } else if (Array.isArray(raw.package_detail)) {
      w.packages = raw.package_detail;
    } else if (raw.package_detail && typeof raw.package_detail === "object" && !Array.isArray(raw.package_detail)) {
      w.package_detail = raw.package_detail;
    } else {
      w.packages = [];
    }

    // costo / quien paga / notas
    w.shipping_cost = raw.shipping_cost ?? raw.price ?? raw.cost ?? raw.shippingPrice ?? raw.price_shipping ?? raw.shipping;
    w.who_pays = raw.who_pays || raw.payment_by || raw.payer || raw.whoPays || w.who_pays || "";
    w.notes = raw.notes || raw.observations || raw.comment || raw.note || "";

    // fallbacks
    if (!w.sender) w.sender = { phone: raw.sender_phone || raw.client_phone || "", address: {} };
    if (!w.receiver) w.receiver = { name: "", phone: "", email: "", address: {} };

    return w as WaybillView;
  }

  // Helper to safely read numeric-like fields
  const fmtNum = (v: any) => {
    if (v === null || typeof v === "undefined" || v === "") return "-";
    if (typeof v === "number") return v;
    const cleaned = String(v).replace(",", ".").trim();
    if (cleaned === "") return "-";
    return isNaN(Number(cleaned)) ? cleaned : Number(cleaned);
  };

  // paquetes array canonical
  const packagesArray: PackageItem[] = Array.isArray(wb?.packages)
    ? (wb!.packages as PackageItem[])
    : Array.isArray((wb as any)?.items)
    ? (wb as any).items
    : Array.isArray((wb as any)?.package_details)
    ? (wb as any).package_details
    : Array.isArray((wb as any)?.package_detail)
    ? (wb as any).package_detail
    : [];

  const packageFromDetailObject: PackageItem | null =
    wb?.package_detail && !Array.isArray(wb.package_detail) && typeof wb.package_detail === "object" ? (wb.package_detail as PackageItem) : null;

  function renderPackageRow(p: PackageItem, idx: number) {
    const desc = p.description || p.desc || p.name || "-";
    const qty = p.quantity ?? (p as any).qty ?? 1;
    const weight = fmtNum(p.weight ?? p.peso ?? (p.dimensions && p.dimensions.weight));
    const length = fmtNum(p.length ?? (p.dimensions && p.dimensions.length) ?? (p as any).largo ?? (p as any).length_cm);
    const width = fmtNum(p.width ?? (p.dimensions && p.dimensions.width) ?? (p as any).ancho ?? (p as any).width_cm);
    const height = fmtNum(p.height ?? (p.dimensions && p.dimensions.height) ?? (p as any).alto ?? (p as any).height_cm);

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="py-2 px-3 bg-white rounded border">
            <div className="text-xs text-gray-500">Descripción</div>
            <div className="font-medium">{desc}</div>
          </div>
          <div className="py-2 px-3 bg-white rounded border">
            <div className="text-xs text-gray-500">Cantidad</div>
            <div className="font-medium">{String(qty)}</div>
          </div>
          <div className="py-2 px-3 bg-white rounded border">
            <div className="text-xs text-gray-500">Peso (kg)</div>
            <div className="font-medium">{weight === "-" ? "-" : `${weight}`}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="py-2 px-3 bg-white rounded border">
            <div className="text-xs text-gray-500">Largo (cm)</div>
            <div className="font-medium">{length === "-" ? "-" : `${length}`}</div>
          </div>
          <div className="py-2 px-3 bg-white rounded border">
            <div className="text-xs text-gray-500">Ancho (cm)</div>
            <div className="font-medium">{width === "-" ? "-" : `${width}`}</div>
          </div>
          <div className="py-2 px-3 bg-white rounded border">
            <div className="text-xs text-gray-500">Alto (cm)</div>
            <div className="font-medium">{height === "-" ? "-" : `${height}`}</div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.keys(p)
            .filter((k) =>
              ![
                "id",
                "description",
                "desc",
                "name",
                "quantity",
                "weight",
                "length",
                "width",
                "height",
                "value",
                "fragile",
                "dimensions",
              ].includes(k)
            )
            .map((k) => renderKeyValue(k, (p as any)[k]))}
        </div>
      </div>
    );
  }

  // Computed view helpers: withdrawal/delivery dates
  function getWithdrawalDateForView(w: WaybillView | null): string {
    if (!w) return "-";
    // 1) withdrawal_date explicit
    const d1 = parseToDate(w.withdrawal_date);
    if (d1) return dayjs(d1).format("DD/MM/YYYY");
    // 2) try pickup_datetime extract
    const d2 = extractDateFromPickupDatetime(w.pickup_datetime);
    if (d2) return dayjs(d2).format("DD/MM/YYYY");
    // 3) try pickup_start/date fields
    const d3 = parseToDate((w as any).pickup_date || (w as any).pickup);
    if (d3) return dayjs(d3).format("DD/MM/YYYY");
    return "-";
  }

  const withdrawalDateFormatted = getWithdrawalDateForView(wb);
  const deliveryDateFormatted = formatView(wb?.delivery_date || wb?.deliver_at || wb?.delivery_datetime || wb?.delivery);

  // pickup hour: try start/end, else parse from pickup_datetime string if it contains times
  function derivePickupHour(w: WaybillView | null) {
    if (!w) return "-";
    if (w.pickup_start && w.pickup_end) return `${w.pickup_start} - ${w.pickup_end}`;
    if (w.pickup_datetime && typeof w.pickup_datetime === "string") {
      // buscar pattern HH:mm
      const matches = w.pickup_datetime.match(/(\d{1,2}:\d{2})/g);
      if (matches && matches.length >= 2) return `${matches[0]} - ${matches[1]}`;
      if (matches && matches.length === 1) return `${matches[0]}`;
    }
    return "-";
  }
  function deriveDeliveryHour(w: WaybillView | null) {
    if (!w) return "-";
    if (w.delivery_start && w.delivery_end) return `${w.delivery_start} - ${w.delivery_end}`;
    if (w.delivery_hour && typeof w.delivery_hour === "string" && w.delivery_hour.trim()) return w.delivery_hour;
    if (w.delivery_date && typeof w.delivery_date === "string") {
      const matches = String(w.delivery_date).match(/(\d{1,2}:\d{2})/g);
      if (matches && matches.length > 0) return matches.join(" - ");
    }
    return "-";
  }

  return (
    <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-3xl font-bold tracking-tight text-gray-800">{title}</h5>
        <button
          type="button"
          title="Volver"
          onClick={() => navigate(-1)}
          className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-2"
        >
          <Icon path={mdiArrowLeft} size={1} />
        </button>
      </div>

      {loading && <p className="text-gray-600">Cargando...</p>}

      {!loading && !wb && <p className="text-red-600">No se encontró la guía o hubo un error al cargarla. Revisá consola.</p>}

      {!loading && wb && (
        <>
          {/* Cadete asignado */}
          <div className="py-3 px-4 bg-gray-100 rounded mb-4 w-full">
            <div className="text-xs text-gray-500">Cadete asignado</div>
            <div className="font-semibold text-lg">
              {wb.cadete_name ||
                (wb.cadete && (wb.cadete.name || wb.cadete.user_name)) ||
                (wb.cadete_id ? `#${String(wb.cadete_id).substring(0, 6)}...` : "No asignado")}
            </div>
          </div>

          {/* Fechas y horarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="py-2 px-3 bg-gray-100 rounded">
              <div className="text-xs text-gray-500">Fecha de retiro</div>
              <div className="font-semibold">{withdrawalDateFormatted}</div>
            </div>
            <div className="py-2 px-3 bg-gray-100 rounded">
              <div className="text-xs text-gray-500">Horario de retiro</div>
              <div className="font-semibold">{derivePickupHour(wb)}</div>
            </div>

            <div className="py-2 px-3 bg-gray-100 rounded">
              <div className="text-xs text-gray-500">Fecha de entrega</div>
              <div className="font-semibold">{deliveryDateFormatted}</div>
            </div>
            <div className="py-2 px-3 bg-gray-100 rounded">
              <div className="text-xs text-gray-500">Horario de entrega</div>
              <div className="font-semibold">{deriveDeliveryHour(wb)}</div>
            </div>
          </div>

          {/* Correo cliente / quien paga / precio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
            <div className="py-2 px-3 bg-gray-100 rounded">
              <div className="text-xs text-gray-500">Quién Paga</div>
              <div className="font-semibold">{wb.who_pays || "-"}</div>
            </div>
            <div className="py-2 px-3 bg-gray-100 rounded">
              <div className="text-xs text-gray-500">Precio</div>
              <div className="font-semibold">
                {typeof wb.shipping_cost === "number" ? wb.shipping_cost : wb.shipping_cost ?? "-"}
              </div>
            </div>
          </div>

          {/* Remitente (orden solicitado) */}
          <div className="border-t border-gray-200 pt-4">
            <h6 className="text-lg font-bold mb-3">Información del remitente</h6>

            {/* Primera fila: Ciudad - Barrio - Dirección */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="py-2 px-3 bg-gray-100 rounded">
                <div className="text-xs text-gray-500">Ciudad</div>
                <div className="font-semibold">{wb.sender?.address?.city || "-"}</div>
              </div>
              <div className="py-2 px-3 bg-gray-100 rounded">
                <div className="text-xs text-gray-500">Barrio</div>
                <div className="font-semibold">{wb.sender?.address?.neighborhood || "-"}</div>
              </div>
              <div className="py-2 px-3 bg-gray-100 rounded">
                <div className="text-xs text-gray-500">Dirección</div>
                <div className="font-semibold">{wb.sender?.address?.street || "-"}</div>
              </div>
            </div>

            {/* Segunda fila: Apartamento - Teléfono - Email remitente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div className="py-2 px-3 bg-gray-100 rounded">
                <div className="text-xs text-gray-500">Teléfono</div>
                <div className="font-semibold">{wb.sender?.phone || wb.sender?.contact_phone || "-"}</div>
              </div>
              <div className="py-2 px-3 bg-gray-100 rounded">
                <div className="text-xs text-gray-500">Email (empresa/cliente)</div>
                <div className="font-semibold">{wb.client_email || wb.company_email || "-"}</div>
              </div>
            </div>
          </div>

          {/* Destinatario */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h6 className="text-lg font-bold mb-3">Información del destinatario</h6>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="py-2 px-3 bg-white rounded border">
                <div className="text-xs text-gray-500">Ciudad</div>
                <div className="font-semibold">{wb.receiver?.address?.city || "-"}</div>
              </div>
              <div className="py-2 px-3 bg-white rounded border">
                <div className="text-xs text-gray-500">Barrio</div>
                <div className="font-semibold">{wb.receiver?.address?.neighborhood || "-"}</div>
              </div>
              <div className="py-2 px-3 bg-white rounded border">
                <div className="text-xs text-gray-500">Dirección</div>
                <div className="font-semibold">{wb.receiver?.address?.street || "-"}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div className="py-2 px-3 bg-white rounded border">
                <div className="text-xs text-gray-500">Apartamento</div>
                <div className="font-semibold">{wb.receiver?.address?.apartment || "-"}</div>
              </div>
              <div className="py-2 px-3 bg-white rounded border">
                <div className="text-xs text-gray-500">Nombre Destinatario</div>
                <div className="font-semibold">{wb.receiver?.name || "-"}</div>
              </div>
              <div className="py-2 px-3 bg-white rounded border">
                <div className="text-xs text-gray-500">Teléfono</div>
                <div className="font-semibold">{wb.receiver?.phone || "-"}</div>
              </div>
            </div>

            <div className="py-2 px-3 bg-white rounded border mt-3">
              <div className="text-xs text-gray-500">Notas</div>
              <div className="font-semibold">{(wb.notes || "").trim() || "-"}</div>
            </div>
          </div>

          {/* Detalle de paquete */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h6 className="text-lg font-bold mb-3">Detalle del paquete</h6>

            {packageFromDetailObject ? (
              <div className="p-3 bg-gray-50 border rounded">{renderPackageRow(packageFromDetailObject, 1)}</div>
            ) : Array.isArray(packagesArray) && packagesArray.length > 0 ? (
              <div className="space-y-4">
                {packagesArray.map((p: PackageItem, idx: number) => (
                  <div key={p.id || idx} className="p-3 bg-gray-50 border rounded">
                    <div className="mb-2 font-semibold">Paquete #{idx + 1}</div>
                    {renderPackageRow(p, idx + 1)}
                  </div>
                ))}
              </div>
            ) : wb?.package_detail && typeof wb.package_detail === "object" ? (
              <div className="p-3 bg-gray-50 border rounded">{renderPackageRow(wb.package_detail as PackageItem, 1)}</div>
            ) : (
              <div className="text-sm text-gray-500">No hay detalles de paquete registrados.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

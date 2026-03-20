import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/es";
import { Waybills } from "@/modules/waybills/infrastructure/waybillsService";
import { Companies } from "@/modules/companies/infrastructure/companiesService";
import { Users } from "@/modules/users/infrastructure/usersService";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { Icon } from "@mdi/react";
import { mdiArrowLeft, mdiTrashCanOutline, mdiPlusCircle } from "@mdi/js";
import DateFilter from "./DateFilter";
import DateFilterDelivery from "./DateFilterDelivery";
import SelectHoursRange from "./SelectHoursRange";
import SelectCity from "./SelectCity";
import SelectNeighborhood from "./SelectNeighborhood";

dayjs.locale("es");
dayjs.extend(customParseFormat);

/** ================== Tipos ================== */
type Branch = {
  id: string;
  name: string;
  address: { city: string; neighborhood: string; street: string; apartment?: string };
  phone?: string;
  contact?: { phone?: string };
};

type Company = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  user_name?: string;
  branches: Branch[];
};

type PackageDetail = {
  type?: string;
  package_number?: string;
  description?: string;
  weight?: number;
  quantity?: number;
  price?: number;
  dimensions?: { length?: number; width?: number; height?: number };
  [k: string]: any;
};

type FormDataState = {
  company_name: string;
  user_name: string;
  branch_id: string;
  date: Date;
  hour: string; // rango u hora de retiro
  price: number;
  sender_city: string;
  sender_neighborhood: string;
  sender_address: string;
  sender_apartment: string;
  sender_phone: string;
  recipient_city: string;
  recipient_neighborhood: string;
  recipient_address: string;
  recipient_apartment: string; // agregado
  recipient_phone: string;
  recipient_name: string;
  who_pays: "Remitente" | "Destinatario";
  notes: string;
  withdrawal_date: Date;
  delivery_date: Date;
  delivery_hour: string; // HH:mm o rango
  package_detail: PackageDetail[];
  status?: string;
  cadete_id?: string | null;
  client_email?: string;
};

type ComponentProps = { type?: "get" | "post" | "put" };

/** ================== Helpers Fecha ================== */
const DDMMYYYY = "DD-MM-YYYY";
const KNOWN_FORMATS = [
  DDMMYYYY,
  "YYYY-MM-DD",
  "DD/MM/YYYY",
  "YYYY/MM/DD",
  "YYYY-MM-DDTHH:mm:ssZ",
  "YYYY-MM-DDTHH:mm:ss.SSSZ",
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
  const d2 = dayjs(s);
  return d2.isValid() ? d2.toDate() : null;
}

function toDDMMYYYY(dateLike: any): string {
  const d = parseToDate(dateLike);
  return d ? dayjs(d).format(DDMMYYYY) : "";
}

// Extrae FECHA desde pickup_datetime aceptando YYYY-MM-DD o DD-MM-YYYY
function pickupDateFromString(pickup_datetime?: string): Date | null {
  if (!pickup_datetime) return null;
  const s = pickup_datetime.trim();
  const datePart = s.split(" ").filter(Boolean)[0] || "";
  const d1 = dayjs(datePart, "YYYY-MM-DD", true);
  if (d1.isValid()) return d1.toDate();
  const d2 = dayjs(datePart, "DD-MM-YYYY", true);
  if (d2.isValid()) return d2.toDate();
  return null;
}

// Devuelve { start, end, ddmmyyyy } a partir de pickup_datetime
function parsePickupDatetime(s: string): { start: string; end: string; ddmmyyyy: string } {
  const dateOnly = pickupDateFromString(s);
  const ddmmyyyy = dateOnly ? dayjs(dateOnly).format(DDMMYYYY) : "";

  const parts = s.trim().split(" ").filter(Boolean);
  let start = "";
  let end = "";
  if (parts.length >= 4 && (parts[2] === "-" || parts[2] === "–" || parts[2] === "—")) {
    start = parts[1];
    end = parts[3] || "";
  } else {
    start = parts.slice(1).join(" ").trim();
  }
  return { start, end, ddmmyyyy };
}

/** ================== Componente ================== */
export default function FormWaybillAdmin({ type = "get" }: ComponentProps) {
  const token = useSelector((state: any) => state.auth.token);
  const role = useSelector((state: any) => state.auth.role);
  const navigate = useNavigate();
  const { id } = useParams();

  const [typeForm, setTypeForm] = useState<"get" | "post" | "put">(type);
  const [title, setTitle] = useState("Información de guía");
  const [btn, setBtn] = useState("Guardar");
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState<{ branch_id: boolean }>({ branch_id: false });

  const [selectCompany, setSelectCompany] = useState<Company>({
    id: "",
    name: "",
    email: "",
    branches: [],
  });

  const [data, setData] = useState<FormDataState>({
    company_name: "",
    user_name: "",
    branch_id: "",
    date: new Date(),
    hour: "",
    price: 0,
    sender_city: "",
    sender_neighborhood: "",
    sender_address: "",
    sender_apartment: "",
    sender_phone: "",
    recipient_city: "",
    recipient_neighborhood: "",
    recipient_address: "",
    recipient_apartment: "",
    recipient_phone: "",
    recipient_name: "",
    who_pays: "Remitente",
    notes: "",
    withdrawal_date: new Date(),
    delivery_date: new Date(),
    delivery_hour: "",
    package_detail: [],
    status: "",
    cadete_id: null,
    client_email: "",
  });

  // Permisos
  const isAdmin = role === "Admin" || role === "Super Admin";
  const isCliente = role === "Cliente";

  useEffect(() => {
    (async () => {
      try {
        // form mode
        if (type === "post") {
          setTypeForm("post");
          setBtn("Crear");
          setTitle("Crear guía");
        } else {
          if (isAdmin && type === "get") {
            setTypeForm("put");
            setBtn("Guardar cambios");
            setTitle("Editar guía");
          } else if (type === "put") {
            setTypeForm("put");
            setBtn("Guardar cambios");
            setTitle("Editar guía");
          } else {
            setTypeForm("get");
            setDisabled({ branch_id: true });
            setTitle("Información de guía");
            setBtn("Guardar");
          }
        }

        if ((type === "put" || type === "get") && id) {
          setLoading(true);
          const wb: any = await Waybills.getById(id, token);
          // normalize minimal
          const parsedPickup = parsePickupDatetime(wb?.pickup_datetime || "");
          const wd =
            parseToDate(wb?.withdrawal_date) ||
            pickupDateFromString(wb?.pickup_datetime) ||
            parseToDate(parsedPickup.ddmmyyyy) ||
            new Date();
          const dd = parseToDate(wb?.delivery_date) || new Date();

          // Resolvemos company
          let resolvedCompany: Company = {
            id: "",
            name: "",
            email: "",
            phone: "",
            user_name: "",
            branches: [],
          };
          try {
            const companyResp = await Companies.getById(wb.company_id, token);
            if (companyResp?.data) {
              resolvedCompany = {
                id: companyResp.data.id || "",
                name: companyResp.data.name || "",
                email: companyResp.data.email || "",
                phone: companyResp.data.phone || "",
                user_name: companyResp.data.user_name || "",
                branches: companyResp.data.branches || [],
              };
            }
          } catch (e) {
            resolvedCompany = {
              id: wb.company_id || "",
              name: wb.company_name || "",
              email: wb.company_email || wb.client_email || "",
              phone: wb.company_phone || "",
              user_name: wb.company_user_name || "",
              branches: wb.branches || [],
            };
          }

          // normalize package details if backend returns single object
          const pkArray =
            Array.isArray(wb.package_details) && wb.package_details.length
              ? wb.package_details
              : Array.isArray(wb.packages) && wb.packages.length
              ? wb.packages
              : Array.isArray(wb.items) && wb.items.length
              ? wb.items
              : wb.package_detail && !Array.isArray(wb.package_detail)
              ? [wb.package_detail]
              : wb.package_detail || [];

          setSelectCompany(resolvedCompany);
          setData({
            company_name: wb?.company_name || resolvedCompany.name || "",
            user_name: resolvedCompany.user_name || "",
            branch_id: wb?.branch_id || "",
            date: wd,
            hour: parsedPickup.end ? `${parsedPickup.start} - ${parsedPickup.end}` : parsedPickup.start || "",
            price: Number(wb?.shipping_cost || 0),
            sender_city: wb?.sender?.address?.city || wb?.branch?.address?.city || "",
            sender_neighborhood: wb?.sender?.address?.neighborhood || wb?.branch?.address?.neighborhood || "",
            sender_address: wb?.sender?.address?.street || wb?.branch?.address?.street || "",
            sender_apartment: wb?.sender?.address?.apartment || wb?.branch?.address?.apartment || "",
            sender_phone: wb?.sender?.phone || wb?.branch?.phone || "",
            recipient_city: wb?.receiver?.address?.city || "",
            recipient_neighborhood: wb?.receiver?.address?.neighborhood || "",
            recipient_address: wb?.receiver?.address?.street || "",
            recipient_apartment: wb?.receiver?.address?.apartment || "", // mapeo nuevo
            recipient_phone: wb?.receiver?.phone || "",
            recipient_name: wb?.receiver?.name || "",
            who_pays: wb?.who_pays === "Destinatario" ? "Destinatario" : "Remitente",
            notes: wb?.notes || "",
            withdrawal_date: wd,
            delivery_date: dd,
            delivery_hour: wb?.delivery_hour || "",
            package_detail: (pkArray || []).map((p: any) => ({
              type: p?.type || "",
              package_number: p?.package_number || p?.package || "",
              description: p?.description || p?.desc || p?.name || "",
              weight: Number(p?.weight || p?.peso || 0),
              quantity: Number(p?.quantity || p?.qty || 1),
              price: Number(p?.price || 0),
              dimensions: {
                length: Number((p?.dimensions && p.dimensions.length) || p?.length || 0),
                width: Number((p?.dimensions && p.dimensions.width) || p?.width || 0),
                height: Number((p?.dimensions && p.dimensions.height) || p?.height || 0),
              },
            })),
            status: wb?.status || "",
            cadete_id: wb?.cadete_id ?? null,
            client_email: wb?.client_email || wb?.company_email || "",
          });
        }
      } catch (err) {
        console.error("Error cargando guía:", err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, type, role]);

  /** ============ Setters ============ */
  const setSelectDate = (value: Date | null) => {
    setData((prev) => ({
      ...prev,
      withdrawal_date: (value || prev.withdrawal_date) as Date,
      date: (value || prev.date) as Date,
    }));
  };
  const setSelectDateDelivery = (value: Date | null) => {
    setData((prev) => ({ ...prev, delivery_date: (value || prev.delivery_date) as Date }));
  };
  const setSelectHours = (value: string) => setData((prev) => ({ ...prev, hour: value }));
  const setSelectDeliveryHour = (value: string) => setData((prev) => ({ ...prev, delivery_hour: value }));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;

    // Al elegir sucursal actualizo remitente (pero la remitente sigue siendo no editable)
    if (id === "branch_id") {
      const branch = selectCompany.branches.find((b) => b.id === value);
      if (branch) {
        setData((prev) => ({
          ...prev,
          branch_id: value,
          sender_city: branch.address.city || prev.sender_city,
          sender_neighborhood: branch.address.neighborhood || prev.sender_neighborhood,
          sender_address: branch.address.street || prev.sender_address,
          sender_apartment: branch.address.apartment || prev.sender_apartment || "",
          sender_phone: branch.phone || branch?.contact?.phone || prev.sender_phone || selectCompany?.phone || "",
        }));
        return;
      } else {
        setData((prev) => ({ ...prev, branch_id: value }));
        return;
      }
    }

    // convertir a number en ciertos campos
    if (id === "price") {
      const numeric = Number(String(value).replace(",", ".") || 0);
      setData((prev) => ({ ...prev, price: isNaN(numeric) ? 0 : numeric }));
      return;
    }

    // campos del package_detail no pasan por aquí (tienen su propio handler)
    setData((prev) => ({ ...prev, [id]: value } as any));
  };

  const handlePackageChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = [...data.package_detail];
    // asegurarnos que exista dimensions
    if (!updated[idx]) updated[idx] = { description: "", dimensions: { length: 0, width: 0, height: 0 }, quantity: 1, weight: 0, price: 0 };
    if (name === "length" || name === "width" || name === "height") {
      updated[idx].dimensions = {
        ...(updated[idx].dimensions || { length: 0, width: 0, height: 0 }),
        [name]: Number(value || 0),
      };
    } else if (name === "quantity" || name === "weight" || name === "price") {
      (updated[idx] as any)[name] = Number(value || 0);
    } else {
      (updated[idx] as any)[name] = value;
    }
    setData((prev) => ({ ...prev, package_detail: updated }));
  };

  const addPackage = () => {
    setData((prev) => ({
      ...prev,
      package_detail: [
        ...prev.package_detail,
        {
          type: "Box",
          package_number: "",
          description: "",
          weight: 0,
          quantity: 1,
          price: 0,
          dimensions: { length: 0, width: 0, height: 0 },
        },
      ],
    }));
  };
  const removePackage = (idx: number) => {
    setData((prev) => ({
      ...prev,
      package_detail: prev.package_detail.filter((_, i) => i !== idx),
    }));
  };

  /** ============ Submit ============ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pickup = parseToDate(data.withdrawal_date) as Date;
    const deliver = parseToDate(data.delivery_date) as Date;
    if (!isNaN(pickup.getTime()) && !isNaN(deliver.getTime()) && deliver < pickup) {
      Swal.fire({
        icon: "error",
        title: "Fechas inválidas",
        text: "La fecha de entrega no puede ser anterior a la de retiro",
      });
      return;
    }

    setLoading(true);

    const ddmmyyyy = (d: Date) => dayjs(d).format("DD-MM-YYYY");
    const yyyymmdd = (d: Date) => dayjs(d).format("YYYY-MM-DD");
    const toISOStart = (d: Date) => dayjs(d).startOf("day").toISOString();

    const withdrawal_ddmmyyyy = ddmmyyyy(pickup);
    const withdrawal_yyyymmdd = yyyymmdd(pickup);
    const delivery_ddmmyyyy = ddmmyyyy(deliver);

    const pickup_datetime =
      typeForm === "put"
        ? `${withdrawal_yyyymmdd}${(data.hour || "").trim() ? ` ${data.hour.trim()}` : ""}`.trim()
        : `${withdrawal_ddmmyyyy}${(data.hour || "").trim() ? ` ${data.hour.trim()}` : ""}`.trim();

    // Normalizo packages para enviar
    const normalizedPackages = (data.package_detail || []).map((p) => ({
      type: p.type || "Box",
      package_number: p.package_number || "",
      description: p.description || "",
      weight: Number(p.weight || 0),
      quantity: Number(p.quantity || 1),
      price: Number(p.price || 0),
      dimensions: {
        length: Number(p.dimensions?.length || 0),
        width: Number(p.dimensions?.width || 0),
        height: Number(p.dimensions?.height || 0),
      },
    }));

    const base: any = {
      company_id: (selectCompany as any)?.id || undefined,
      branch_id: data.branch_id || undefined,
      company_name: (selectCompany as any)?.name || data.company_name,
      pickup_datetime,
      who_pays: data.who_pays,
      notes: data.notes,
      receiver: {
        name: data.recipient_name,
        address: {
          city: data.recipient_city,
          neighborhood: data.recipient_neighborhood,
          street: data.recipient_address,
          apartment: data.recipient_apartment || "",
        },
        phone: data.recipient_phone,
      },
      package_details: normalizedPackages,
      shipping_cost: Number(data.price || 0),
      status: typeForm === "post" ? "Procesando" : data.status,
      delivery_hour: (data.delivery_hour || "").trim(),
      client_email: data.client_email || undefined,
    };

    try {
      let result;
      if (typeForm === "put") {
        const payloadPut = {
          ...base,
          withdrawal_date: toISOStart(pickup),
          delivery_date: toISOStart(deliver),
        };
        result = await Waybills.put(id as string, payloadPut, token);
      } else {
        const payloadPost = {
          ...base,
          withdrawal_date: withdrawal_ddmmyyyy,
          delivery_date: delivery_ddmmyyyy,
        };
        result = await Waybills.set(payloadPost, token);
      }

      if (result && (result.id || result._id || result.success)) {
        Swal.fire({
          icon: "success",
          title: "Guía guardada",
        }).then(() => navigate(-1));
      } else {
        Swal.fire({
          icon: "error",
          title: result?.error || "Error",
          text: result?.mensaje || "No se pudo guardar la guía.",
        });
      }
    } catch (err: any) {
      console.error("Error al guardar guía:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.message || "Ocurrió un error al guardar la guía.",
      });
    } finally {
      setLoading(false);
    }
  };

  /** ============ Desasignar cadete (Admin) ============ */
  const unassignCadete = async () => {
    if (!id) return;
    const conf = await Swal.fire({
      title: "Desasignar cadete",
      text: "¿Seguro quieres desasignar el cadete de esta guía? Quedará disponible para asignar nuevamente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, desasignar",
      cancelButtonText: "Cancelar",
    });
    if (!conf.isConfirmed) return;

    try {
      Swal.fire({ title: "", text: "Desasignando...", didOpen: () => Swal.showLoading() });
      const resp = await Waybills.cadeteSet(id, { cadete_id: "" }, token);
      if (resp && (resp.id || resp._id || resp.success)) {
        Swal.fire({ icon: "success", title: "Cadete desasignado" });
        const wb: any = await Waybills.getById(id, token);
        const parsedPickup = parsePickupDatetime(wb?.pickup_datetime || "");
        const wd = parseToDate(wb?.withdrawal_date) || pickupDateFromString(wb?.pickup_datetime) || parseToDate(parsedPickup.ddmmyyyy) || new Date();
        const dd = parseToDate(wb?.delivery_date) || new Date();
        setData((prev) => ({ ...prev, cadete_id: wb?.cadete_id ?? null, status: wb?.status || prev.status, withdrawal_date: wd, delivery_date: dd }));
      } else {
        Swal.fire({ icon: "error", title: "No se pudo desasignar", text: resp?.mensaje || resp?.error || "" });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Ocurrió un error al desasignar." });
    }
  };

  // control de permisos por fila:
  const canEdit = isAdmin || (isCliente && (!data.cadete_id || String(data.cadete_id).trim() === ""));

  // helpers
  const withdrawalDateFormatted = data.withdrawal_date ? dayjs(data.withdrawal_date).format("DD/MM/YYYY") : "-";
  const deliveryDateFormatted = data.delivery_date ? dayjs(data.delivery_date).format("DD/MM/YYYY") : "-";

  return (
    <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-3xl font-bold tracking-tight text-gray-800">{title}</h5>
        <div className="flex items-center gap-2">
          {isAdmin && data.cadete_id && (
            <button
              type="button"
              onClick={unassignCadete}
              title="Desasignar cadete"
              className="text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm px-3 py-2"
            >
              <Icon path={mdiTrashCanOutline} size={0.9} />
            </button>
          )}
          <button
            type="button"
            title="Cerrar"
            onClick={() => navigate(-1)}
            className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-2"
          >
            <Icon path={mdiArrowLeft} size={1} />
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-600">Cargando...</p>}

      {!loading && (
        <form onSubmit={handleSubmit}>
          <div className="flex flex-wrap -mx-2">
            {/* Sucursal (editable según permisos) */}
            <div className="w-full md:w-1/4 px-2">
              <label htmlFor="branch_id" className="block mb-2 text-sm font-medium text-gray-700">
                Dirección retiro
              </label>
              <select
                id="branch_id"
                value={data.branch_id}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-1 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={!canEdit || disabled.branch_id}
              >
                <option value="">Selecciona una dirección</option>
                {(selectCompany.branches || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha retiro */}
            <div className="w-full md:w-1/4 px-2">
              {typeForm === "get" && !canEdit ? (
                <p className="py-2 px-3 bg-gray-100 rounded">Fecha de retiro: {withdrawalDateFormatted}</p>
              ) : (
                <DateFilter
                  value={data.date instanceof Date && !isNaN(data.date.getTime()) ? data.date : null}
                  set={setSelectDate}
                  label="Fecha de retiro"
                />
              )}
            </div>

            {/* Hora retiro */}
            <div className="w-full md:w-1/3 px-2">
              <SelectHoursRange
                value={data.hour}
                set={setSelectHours}
                labelText="Horario de retiro (8hs - 16hs)"
                required={true}
                disabled={!canEdit}
              />
            </div>

            {/* Precio */}
            <div className="w-full md:w-1/4 px-2 ">
              <label htmlFor="price" className="block mb-2 text-sm font-medium text-gray-700">
                Precio de envío
              </label>
              <input
                type="text"
                id="price"
                value={String(data.price ?? "")}
                onChange={handleChange}
                placeholder="Precio"
                className="mb-6 py-2 pl-3 pr-1 bg-gray-50 border border-gray-300 text-black text-sm rounded-lg block w-full"
                disabled={!canEdit}
              />
            </div>

            {/* Fecha entrega */}
            <div className="w-full md:w-1/4 px-2">
              {typeForm === "get" && !canEdit ? (
                <p className="py-2 px-3 bg-gray-100 rounded">Fecha de entrega: {deliveryDateFormatted}</p>
              ) : (
                <DateFilterDelivery
                  value={data.delivery_date instanceof Date && !isNaN(data.delivery_date.getTime()) ? data.delivery_date : null}
                  set={setSelectDateDelivery}
                  label="Fecha de entrega"
                />
              )}
            </div>

            {/* Hora entrega */}
            <div className="w-full md:w-1/3 px-2 ">
              <SelectHoursRange
                value={data.delivery_hour}
                set={setSelectDeliveryHour}
                required={true}
                disabled={!canEdit}
                labelText="Horario de entrega (9hs - 18hs)"
              />
            </div>

            {/* Email empresa (no editable) */}
            <div className="w-full md:w-1/4 px-2 ">
               <label htmlFor="who_pays" className="block mb-2 text-sm font-medium text-gray-700">
                Quién Paga
              </label>
              <select
                id="who_pays"
                value={data.who_pays}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px]"
                required
                disabled={!canEdit}
              >
                <option value="Remitente">Remitente</option>
                <option value="Destinatario">Destinatario</option>
              </select>
            </div>
          </div>

          {/* Remitente (siempre NO editable) */}
          <h6 className="text-lg font-bold mb-4">Información del remitente</h6>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <div className="mb-3">
              <label htmlFor="sender_city" className="block mb-2 text-sm font-medium text-gray-700">
                Ciudad
              </label>
              <input
                type="text"
                id="sender_city"
                value={data.sender_city}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-gray-100 border border-gray-300 rounded-[10px]"
                disabled
                readOnly
              />
            </div>
            <div className="mb-3">
              <label htmlFor="sender_neighborhood" className="block mb-2 text-sm font-medium text-gray-700">
                Barrio
              </label>
              <input
                type="text"
                id="sender_neighborhood"
                value={data.sender_neighborhood}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-gray-100 border border-gray-300 rounded-[10px]"
                disabled
                readOnly
              />
            </div>
            <div className="mb-3">
              <label htmlFor="sender_address" className="block mb-2 text-sm font-medium text-gray-700">
                Dirección
              </label>
              <input
                type="text"
                id="sender_address"
                value={data.sender_address}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-gray-100 border border-gray-300 rounded-[10px]"
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mt-3">
            <div className="mb-3">
              <label htmlFor="sender_apartment" className="block mb-2 text-sm font-medium text-gray-700">
                Apartamento
              </label>
              <input
                type="text"
                id="sender_apartment"
                value={data.sender_apartment}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-gray-100 border border-gray-300 rounded-[10px]"
                disabled
                readOnly
              />
            </div>
            <div className="mb-3">
              <label htmlFor="sender_phone" className="block mb-2 text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="text"
                id="sender_phone"
                value={data.sender_phone}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-gray-100 border border-gray-300 rounded-[10px]"
                disabled
                readOnly
              />
            </div>
            <div className="mb-3">
              <label htmlFor="sender_email" className="block mb-2 text-sm font-medium text-gray-700">
                Email remitente
              </label>
              <input
                type="text"
                id="sender_email"
                value={selectCompany.email || ""}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-gray-100 border border-gray-300 rounded-[10px]"
                disabled
                readOnly
              />
            </div>
          </div>

          {/* Destinatario */}
          <h6 className="text-lg font-bold mb-4 mt-6">Información del destinatario</h6>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            {/* agregué label para Ciudad */}
            <div className="mb-3">
              <label className="block mb-2 text-sm font-medium text-gray-700">Ciudad</label>
              <SelectCity
                id="recipient_city"
                name="recipient_city"
                token={token}
                value={data.recipient_city || ""}
                disabled={!canEdit}
                set={(v: any) =>
                  setData((prev) => ({
                    ...prev,
                    recipient_city: v,
                    recipient_neighborhood: "",
                  }))
                }
                onChange={handleChange}
              />
            </div>

            {/* agregué label para Barrio */}
            <div className="mb-3">
              <label className="block mb-2 text-sm font-medium text-gray-700">Barrio</label>
              <SelectNeighborhood
                id="recipient_neighborhood"
                name="recipient_neighborhood"
                city={data.recipient_city || ""}
                value={data.recipient_neighborhood || ""}
                set={(v: string) => setData((prev) => ({ ...prev, recipient_neighborhood: v }))}
                disabled={!canEdit}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="recipient_address" className="block mb-2 text-sm font-medium text-gray-700">
                Dirección
              </label>
              <input
                type="text"
                id="recipient_address"
                value={data.recipient_address}
                onChange={handleChange}
                placeholder="Dirección"
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px]"
                required
                disabled={!canEdit}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="recipient_apartment" className="block mb-2 text-sm font-medium text-gray-700">
                Apartamento
              </label>
              <input
                type="text"
                id="recipient_apartment"
                value={data.recipient_apartment}
                onChange={handleChange}
                placeholder="Apartamento"
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px]"
                disabled={!canEdit}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="recipient_name" className="block mb-2 text-sm font-medium text-gray-700">
                Nombre Destinatario
              </label>
              <input
                type="text"
                id="recipient_name"
                value={data.recipient_name}
                onChange={handleChange}
                placeholder="Nombre completo"
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px]"
                disabled={!canEdit}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="recipient_phone" className="block mb-2 text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="text"
                id="recipient_phone"
                value={data.recipient_phone}
                onChange={handleChange}
                placeholder="Teléfono"
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px]"
                required
                disabled={!canEdit}
              />
            </div>

            <div className="mb-3 sm:col-span-3">
              <label htmlFor="notes" className="block mb-2 text-sm font-medium text-gray-700">
                Notas
              </label>
              <textarea
                id="notes"
                value={data.notes}
                disabled={!canEdit}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px]"
                placeholder=""
              ></textarea>
            </div>
          </div>

          {/* Paquetes */}
          <div className="mb-3">
            <h6 className="mb-2 text-lg font-medium text-gray-700 flex items-center justify-center space-x-2">
              <span>Detalle de paquete</span>
              {canEdit && (
               <button
                               type="button"
                               onClick={addPackage}
                               className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                             >
                               <Icon path={mdiPlusCircle} size={1} />
                             </button>
              )}
            </h6>
            {data.package_detail.length === 0 && <div className="text-sm text-gray-500">No hay paquetes registrados.</div>}
            {data.package_detail.map((item, index) => (
              <div key={index} className="flex items-center mb-4">
                <div className="flex w-full flex-wrap">
                  <div className="w-full md:w-2/5 mb-5 pr-2">
                    <label htmlFor={`description_${index}`} className="block mb-2 text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <input
                      type="text"
                      id={`description_${index}`}
                      name="description"
                      value={item.description || ""}
                      onChange={(e) => handlePackageChange(index, e)}
                      className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full py-2 pl-3 pr-1"
                      required
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="w-full md:w-3/5 flex flex-wrap">
                    <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                      <label htmlFor={`quantity_${index}`} className="block mb-2 text-sm font-medium text-gray-700">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        id={`quantity_${index}`}
                        name="quantity"
                        value={item.quantity ?? 1}
                        onChange={(e) => handlePackageChange(index, e)}
                        className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                        required
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                      <label htmlFor={`weight_${index}`} className="block mb-2 text-sm font-medium text-gray-700">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        id={`weight_${index}`}
                        name="weight"
                        value={item.weight ?? 0}
                        onChange={(e) => handlePackageChange(index, e)}
                        className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                        required
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                      <label htmlFor={`length_${index}`} className="block mb-2 text-sm font-medium text-gray-700">
                        Largo (cm)
                      </label>
                      <input
                        type="number"
                        id={`length_${index}`}
                        name="length"
                        value={item.dimensions?.length ?? 0}
                        onChange={(e) => handlePackageChange(index, e)}
                        className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                        required
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                      <label htmlFor={`width_${index}`} className="block mb-2 text-sm font-medium text-gray-700">
                        Ancho (cm)
                      </label>
                      <input
                        type="number"
                        id={`width_${index}`}
                        name="width"
                        value={item.dimensions?.width ?? 0}
                        onChange={(e) => handlePackageChange(index, e)}
                        className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                        required
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                      <label htmlFor={`height_${index}`} className="block mb-2 text-sm font-medium text-gray-700">
                        Alto (cm)
                      </label>
                      <input
                        type="number"
                        id={`height_${index}`}
                        name="height"
                        value={item.dimensions?.height ?? 0}
                        onChange={(e) => handlePackageChange(index, e)}
                        className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                        required
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-end ml-3">
                  {canEdit && (
                    <button type="button" onClick={() => removePackage(index)} className="p-3 bg-red-500 text-white rounded-full">
                      <Icon path={mdiTrashCanOutline} size={0.9} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {canEdit && (
            <button type="submit" className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300" disabled={loading}>
              {loading ? "Guardando..." : btn}
            </button>
          )}
        </form>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/es";
import { Waybills } from "@/modules/waybills/infrastructure/waybillsService";
import { Companies } from "@/modules/companies/infrastructure/companiesService";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { Icon } from "@mdi/react";
import { mdiArrowLeft, mdiDelete, mdiPlusCircle } from "@mdi/js";
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
  type: string;
  package_number: string;
  description: string;
  weight: number;
  quantity: number;
  price: number;
  dimensions: { length: number; width: number; height: number };
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
  sender_apartment?: string;
  sender_phone: string;
  recipient_city: string;
  recipient_neighborhood: string;
  recipient_address: string;
  recipient_apartment?: string; // agregado
  recipient_phone: string;
  recipient_name: string;
  who_pays: "Remitente" | "Destinatario";
  notes: string;
  withdrawal_date: Date;
  delivery_date: Date;
  delivery_hour: string; // HH:mm o rango
  package_detail: PackageDetail[];
  status?: string;
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
  // formatos típicos: [fecha, "09:00", "-", "12:00"]
  let start = "";
  let end = "";
  if (parts.length >= 4 && (parts[2] === "-" || parts[2] === "–" || parts[2] === "—")) {
    start = parts[1];
    end = parts[3] || "";
  } else {
    // fallback: todo lo posterior a la fecha
    start = parts.slice(1).join(" ").trim();
  }
  return { start, end, ddmmyyyy };
}

/** ================== Componente ================== */
export default function FormWaybillClient({ type = "get" }: ComponentProps) {
  const token = useSelector((state: any) => state.auth.token);
  const navigate = useNavigate();
  const { id } = useParams();

  const [typeForm, setTypeForm] = useState<"get" | "post" | "put">(type);
  const [title, setTitle] = useState("Crear guía");
  const [btn, setBtn] = useState("Crear");
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
    sender_city: "Montevideo",
    sender_neighborhood: "",
    sender_address: "",
    sender_apartment: "",
    sender_phone: "",
    recipient_city: "Montevideo",
    recipient_neighborhood: "",
    recipient_address: "",
    recipient_apartment: "", // inicializado
    recipient_phone: "",
    recipient_name: "",
    who_pays: "Remitente",
    notes: "",
    withdrawal_date: new Date(),
    delivery_date: new Date(),
    delivery_hour: "",
    package_detail: [
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
    status: "",
  });

  /** ============ Carga inicial ============ */
  useEffect(() => {
    (async () => {
      try {
        const companies = await Companies.search("", token);
        if (companies?.data?.length) setSelectCompany(companies.data[0]);

        if (type === "post") {
          setTypeForm("post");
          setBtn("Crear");
          setTitle("Crear guía");
        } else if (type === "put") {
          setTypeForm("put");
          setBtn("Modificar");
          setTitle("Modificar guía");
        } else {
          setTypeForm("get");
          setDisabled({ branch_id: true });
          setTitle("Información de guía");
        }

        if ((type === "put" || type === "get") && id) {
          const wb: any = await Waybills.getById(id, token);

          const parsedPickup = parsePickupDatetime(wb?.pickup_datetime || "");
          const wd =
            parseToDate(wb?.withdrawal_date) ||
            pickupDateFromString(wb?.pickup_datetime) ||
            parseToDate(parsedPickup.ddmmyyyy) ||
            new Date();
          const dd = parseToDate(wb?.delivery_date) || new Date();

          const companyResp = await Companies.getById(wb.company_id, token);
          const resolvedCompany: Company = {
            id: companyResp?.data?.id || "",
            name: companyResp?.data?.name || "",
            email: companyResp?.data?.email || "",
            phone: companyResp?.data?.phone || "",
            user_name: companyResp?.data?.user_name || "",
            branches: companyResp?.data?.branches || [],
          };

          // normalizar paquete similar al admin (soporta package_details / packages / items / package_detail single)
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
            company_name: wb?.company_name || "",
            user_name: resolvedCompany.user_name || "",
            branch_id: wb?.branch_id || "",
            date: wd,
            hour: parsedPickup.end ? `${parsedPickup.start} - ${parsedPickup.end}` : parsedPickup.start || "",
            price: Number(wb?.shipping_cost || 0),
            sender_city: wb?.sender?.address?.city || "",
            sender_neighborhood: wb?.sender?.address?.neighborhood || "",
            sender_address: wb?.sender?.address?.street || "",
            sender_apartment: wb?.sender?.address?.apartment || "",
            sender_phone: wb?.sender?.phone || "",
            recipient_city: wb?.receiver?.address?.city || "",
            recipient_neighborhood: wb?.receiver?.address?.neighborhood || "",
            recipient_address: wb?.receiver?.address?.street || "",
            recipient_apartment: wb?.receiver?.address?.apartment || "", // mapear desde backend si viene
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
          });
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [id, token, type]);

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
  const setSelectDeliveryHour = (value: string) =>
    setData((prev) => ({ ...prev, delivery_hour: value }));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;

    if (id === "branch_id") {
      const branch = selectCompany.branches.find((b) => b.id === value);
      if (branch) {
        setData((prev) => ({
          ...prev,
          branch_id: value,
          sender_city: branch.address.city,
          sender_neighborhood: branch.address.neighborhood,
          sender_address: branch.address.street,
          sender_apartment: branch.address.apartment || prev.sender_apartment || "",
          sender_phone: branch.phone || branch?.contact?.phone || selectCompany?.phone || "",
        }));
        return;
      }
    }

    setData((prev) => ({ ...prev, [id]: value } as any));
  };

  const handlePackageChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = [...data.package_detail];
    if (name === "length" || name === "width" || name === "height") {
      (updated[idx].dimensions as any)[name] = Number(value);
    } else {
      (updated[idx] as any)[name] =
        name === "quantity" || name === "weight" || name === "price" ? Number(value) : value;
    }
    setData((prev) => ({ ...prev, package_detail: updated }));
  };

  const addPackage = () => {
    setData((prev) => ({
      ...prev,
      package_detail: [
        ...prev.package_detail,
        {
          type: "",
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

    // PUT: YYYY-MM-DD (clave para que el backend derive WithdrawalDate).
    // POST: DD-MM-YYYY (como ya te funcionaba).
    const pickup_datetime =
      typeForm === "put"
        ? `${withdrawal_yyyymmdd}${(data.hour || "").trim() ? ` ${data.hour.trim()}` : ""}`.trim()
        : `${withdrawal_ddmmyyyy}${(data.hour || "").trim() ? ` ${data.hour.trim()}` : ""}`.trim();

    // Normalizar paquetes
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
      company_id: (selectCompany as any)?.id || (data as any).company_id,
      branch_id: (data as any).branch_id,
      company_name: (selectCompany as any)?.name || (data as any).company_name,
      pickup_datetime,
      who_pays: (data as any).who_pays,
      notes: (data as any).notes,
      receiver: {
        name: (data as any).recipient_name ?? (data as any).receiver?.name,
        address: {
          city: (data as any).recipient_city ?? (data as any).receiver?.address?.city,
          neighborhood:
            (data as any).recipient_neighborhood ?? (data as any).receiver?.address?.neighborhood,
          street: (data as any).recipient_address ?? (data as any).receiver?.address?.street,
          apartment: (data as any).recipient_apartment ?? (data as any).receiver?.address?.apartment ?? "",
        },
        phone: (data as any).recipient_phone ?? (data as any).receiver?.phone,
      },
      package_details: normalizedPackages,
      shipping_cost: (data as any).price ?? (data as any).shipping_cost ?? 0,
      status: typeForm === "post" ? "Procesando" : (data as any).status,
      delivery_hour: ((data as any).delivery_hour || "").trim(),
    };

    try {
      let result;

      if (typeForm === "put") {
        // PUT → fechas en ISO + pickup_datetime en YYYY-MM-DD
        const payloadPut = {
          ...base,
          withdrawal_date: toISOStart(pickup),
          delivery_date: toISOStart(deliver),
        };
        result = await Waybills.put(id as string, payloadPut, token);
      } else {
        // POST → DD-MM-YYYY
        const payloadPost = {
          ...base,
          withdrawal_date: withdrawal_ddmmyyyy,
          delivery_date: delivery_ddmmyyyy,
        };
        result = await Waybills.set(payloadPost, token);
      }

      if (result?.id) {
        Swal.fire({
          icon: "success",
          title: typeForm === "put" ? "Guía actualizada exitosamente" : "Guía creada exitosamente",
        }).then(() => navigate(-1));
      } else {
        Swal.fire({
          icon: "error",
          title: result?.error || "Error",
          text: result?.mensaje || "No se pudo guardar la guía.",
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.message || "Ocurrió un error al guardar la guía.",
      });
    } finally {
      setLoading(false);
    }
  };

  /** ============ Render ============ */
  return (
    <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-3xl font-bold tracking-tight text-gray-800">{title}</h5>
        <button
          type="button"
          title="Cerrar"
          onClick={() => navigate(-1)}
          className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-2"
        >
          <Icon path={mdiArrowLeft} size={1} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2">
          {/* Sucursal */}
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
              disabled={typeForm === "get" || disabled.branch_id}
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
            {typeForm === "get" ? (
              <p className="py-2 px-3 bg-gray-100 rounded">
                Fecha de retiro: {dayjs(data.withdrawal_date).format("DD/MM/YYYY")}
              </p>
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
              labelText="Horario de retiro (9hs - 18hs)"
              required={true}
              disabled={typeForm === "get"}
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
              className="mb-6 py-2 pl-3 pr-1 bg-gray-50 border border-gray-300 text-black text-sm rounded-lg block w-full cursor-not-allowed"
              disabled
            />
          </div>

          {/* Fecha entrega */}
          <div className="w-full md:w-1/4 px-2">
            {typeForm === "get" ? (
              <p className="py-2 px-3 bg-gray-100 rounded">
                Fecha de entrega: {dayjs(data.delivery_date).format("DD/MM/YYYY")}
              </p>
            ) : (
              <DateFilterDelivery
                value={
                  data.delivery_date instanceof Date && !isNaN(data.delivery_date.getTime())
                    ? data.delivery_date
                    : null
                }
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
              disabled={typeForm === "get"}
              labelText="Horario de entrega (9hs - 18hs)"
            />
          </div>

         
        </div>

        {/* Remitente */}
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
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled
            />
          </div>
          <div className="mb-3">
            <label
              htmlFor="sender_neighborhood"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Barrio
            </label>
            <input
              type="text"
              id="sender_neighborhood"
              value={data.sender_neighborhood}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled
            />
          </div>
          <div className="mb-3">
            <label
              htmlFor="sender_address"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Dirección
            </label>
            <input
              type="text"
              id="sender_address"
              value={data.sender_address}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled
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
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px]"
              disabled
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
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px]"
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
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px]"
              disabled
              readOnly
            />
          </div>
        </div>

        {/* Destinatario */}
        <h6 className="text-lg font-bold mb-4">Información del destinatario</h6>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <div className="mb-3">
            <label className="block mb-2 text-sm font-medium text-gray-700">Ciudad</label>
            <SelectCity
              id="recipient_city"
              name="recipient_city"
              token={token}
              value={data.recipient_city || ""}
              disabled={typeForm === "get"}
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
          <div className="mb-3">
            <label className="block mb-2 text-sm font-medium text-gray-700">Barrio</label>
            <SelectNeighborhood
              id="recipient_neighborhood"
              name="recipient_neighborhood"
              city={data.recipient_city || ""}
              value={data.recipient_neighborhood || ""}
              set={(v: string) => setData((prev) => ({ ...prev, recipient_neighborhood: v }))}
              disabled={typeForm === "get"}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label
              htmlFor="recipient_address"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Dirección
            </label>
            <input
              type="text"
              id="recipient_address"
              value={data.recipient_address}
              onChange={handleChange}
              placeholder="Dirección"
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={typeForm === "get"}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="recipient_apartment" className="block mb-2 text-sm font-medium text-gray-700">
              Apartamento
            </label>
            <input
              type="text"
              id="recipient_apartment"
              value={data.recipient_apartment || ""}
              onChange={handleChange}
              placeholder="Apartamento"
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px]"
              disabled={typeForm === "get"}
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
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={typeForm === "get"}
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
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={typeForm === "get"}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="who_pays" className="block mb-2 text-sm font-medium text-gray-700">
              Quién Paga
            </label>
            <select
              id="who_pays"
              value={data.who_pays}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={typeForm === "get"}
            >
              <option value="Remitente">Remitente</option>
              <option value="Destinatario">Destinatario</option>
            </select>
          </div>

          <div className="mb-3 sm:col-span-3">
            <label htmlFor="notes" className="block mb-2 text-sm font-medium text-gray-700">
              Notas
            </label>
            <textarea
              id="notes"
              value={data.notes}
              disabled={typeForm === "get"}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder=""
            ></textarea>
          </div>
        </div>

        {/* Paquetes */}
        <div className="mb-3">
          <h6 className="mb-2 text-lg font-medium text-gray-700 flex items-center justify-center space-x-2">
            <span>Detalle de paquete</span>
            {typeForm !== "get" && (
              <button
                type="button"
                onClick={addPackage}
                className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <Icon path={mdiPlusCircle} size={1} />
              </button>
            )}
          </h6>
          {data.package_detail.map((item, index) => (
            <div key={index} className="flex items-center mb-4">
              <div className="flex w-full flex-wrap">
                <div className="w-full md:w-2/5 mb-5 pr-2">
                  <label
                    htmlFor={`description_${index}`}
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Descripción
                  </label>
                  <input
                    type="text"
                    id={`description_${index}`}
                    name="description"
                    value={item.description}
                    onChange={(e) => handlePackageChange(index, e)}
                    className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2 pl-3 pr-1"
                    required
                    disabled={typeForm === "get"}
                  />
                </div>
                <div className="w-full md:w-3/5 flex flex-wrap">
                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label
                      htmlFor={`quantity_${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Cantidad
                    </label>
                    <input
                      type="number"
                      id={`quantity_${index}`}
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handlePackageChange(index, e)}
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                      disabled={typeForm === "get"}
                    />
                  </div>
                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label
                      htmlFor={`weight_${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      id={`weight_${index}`}
                      name="weight"
                      value={item.weight}
                      onChange={(e) => handlePackageChange(index, e)}
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                      disabled={typeForm === "get"}
                    />
                  </div>
                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label
                      htmlFor={`length_${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Largo (cm)
                    </label>
                    <input
                      type="number"
                      id={`length_${index}`}
                      name="length"
                      value={item.dimensions.length}
                      onChange={(e) => handlePackageChange(index, e)}
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                      disabled={typeForm === "get"}
                    />
                  </div>
                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label
                      htmlFor={`width_${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Ancho (cm)
                    </label>
                    <input
                      type="number"
                      id={`width_${index}`}
                      name="width"
                      value={item.dimensions.width}
                      onChange={(e) => handlePackageChange(index, e)}
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                      disabled={typeForm === "get"}
                    />
                  </div>
                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label
                      htmlFor={`height_${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Alto (cm)
                    </label>
                    <input
                      type="number"
                      id={`height_${index}`}
                      name="height"
                      value={item.dimensions.height}
                      onChange={(e) => handlePackageChange(index, e)}
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                      disabled={typeForm === "get"}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-end">
                {typeForm !== "get" && (
                  <button
                    type="button"
                    onClick={() => removePackage(index)}
                    className="p-3 bg-red-500 text-white rounded-full"
                  >
                    <Icon path={mdiDelete} size={1} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {typeForm !== "get" && (
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={loading}
          >
            {loading ? "Guardando..." : btn}
          </button>
        )}
      </form>
    </div>
  );
}

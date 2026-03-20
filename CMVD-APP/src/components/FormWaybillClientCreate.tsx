import React, { useState, useEffect } from "react";
import { Waybills } from "@/modules/waybills/infrastructure/waybillsService";
import { Calculate } from "@/modules/calculate/infrastructure/calculateService";
import { Companies } from "@/modules/companies/infrastructure/companiesService";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Icon } from "@mdi/react";
import { mdiPlusCircle, mdiDelete, mdiClose } from "@mdi/js";
import Swal from "sweetalert2";

import SelectNeighborhood from "./SelectNeighborhood";
import SelectHoursRange from "./SelectHoursRange";
import DateFilter from "./DateFilter";
import DateFilterDelivery from "./DateFilterDelivery";
import ButtonCreateBranch from "./ButtonCreateBranch";
import SelectCity from "./SelectCity";

export default function FormWaybill({ type = "get" }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const token = useSelector((state: any) => state.auth.token);
  const companyId = useSelector((state: any) => state.auth.companyId);

  const [loading, setLoading] = useState(false);
  const [modalBranch, setModalBranch] = useState(false);
  const [disabled, setDisabled] = useState<{ branch_id: boolean; hour?: boolean }>({
    branch_id: false,
    hour: false,
  });

  const [title, setTitle] = useState("Crear guía");
  const [btn, setBtn] = useState("Crear");

  const [selectCompany, setSelectCompany] = useState<any>({
    id: "",
    name: "",
    email: "",
    branches: [],
    user_name: "",
  });

  // Estado principal (datos generales de la guía)
  const [data, setData] = useState<any>({
    company_name: "",
    user_name: "",
    branch_id: "",
    date: "",
    hour: "",
    price: 0, // ← precio total (suma de recipients)
    sender_city: "Montevideo",
    sender_neighborhood: "",
    sender_address: "",
    withdrawal_date: "",
    delivery_date: "",
    delivery_hour: "",
    recipient_city: "", // usados sólo si hicieras un "modo simple"; en este form editamos recipients[]
    recipient_neighborhood: "",
  });

  // Recipients (destinatarios) — cada uno tiene su propio "price"
  const [recipient, setRecipient] = useState<any[]>([
    {
      recipient_city: "Montevideo",
      recipient_neighborhood: "",
      recipient_address: "",
      recipient_apartment: "",
      recipient_email: "",
      recipient_phone: "",
      recipient_name: "",
      who_pays: "Remitente",
      price: 0,
      notes: "",
      package_detail: [
        {
          type: "Box",
          package_number: "",
          description: "",
          weight: 0,
          quantity: 1,
          price: 0,
          dimensions: {
            length: 0,
            width: 0,
            height: 0,
          },
        },
      ],
    },
  ]);

  // ------------------------------
  // Helpers
  // ------------------------------
  const sumRecipientsPrice = (arr: any[]) =>
    arr.reduce((sum, r) => sum + (Number(r.price) || 0), 0);

  const normalizeDateDDMMYYYY = (d: string | Date) => {
    if (typeof d === "string" && d.includes("-") && d.length >= 8) {
      // asumes string "YYYY-MM-DD" o "DD-MM-YYYY"
      // queremos DD-MM-YYYY
      const parts = d.split("-");
      if (parts[0].length === 4) {
        // YYYY-MM-DD -> DD-MM-YYYY
        return [parts[2], parts[1], parts[0]].join("-");
      }
      // si ya viene DD-MM-YYYY lo devolvemos igual
      return d;
    }
    if (d instanceof Date && !isNaN(d.getTime())) {
      return [
        String(d.getDate()).padStart(2, "0"),
        String(d.getMonth() + 1).padStart(2, "0"),
        d.getFullYear(),
      ].join("-");
    }
    return "";
  };

  // Calcula precio contra API para un destinatario concreto
  const quoteRecipientPrice = async (r: any) => {
    const payload = {
      sender_city: data.sender_city,
      sender_neighborhood: data.sender_neighborhood,
      recipient_city: r.recipient_city,
      recipient_neighborhood: r.recipient_neighborhood,
      package_detail: r.package_detail, // tu API lo usa así según tu código
      company_id: companyId,
    };

    const res: any = await Calculate.set(payload, token);
    // aceptamos varias formas de respuesta
    const price =
      (res?.data?.price ?? res?.price ?? res?.total ?? 0) as number;
    return Number(price) || 0;
  };

  // Recalcula el precio de un destinatario y actualiza el total
  const recalcOneRecipient = async (index: number, r: any) => {
    try {
      const newPrice = await quoteRecipientPrice(r);
      setRecipient((prev) => {
        const clone = prev.map((x, i) => (i === index ? { ...x, price: newPrice } : x));
        const total = sumRecipientsPrice(clone);
        setData((pd: any) => ({ ...pd, price: total }));
        return clone;
      });
    } catch (e) {
      console.error("Error calculando precio del destinatario:", e);
      setRecipient((prev) => {
        const clone = prev.map((x, i) => (i === index ? { ...x, price: 0 } : x));
        const total = sumRecipientsPrice(clone);
        setData((pd: any) => ({ ...pd, price: total }));
        return clone;
      });
    }
  };

  // ------------------------------
  // Carga inicial (crear/editar/ver)
  // ------------------------------
  const index = async () => {
    try {
      if (type === "post") {
        setBtn("Crear");
        setTitle("Crear guía");

        if (companyId) {
          const company = await Companies.getById(companyId, token);
          setSelectCompany(company.data);
        } else {
          const list = await Companies.search("", token);
          const first = list.data?.[0];
          if (first?.id) {
            const detail = await Companies.getById(first.id, token);
            setSelectCompany(detail.data);
          } else {
            setSelectCompany({ id: "", name: "", email: "", branches: [], user_name: "" });
          }
        }
      }

      if (type === "put") {
        setBtn("Modificar");
        setTitle("Modificar guía");
      }

      if (type === "get") {
        setDisabled({ branch_id: true, hour: disabled.hour });
        setTitle("Información de guía");
      }

      if (type === "put" || type === "get") {
        const dataWb = await Waybills.getById(id, token);
        const company = await Companies.getById(dataWb.company_id, token);

        // pickup_datetime -> "DD-MM-YYYY HH:MM - HH:MM"
        let pickupDatetime = String(dataWb.pickup_datetime || "").split(" ");
        let hourLabel = "";
        if (pickupDatetime.length > 3) {
          hourLabel = pickupDatetime[1] + " - " + pickupDatetime[3];
        }

        const loaded = {
          company_name: dataWb.company_name,
          user_name: company.data.user_name,
          branch_id: dataWb.branch_id,
          date: pickupDatetime[0],
          hour: hourLabel,
          price: dataWb.shipping_cost || 0,
          sender_city: dataWb.sender.address.city,
          sender_neighborhood: dataWb.sender.address.neighborhood,
          sender_address: dataWb.sender.address.street,
          withdrawal_date: dataWb.withdrawal_date || "",
          delivery_date: dataWb.delivery_date || "",
          delivery_hour: dataWb.delivery_hour || "",
        };

        setSelectCompany(company.data);
        setData(loaded);

        // si tu API trae un único destinatario en la guía, podés mapearlo aquí.
        // en caso de múltiples destinatarios, deberías convertirlos en el array `recipient`.
        // Asumo uno (ajustá si tu API trae múltiples).
        const rcv = {
          recipient_city: dataWb.receiver.address.city,
          recipient_neighborhood: dataWb.receiver.address.neighborhood,
          recipient_address: (dataWb.receiver.address.street || "").split(",")[0] || "",
          recipient_apartment: (dataWb.receiver.address.street || "").split(",")[1] || "",
          recipient_email: dataWb.receiver.email || "",
          recipient_phone: dataWb.receiver.phone || "",
          recipient_name: dataWb.receiver.name || "",
          who_pays: dataWb.who_pays || "Remitente",
          price: dataWb.shipping_cost || 0,
          notes: dataWb.notes || "",
          package_detail: Array.isArray(dataWb.package_details) ? dataWb.package_details : [],
        };
        setRecipient([rcv]);
      }
    } catch (e) {
      console.error("Error cargando datos iniciales:", e);
    }
  };

  useEffect(() => {
    index();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------
  // Handlers generales
  // ------------------------------
  const handleChange = (e: any) => {
    const { id, value } = e.target;

    // Al cambiar la sucursal, copiamos ciudad/barrio/dirección del remitente
    if (id === "branch_id") {
      const filtered = selectCompany.branches?.find(
        (b: any) => String(b.id) === String(value)
      );
      if (filtered) {
        setData((prev: any) => ({
          ...prev,
          branch_id: String(filtered.id),
          sender_city: filtered.address.city,
          sender_neighborhood: filtered.address.neighborhood,
          sender_address: filtered.address.street,
        }));
        return;
      }
    }

    setData((prev: any) => ({ ...prev, [id]: value }));
  };

  const setSelectHours = (value: string) => {
    setData((prev: any) => ({ ...prev, hour: value }));
  };
  const setSelectDeliveryHour = (value: string) => {
    setData((prev: any) => ({ ...prev, delivery_hour: value }));
  };
  const setSelectDate = (value: any) => {
    setData((prev: any) => ({
      ...prev,
      withdrawal_date: value,
      date: value,
    }));
  };
  const setSelectDateDelivery = (value: any) => {
    setData((prev: any) => ({ ...prev, delivery_date: value }));
  };

  // ------------------------------
  // Handlers de destinatarios
  // ------------------------------
  const handleRecipientChange = async (index: number, field: string, value: any) => {
    setRecipient((prev) => {
      let next = prev.map((r, i) => (i === index ? { ...r, [field]: value } : r));

      // Si cambia la ciudad, vaciamos barrio y precio de ese destinatario
      if (field === "recipient_city") {
        next = next.map((r, i) =>
          i === index ? { ...r, recipient_neighborhood: "", price: 0 } : r
        );
      }

      // Actualizamos total al vuelo (sin esperar cálculo)
      const total = sumRecipientsPrice(next);
      setData((pd: any) => ({ ...pd, price: total }));

      return next;
    });

    // Si cambió el barrio y hay ciudad, calculamos precio del destinatario
    if (field === "recipient_neighborhood") {
      const rNow = (prev => prev)[0]; // placeholder para TS
      const current = ((): any => {
        // leemos el destinatario actualizado directamente de la función de arriba sería ideal,
        // pero como setState es async, tomamos el valor más reciente del estado tras un pequeño truco:
        // mejor: reconstruimos el objeto "r" con el valor ya aplicado
        const base = recipient[index] || {};
        return { ...base, [field]: value };
      })();

      if (current.recipient_city && current.recipient_neighborhood) {
        await recalcOneRecipient(index, current);
      }
    }
  };

  const handlePackageDetailChange = (
    recipientIndex: number,
    packageIndex: number,
    field: string,
    value: any
  ) => {
    setRecipient((prev) => {
      const updated = prev.map((r, i) => {
        if (i !== recipientIndex) return r;
        const newPackages = r.package_detail.map((pkg: any, j: number) => {
          if (j !== packageIndex) return pkg;
          if (field === "length" || field === "width" || field === "height") {
            return {
              ...pkg,
              dimensions: {
                ...pkg.dimensions,
                [field]: parseFloat(value),
              },
            };
          }
          if (field === "weight" || field === "quantity") {
            return { ...pkg, [field]: parseFloat(value) };
          }
          return { ...pkg, [field]: value };
        });
        return { ...r, package_detail: newPackages };
      });

      // Recalcular precio del destinatario al tocar paquete
      const rNow = updated[recipientIndex];
      if (rNow.recipient_city && rNow.recipient_neighborhood) {
        // lanzamos cálculo asincrónico
        recalcOneRecipient(recipientIndex, rNow);
      }

      const total = sumRecipientsPrice(updated);
      setData((pd: any) => ({ ...pd, price: total }));

      return updated;
    });
  };

  const addRecipient = () => {
    setRecipient((prev) => [
      ...prev,
      {
        recipient_city: "Montevideo",
        recipient_neighborhood: "",
        recipient_address: "",
        recipient_apartment: "",
        recipient_email: "",
        recipient_phone: "",
        recipient_name: "",
        who_pays: "Remitente",
        price: 0,
        notes: "",
        package_detail: [
          {
            type: "Box",
            package_number: "",
            description: "",
            weight: 0,
            quantity: 1,
            price: 0,
            dimensions: {
              length: 0,
              width: 0,
              height: 0,
            },
          },
        ],
      },
    ]);
  };

  const removeRecipient = (index: number) => {
    setRecipient((prev) => {
      if (prev.length <= 1) return prev; // al menos uno
      const next = prev.filter((_, i) => i !== index);
      const total = sumRecipientsPrice(next);
      setData((pd: any) => ({ ...pd, price: total }));
      return next;
    });
  };

  // ------------------------------
  // Submit
  // ------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones de horas (solo si mismas fechas)
    const retiroDateRaw = data.date;
    const entregaDateRaw = data.delivery_date;
    const retiroDate =
      retiroDateRaw instanceof Date ? retiroDateRaw : new Date(retiroDateRaw);
    const entregaDate =
      entregaDateRaw instanceof Date ? entregaDateRaw : new Date(entregaDateRaw);

    if (retiroDate.toDateString() === entregaDate.toDateString()) {
      const [horaRetiro] = String(data.hour || "").split(" - ");
      const [horaEntrega] = String(data.delivery_hour || "").split(" - ");
      if (horaRetiro && horaEntrega) {
        const dtRetiro = new Date(retiroDate);
        const [h1, m1] = horaRetiro.split(":").map(Number);
        dtRetiro.setHours(h1 || 0, m1 || 0, 0, 0);
        const dtEntrega = new Date(entregaDate);
        const [h2, m2] = horaEntrega.split(":").map(Number);
        dtEntrega.setHours(h2 || 0, m2 || 0, 0, 0);
        if (dtEntrega.getTime() - dtRetiro.getTime() < 60 * 60 * 1000) {
          Swal.fire({
            icon: "error",
            title: "Horario inválido",
            text:
              "Para el mismo día debe haber al menos 1 hora de diferencia entre el inicio de retiro y de entrega.",
          });
          return;
        }
      }
    }

    if (new Date(data.delivery_date) < new Date(data.date)) {
      Swal.fire({
        icon: "error",
        title: "Fecha inválida",
        text: "La fecha de entrega debe ser mayor a la fecha de recogida.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    setLoading(true);
    Swal.fire({
      title: "",
      text: "Cargando...",
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // Estandarizamos fecha para pickup_datetime (DD-MM-YYYY)
      const dateFin = normalizeDateDDMMYYYY(data.date);
      const hourLabel = data.hour === "Sin horario" ? "" : String(data.hour || "");

      const recipientCopy = recipient.map((r) => ({
        ...r,
        package_detail: r.package_detail.map((pkg: any) => ({
          ...pkg,
          dimensions: { ...pkg.dimensions },
        })),
      }));

      let allSucceeded = true;

      for (let i = 0; i < recipientCopy.length; i++) {
        const r = recipientCopy[i];
        const dataW = {
          company_id: selectCompany.id,
          branch_id: data.branch_id,
          company_name: selectCompany.name,
          pickup_datetime: `${dateFin} ${hourLabel}`.trim(),
          who_pays: r.who_pays,
          notes: r.notes,
          receiver: {
            name: r.recipient_name,
            address: {
              city: r.recipient_city,
              neighborhood: r.recipient_neighborhood,
              street: `${r.recipient_address}${r.recipient_apartment ? "," + r.recipient_apartment : ""}`,
            },
            email: r.recipient_email,
            phone: r.recipient_phone,
          },
          package_details: r.package_detail,
          shipping_cost: r.price,
          status: "Procesando",
          withdrawal_date: data.withdrawal_date,
          delivery_date: data.delivery_date,
          delivery_hour: data.delivery_hour,
        };

        const message = await Waybills.set(dataW, token);

        if (!("id" in message)) {
          allSucceeded = false;
          console.error("Error en respuesta API:", message);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: message.mensaje || "Error al procesar el registro.",
          });
          break;
        } else {
          setRecipient((prev) => prev.filter((_, idx) => idx !== i));
        }
      }

      if (allSucceeded) {
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Todos los registros se crearon exitosamente",
        }).then(() => {
          navigate("/waybills");
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error durante el envío. Por favor, intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">{title}</h5>

      <ButtonCreateBranch visible={modalBranch} setVisible={setModalBranch} set={async () => {
        const company = await Companies.getById(selectCompany.id, token);
        setSelectCompany(company.data);
        setModalBranch(false);
      }} />

      <form className="w-full" onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/4 px-2 ">
            <label htmlFor="branch_id" className="block mb-2 text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                Dirección retiro
                <button
                  type="button"
                  onClick={() => setModalBranch(true)}
                  className="rounded-full"
                >
                  <Icon path={mdiPlusCircle} size={1} color="green" />
                </button>
              </div>
            </label>

            <select
              id="branch_id"
              value={data.branch_id}
              onChange={handleChange}
              className="disabled block w-full py-2 pl-3 pr-1 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={disabled.branch_id}
            >
              <option value="">Selecciona una Dirección</option>
              {selectCompany.branches?.map((branche: any) => (
                <option key={branche.id} value={String(branche.id)}>
                  {branche.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/4 px-2 ">
            <DateFilter value={data.date} set={setSelectDate} label="Fecha de retiro" minDate={new Date()} />
          </div>

          <div className="w-full md:w-1/3 px-2 ">
            <SelectHoursRange
              value={data.hour}
              set={setSelectHours}
              disabled={disabled.hour}
              labelText="Hora de retiro (8hs - 16hs)"
              startDate={data.date}
              endDate={data.delivery_date}
            />
          </div>

          <div className="w-full md:w-1/4 px-2 ">
            <label htmlFor="price" className="block mb-2 text-sm font-medium text-gray-700">
              Precio de envío
            </label>
            <input
              type="text"
              id="price"
              value={data.price ?? 0}
              onChange={handleChange}
              placeholder="Precio"
              className="mb-6 py-2 pl-3 pr-1 bg-gray-50 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full cursor-not-allowed dark:bg-gray-200 dark:border-gray-400 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              disabled
              readOnly
            />
          </div>

          <div className="w-full md:w-1/4 px-2 ">
            <DateFilterDelivery value={data.delivery_date} set={setSelectDateDelivery} label="Fecha de entrega" minDate={data.date} />
          </div>

          <div className="w-full md:w-1/3 px-2 ">
            <SelectHoursRange
              value={data.delivery_hour}
              set={setSelectDeliveryHour}
              required={true}
              disabled={type === "get"}
              labelText="Horario de entrega (9hs - 18hs)"
              startDate={data.date}
              endDate={data.delivery_date}
            />
          </div>

          <div className="w-full md:w-1/4 px-2 ">
            <label htmlFor="company_email" className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="text"
              id="company_email"
              value={selectCompany.email}
              placeholder="Email"
              className="mb-6 py-2 pl-3 pr-1 bg-gray-50 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full cursor-not-allowed dark:bg-gray-200 dark:border-gray-400 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              disabled
              readOnly
            />
          </div>
        </div>

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
              placeholder="Ciudad"
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              placeholder="Barrio"
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              onChange={handleChange}
              placeholder="Dirección"
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled
            />
          </div>
        </div>

        <h6 className="text-lg font-bold mb-4">Información del destinatario</h6>

        {recipient.map((dataR, index) => (
          <div className="relative rounded-[10px] p-4 border border-gray-300 mb-5" key={index}>
            {type !== "get" && (
              <button
                type="button"
                onClick={() => removeRecipient(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full"
              >
                <Icon path={mdiClose} size={1} />
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              <div className="mb-3">
                <label className="block mb-2 text-sm font-medium text-gray-700">Ciudad</label>
                <SelectCity
                  id={`recipient_city_${index}`}
                  name="recipient_city"
                  token={token}
                  value={dataR.recipient_city || ""}
                  disabled={type === "get"}
                  set={(v: string) => handleRecipientChange(index, "recipient_city", v)}
                />
              </div>

              <div className="mb-3">
                <label className="block mb-2 text-sm font-medium text-gray-700">Barrio</label>
                <SelectNeighborhood
                  id={`recipient_neighborhood_${index}`}
                  name="recipient_neighborhood"
                  city={dataR.recipient_city || ""}
                  value={dataR.recipient_neighborhood || ""}
                  set={(v: string) => handleRecipientChange(index, "recipient_neighborhood", v)}
                  disabled={type === "get"}
                />
              </div>

              <div className="mb-3">
                <label className="block mb-2 text-sm font-medium text-gray-700">Dirección</label>
                <input
                  type="text"
                  id={`recipient_address_${index}`}
                  value={dataR.recipient_address}
                  onChange={(e) => handleRecipientChange(index, "recipient_address", e.target.value)}
                  className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                  disabled={type === "get"}
                />
              </div>

              <div className="mb-3">
                <label className="block mb-2 text-sm font-medium text-gray-700">Apartamento</label>
                <input
                  type="text"
                  id={`recipient_apartment_${index}`}
                  value={dataR.recipient_apartment}
                  onChange={(e) => handleRecipientChange(index, "recipient_apartment", e.target.value)}
                  className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                  disabled={type === "get"}
                />
              </div>

              <div className="mb-3">
                <label className="block mb-2 text-sm font-medium text-gray-700">Nombre Destinatario</label>
                <input
                  type="text"
                  id={`recipient_name_${index}`}
                  value={dataR.recipient_name}
                  onChange={(e) => handleRecipientChange(index, "recipient_name", e.target.value)}
                  className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  disabled={type === "get"}
                />
              </div>

              <div className="mb-3">
                <label className="block mb-2 text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="text"
                  id={`recipient_phone_${index}`}
                  value={dataR.recipient_phone}
                  onChange={(e) => handleRecipientChange(index, "recipient_phone", e.target.value)}
                  className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                  disabled={type === "get"}
                />
              </div>

              <div className="mb-3">
                <label className="block mb-2 text-sm font-medium text-gray-700">Quien Paga</label>
                <select
                  id={`who_pays_${index}`}
                  value={dataR.who_pays}
                  onChange={(e) => handleRecipientChange(index, "who_pays", e.target.value)}
                  className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                  disabled={type === "get"}
                >
                  <option value="Remitente">Remitente</option>
                  <option value="Destinatario">Destinatario</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block mb-2 text-sm font-medium text-gray-700">Precio</label>
                <input
                  type="text"
                  value={dataR.price ?? 0}
                  className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                  disabled
                  readOnly
                />
              </div>

              <div className="mb-3 sm:col-span-3">
                <label className="block mb-2 text-sm font-medium text-gray-700">Notas</label>
                <textarea
                  id={`notes_${index}`}
                  value={dataR.notes}
                  onChange={(e) => handleRecipientChange(index, "notes", e.target.value)}
                  className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder=""
                />
              </div>
            </div>

            <div className="mb-3">
              <h6 className="mb-2 text-lg font-medium text-gray-700 flex items-center justify-center space-x-2">
                <span>Detalle de paquete</span>
                {type !== "get" && (
                  <button
                    type="button"
                    onClick={() => {
                      const newPkg = {
                        type: "Box",
                        package_number: "",
                        description: "",
                        weight: 0,
                        quantity: 1,
                        price: 0,
                        dimensions: { length: 0, width: 0, height: 0 },
                      };
                      setRecipient((prev) => {
                        const next = prev.map((r, i) =>
                          i === index ? { ...r, package_detail: [...r.package_detail, newPkg] } : r
                        );
                        return next;
                      });
                    }}
                    className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                  >
                    <Icon path={mdiPlusCircle} size={1} color="green" />
                  </button>
                )}
              </h6>

              {dataR.package_detail.map((pkg: any, pkgIndex: number) => (
                <div key={pkgIndex} className="flex items-center mb-4">
                  <div className="flex w-full flex-wrap">
                    <div className="w-full md:w-2/5 mb-5 pr-2">
                      <label className="block mb-2 text-sm font-medium text-gray-700">Descripción</label>
                      <input
                        type="text"
                        value={pkg.description}
                        onChange={(e) => handlePackageDetailChange(index, pkgIndex, "description", e.target.value)}
                        className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2 pl-3 pr-1"
                        required
                        disabled={type === "get"}
                      />
                    </div>

                    <div className="w-full md:w-3/5 flex flex-wrap">
                      <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                        <label className="block mb-2 text-sm font-medium text-gray-700">Cantidad</label>
                        <input
                          type="number"
                          value={pkg.quantity}
                          onChange={(e) => handlePackageDetailChange(index, pkgIndex, "quantity", e.target.value)}
                          className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                          required
                          disabled={type === "get"}
                        />
                      </div>

                      <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                        <label className="block mb-2 text-sm font-medium text-gray-700">Peso (kg)</label>
                        <input
                          type="number"
                          value={pkg.weight}
                          onChange={(e) => handlePackageDetailChange(index, pkgIndex, "weight", e.target.value)}
                          className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                          required
                          disabled={type === "get"}
                        />
                      </div>

                      <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                        <label className="block mb-2 text-sm font-medium text-gray-700">Largo (cm)</label>
                        <input
                          type="number"
                          value={pkg.dimensions.length}
                          onChange={(e) => handlePackageDetailChange(index, pkgIndex, "length", e.target.value)}
                          className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                          required
                          disabled={type === "get"}
                        />
                      </div>

                      <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                        <label className="block mb-2 text-sm font-medium text-gray-700">Ancho (cm)</label>
                        <input
                          type="number"
                          value={pkg.dimensions.width}
                          onChange={(e) => handlePackageDetailChange(index, pkgIndex, "width", e.target.value)}
                          className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                          required
                          disabled={type === "get"}
                        />
                      </div>

                      <div className="mb-5 w-full sm:w-1/2 md:w-1/5">
                        <label className="block mb-2 text-sm font-medium text-gray-700">Alto (cm)</label>
                        <input
                          type="number"
                          value={pkg.dimensions.height}
                          onChange={(e) => handlePackageDetailChange(index, pkgIndex, "height", e.target.value)}
                          className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                          required
                          disabled={type === "get"}
                        />
                      </div>
                    </div>
                  </div>

                  {type !== "get" && (
                    <button
                      type="button"
                      onClick={() => {
                        setRecipient((prev) => {
                          const next = prev.map((r, i) => {
                            if (i !== index) return r;
                            if (r.package_detail.length <= 1) return r;
                            return {
                              ...r,
                              package_detail: r.package_detail.filter((_: any, j: number) => j !== pkgIndex),
                            };
                          });
                          const total = sumRecipientsPrice(next);
                          setData((pd: any) => ({ ...pd, price: total }));
                          return next;
                        });
                      }}
                      className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      <Icon path={mdiDelete} size={1} color="red" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {type !== "get" && (
          <button
            type="button"
            onClick={addRecipient}
            className="mt-4 mb-4 p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300 flex items-center gap-2 mx-auto"
          >
            Agregar destinatario
            <Icon path={mdiPlusCircle} size={1} color="green" />
          </button>
        )}

        {type !== "get" && (
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

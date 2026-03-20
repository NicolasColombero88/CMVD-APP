import React, { useState } from "react";
import { Calculate } from "@/modules/calculate/infrastructure/calculateService";
import { Icon } from "@mdi/react";
import { mdiPlusCircle, mdiDelete } from "@mdi/js";
import Swal from "sweetalert2";

// Componentes ya existentes en tu app
import SelectCity from "./SelectCity";
import SelectNeighborhood from "./SelectNeighborhood";

export default function FormWaybill() {
  // Si tu endpoint de cálculo no requiere auth, puede quedar vacío
  const token = "";

  // Estado único, pero con claves separadas para remitente y destinatario
  const [data, setData] = useState({
    // REMITENTE
    sender_city: "Montevideo",
    sender_neighborhood: "",

    // DESTINATARIO
    recipient_city: "Montevideo",
    recipient_neighborhood: "",
    recipient_address: "",
    recipient_email: "",
    recipient_phone: "",

    // PAQUETES
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
  });

  const [loading, setLoading] = useState(false);

  /* ------------------------
     Helpers para actualizar
     ------------------------ */
  const setSenderField = (field: "city" | "neighborhood", value: string) => {
    if (field === "city") {
      setData((prev) => ({
        ...prev,
        sender_city: value,
        sender_neighborhood: "", // al cambiar de ciudad, limpiar barrio
      }));
    } else {
      setData((prev) => ({ ...prev, sender_neighborhood: value }));
    }
  };

  const setRecipientField = (field: "city" | "neighborhood" | "address" | "email" | "phone", value: string) => {
    if (field === "city") {
      setData((prev) => ({
        ...prev,
        recipient_city: value,
        recipient_neighborhood: "", // al cambiar de ciudad, limpiar barrio
      }));
    } else if (field === "neighborhood") {
      setData((prev) => ({ ...prev, recipient_neighborhood: value }));
    } else if (field === "address") {
      setData((prev) => ({ ...prev, recipient_address: value }));
    } else if (field === "email") {
      setData((prev) => ({ ...prev, recipient_email: value }));
    } else if (field === "phone") {
      setData((prev) => ({ ...prev, recipient_phone: value }));
    }
  };

  const handlePackageChange = (index: number, field: string, value: any) => {
    setData((prev) => {
      const clone = [...prev.package_detail];
      if (field === "length" || field === "width" || field === "height") {
        clone[index] = {
          ...clone[index],
          dimensions: { ...clone[index].dimensions, [field]: Number(value) },
        };
      } else if (field === "weight" || field === "quantity") {
        clone[index] = { ...clone[index], [field]: Number(value) };
      } else {
        clone[index] = { ...clone[index], [field]: value };
      }
      return { ...prev, package_detail: clone };
    });
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

  const removePackage = (index: number) => {
    setData((prev) => {
      if (prev.package_detail.length <= 1) return prev;
      return {
        ...prev,
        package_detail: prev.package_detail.filter((_, i) => i !== index),
      };
    });
  };

  /* --------------
     Enviar cálculo
     -------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Payload EXACTO para el servicio de cálculo
    const payload = {
      sender_city: data.sender_city,
      sender_neighborhood: data.sender_neighborhood,
      recipient_city: data.recipient_city,
      recipient_neighborhood: data.recipient_neighborhood,
      package_detail: data.package_detail,
    };

    try {
      // Logs útiles (quitarlos si no los querés en producción)
      console.log("[COTIZAR] Payload =>", payload);

      const res: any = await Calculate.set(payload, token);

      console.log("[COTIZAR] Respuesta =>", res);

      const price =
        (res?.data?.price ?? res?.price ?? res?.total ?? 0) as number;

      const zone =
        (res?.data?.shipping_zone ??
          res?.shipping_zone ??
          res?.zone ??
          "—") as string;

      Swal.fire({
        title: "Cotización",
        html: `<p><b>Precio:</b> ${price}</p><p><b>Zona:</b> ${zone}</p>`,
        icon: "info",
      });
    } catch (err) {
      console.error("Error cotizando:", err);
      Swal.fire("Error", "No se pudo obtener la cotización.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* -----------
     Render
     ----------- */
  return (
    <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">
        Cotizar un Envío
      </h5>

      <form className="w-full" onSubmit={handleSubmit}>
        {/* REMITENTE */}
        <h6 className="text-lg font-bold mb-4">Información del remitente</h6>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Ciudad
            </label>
            <SelectCity
              id="sender_city"
              name="sender_city"
              token={token}
              value={data.sender_city}
              disabled={false}
              set={(v: string) => setSenderField("city", v)}
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Barrio
            </label>
            <SelectNeighborhood
              id="sender_neighborhood"
              name="sender_neighborhood"
              city={data.sender_city}
              value={data.sender_neighborhood}
              set={(v: string) => setSenderField("neighborhood", v)}
              disabled={false}
            />
          </div>
        </div>

        {/* DESTINATARIO */}
        <h6 className="text-lg font-bold mb-4">Información del destinatario</h6>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Ciudad
            </label>
            <SelectCity
              id="recipient_city"
              name="recipient_city"
              token={token}
              value={data.recipient_city}
              disabled={false}
              set={(v: string) => setRecipientField("city", v)}
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Barrio
            </label>
            <SelectNeighborhood
              id="recipient_neighborhood"
              name="recipient_neighborhood"
              city={data.recipient_city}
              value={data.recipient_neighborhood}
              set={(v: string) => setRecipientField("neighborhood", v)}
              disabled={false}
            />
          </div>
        </div>

        {/* PAQUETES */}
        <div className="mb-5">
          <h6 className="mb-2 text-lg font-medium text-gray-700 flex items-center justify-center space-x-2">
            <span>Detalle de paquete</span>
            <button
              type="button"
              onClick={addPackage}
              className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <Icon path={mdiPlusCircle} size={1} color="green" />
            </button>
          </h6>

          {data.package_detail.map((item, index) => (
            <div key={index} className="flex items-center mb-4">
              <div className="flex w-full flex-wrap">
                <div className="w-full md:w-2/5 mb-5 pr-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      handlePackageChange(index, "description", e.target.value)
                    }
                    className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2 pl-3 pr-1"
                    required
                  />
                </div>

                <div className="w-full md:w-3/5 flex flex-wrap">
                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handlePackageChange(index, "quantity", e.target.value)
                      }
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                    />
                  </div>

                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      value={item.weight}
                      onChange={(e) =>
                        handlePackageChange(index, "weight", e.target.value)
                      }
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                    />
                  </div>

                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Largo (cm)
                    </label>
                    <input
                      type="number"
                      value={item.dimensions.length}
                      onChange={(e) =>
                        handlePackageChange(index, "length", e.target.value)
                      }
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                    />
                  </div>

                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Ancho (cm)
                    </label>
                    <input
                      type="number"
                      value={item.dimensions.width}
                      onChange={(e) =>
                        handlePackageChange(index, "width", e.target.value)
                      }
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                    />
                  </div>

                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Alto (cm)
                    </label>
                    <input
                      type="number"
                      value={item.dimensions.height}
                      onChange={(e) =>
                        handlePackageChange(index, "height", e.target.value)
                      }
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => removePackage(index)}
                  className="p-3 bg-red-500 text-white rounded-full"
                  disabled={data.package_detail.length <= 1}
                  title={
                    data.package_detail.length <= 1
                      ? "Debe haber al menos un paquete"
                      : "Eliminar paquete"
                  }
                >
                  <Icon path={mdiDelete} size={1} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          disabled={loading}
        >
          {loading ? "Calculando..." : "Cotizar"}
        </button>
      </form>
    </div>
  );
}

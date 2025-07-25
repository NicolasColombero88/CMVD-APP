import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { Waybills } from "@/modules/waybills/infrastructure/waybillsService";
import { Calculate } from "@/modules/calculate/infrastructure/calculateService";
import { Companies } from "@/modules/companies/infrastructure/companiesService";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Icon } from "@mdi/react";
import { mdiPlusCircle, mdiDelete } from "@mdi/js";
import Swal from "sweetalert2";
import ModalSelect from './ModalSelect';
import SelectNeighborhood from './SelectNeighborhood';
import SelectHoursRange from './SelectHoursRange';
import DateFilterDelivery from './DateFilterDelivery';
import DateFilter from './DateFilter';
import { mdiArrowLeft } from '@mdi/js';

export default function FormWaybill({ type = "get" }) {
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState({ branch_id: false });
  const [selectCompany, setSelectCompany] = useState({ id: "", name: "", email: "", branches: [] });
  const token = useSelector((state: any) => state.auth.token);
  const companyId = useSelector((state: any) => state.auth.companyId);
  const { id } = useParams();
  const [title, setTitle] = useState("Crear guía");
  const [btn, setBtn] = useState("Crear");
  const navigate = useNavigate();
  const [typeForm, setTypeForm] = useState(type);
  const [data, setData] = useState<any>({
    company_name: "",
    user_name: "",
    branch_id: "",
    date: new Date(),
    hour: "",
    price: 0,
    sender_city: "Montevideo",
    sender_neighborhood: "",
    sender_address: "",
    recipient_city: "Montevideo",
    recipient_neighborhood: "",
    recipient_address: "",
    recipient_email: "",
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
  });

  // Carga inicial y parseo de fechas
  const index = async () => {
    const companies = await Companies.search("", token);
    setSelectCompany(companies.data[0]);

    // Ajuste de título y botón según tipo
    if (type === "post") { setBtn("Crear"); setTitle("Crear guía"); }
    if (type === "put") { setBtn("Modificar"); setTitle("Modificar guía"); }
    if (type === "get") { setDisabled({ branch_id: true }); setTitle("Información de guía"); }

    if (type === "put" || type === "get") {
      const dataWb = await Waybills.getById(id!, token);
      
      const pickupParts = dataWb.pickup_datetime
  ? dataWb.pickup_datetime.split(" ")
  : [];
const pickupDate = pickupParts[0] && !isNaN(new Date(pickupParts[0]).getTime())
  ? new Date(pickupParts[0])
  : null;

// Esta es la fecha con la que realmente se creó la guía
const withdrawal = dataWb.withdrawal_date && !isNaN(new Date(dataWb.withdrawal_date).getTime())
  ? new Date(dataWb.withdrawal_date)
  : null;
const delivery = dataWb.delivery_date && !isNaN(new Date(dataWb.delivery_date).getTime())
  ? new Date(dataWb.delivery_date)
  : null;
  const pickupEnd = pickupParts.length > 1 ? pickupParts.slice(-1)[0] : "";


      const companyResp = await Companies.getById(dataWb.company_id, token);
      const formData = {
        company_name: dataWb.company_name,
        user_name: companyResp.data.user_name,
        branch_id: dataWb.branch_id,
        date: withdrawal || pickupDate,
       hour: pickupEnd ? `${pickupParts[1]} - ${pickupEnd}` : dataWb.delivery_hour || "",
        price: dataWb.shipping_cost,
        sender_city: dataWb.sender.address.city,
        sender_neighborhood: dataWb.sender.address.neighborhood,
        sender_address: dataWb.sender.address.street,
        recipient_city: dataWb.receiver.address.city,
        recipient_neighborhood: dataWb.receiver.address.neighborhood,
        recipient_address: dataWb.receiver.address.street,
        recipient_email: dataWb.receiver.email,
        recipient_phone: dataWb.receiver.phone,
        recipient_name: dataWb.receiver.name,
        package_detail: dataWb.package_details,
        status: dataWb.status,
        who_pays: dataWb.who_pays,
        notes: dataWb.notes,
        withdrawal_date: withdrawal,
        delivery_date: delivery,
        delivery_hour: dataWb.delivery_hour,
      };
      setSelectCompany(companyResp.data);
      setData(formData);
    }
  };

  useEffect(() => { index(); }, []);

  // Manejadores de selección de fechas y horas
  const setSelectDate = (value: Date | null) => {
    setData(prev => ({ ...prev, withdrawal_date: value || prev.withdrawal_date, date: value || prev.date }));
  };
  const setSelectDateDelivery = (value: Date | null) => {
    setData(prev => ({ ...prev, delivery_date: value || prev.delivery_date }));
  };
  // Manejador de hora de retiro
  const setSelectHours = (value: string) => {
    setData(prev => ({ ...prev, hour: value }));
  };
  // Manejador de hora de entrega
  const setSelectDeliveryHour = (value: string) => {
    setData(prev => ({ ...prev, delivery_hour: value }));
  };
  // Manejador de barrio del destinatario
  const setSelectNeighborhoodTemp = (value: string) => {
    setData(prev => ({ ...prev, recipient_neighborhood: value }));
  };

  // Otros manejadores (cambios de input, paquete, etc.)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id === "branch_id") {
      const branch = selectCompany.branches.find((b: any) => b.id === value);
      if (branch) {
        setData(prev => ({
          ...prev,
          branch_id: value,
          sender_city: branch.address.city,
          sender_neighborhood: branch.address.neighborhood,
          sender_address: branch.address.street,
        }));
        return;
      }
    }
    setData(prev => ({ ...prev, [id]: value }));
  };

  const handlePackageChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = [...data.package_detail];
    if (name === "length" || name === "width" || name === "height") {
      updated[idx].dimensions[name] = Number(value);
    } else {
      (updated[idx] as any)[name] = name === "quantity" || name === "weight" || name === "price" ? Number(value) : value;
    }
    setData(prev => ({ ...prev, package_detail: updated }));
  };

  const addPackage = () => {
    setData(prev => ({
      ...prev,
      package_detail: [...prev.package_detail, { type: "", package_number: "", description: "", weight: 0, quantity: 1, price: 0, dimensions: { length: 0, width: 0, height: 0 } }]
    }));
  };
  const removePackage = (idx: number) => {
    setData(prev => ({ ...prev, package_detail: prev.package_detail.filter((_: any, i: number) => i !== idx) }));
  };

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.delivery_date < data.date) {
      Swal.fire({ icon: 'error', title: 'Fecha inválida', text: 'La fecha de entrega debe ser mayor a la fecha de recogida.', confirmButtonText: 'Entendido' });
      return;
    }
    setLoading(true);

    const dateStr = dayjs(data.date).format('YYYY-MM-DD');
    const pickup_dt = `${dateStr} ${data.hour !== 'Sin horario' ? data.hour : ''}`.trim();

    const payload = {
      company_id: selectCompany.id,
      branch_id: data.branch_id,
      company_name: selectCompany.name,
      pickup_datetime: pickup_dt,
      who_pays: data.who_pays,
      notes: data.notes,
      receiver: {
        name: data.recipient_name,
        address: { city: data.recipient_city, neighborhood: data.recipient_neighborhood, street: data.recipient_address },
        email: data.recipient_email,
        phone: data.recipient_phone,
      },
      package_details: data.package_detail,
      shipping_cost: data.price,
      status: typeForm === 'post' ? 'Procesando' : data.status,
      withdrawal_date: data.withdrawal_date.toISOString(),
      delivery_date: data.delivery_date.toISOString(),
      delivery_hour: data.delivery_hour,
    };

    const result = typeForm === 'put'
      ? await Waybills.put(id!, payload, token)
      : await Waybills.set(payload, token);

    if (result.id) {
      Swal.fire({ icon: 'success', title: '¡Éxito!', text: typeForm === 'put' ? 'Guía actualizada exitosamente' : 'Guía creada exitosamente' })
        .then(() => navigate('/waybills'));
    } else {
      Swal.fire({ icon: 'error', title: result.error, text: result.mensaje });
    }
    setLoading(false);
  };

  return (
    <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">{title}</h5>
      <div className="flex items-center justify-between mb-4">
  <h5 className="text-3xl font-bold tracking-tight text-gray-800">{title}</h5>
  {/* Cerrar (vuelve a la lista en la misma página) */}
  <button
    type="button"
    title="Cerrar"
    onClick={() => navigate(-1)}
    className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
  >
    <Icon path={mdiArrowLeft} size={1} />
  </button>
</div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/4 px-2 ">
            <label
              htmlFor="branch_id"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Dirección retiro
            </label>
            <select
              id="branch_id"
              value={data.branch_id}
              onChange={(e) => handleChange(e)}
              className="disabled block w-full py-2 pl-3 pr-1 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={disabled.branch_id}
            >
              <option value="">Selecciona una dirección</option>
              {selectCompany.branches?.map((branche) => (
                <option key={branche.id} value={branche.id}>
                  {branche.name}
                </option>
              ))}
            </select>

          </div>
          <div className="w-full md:w-1/4 px-2">
            {typeForm === 'get'
              ? <p className="py-2 px-3 bg-gray-100 rounded">Fecha de retiro: {dayjs(data.withdrawal_date).locale('es').format('DD/MM/YYYY')}</p>
              : <DateFilter value={data.date instanceof Date && !isNaN(data.date.getTime()) ? data.date : null} set={setSelectDate} label="Fecha de retiro" />
            }
          </div>
          <div className="w-full md:w-1/3 px-2 ">
            <SelectHoursRange value={data.hour} set={setSelectHours}   labelText="Horario de entrega (9hs - 18hs)"  required={true} disabled={type=="get"} />
          </div>
          <div className="w-full md:w-1/4 px-2 ">
            <label
              htmlFor="price"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Precio de envio
            </label>
            <input
              type="text"
              id="price"
              value={data.price}
              onChange={handleChange}
              placeholder="Precio"
              className="mb-6 py-2 pl-3 pr-1  bg-gray-50 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  cursor-not-allowed dark:bg-gray-200 dark:border-gray-400 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              disabled
            />
          </div>
           <div className="w-full md:w-1/4 px-2">
            {typeForm === 'get'
              ? <p className="py-2 px-3 bg-gray-100 rounded">Fecha de entrega: {dayjs(data.delivery_date).locale('es').format('DD/MM/YYYY')}</p>
              : <DateFilterDelivery value={data.delivery_date instanceof Date && !isNaN(data.delivery_date.getTime()) ? data.delivery_date : null} set={setSelectDateDelivery} label="Fecha de entrega" />
            }
          </div>
          <div className="w-full md:w-1/3 px-2 ">
            <SelectHoursRange value={data.delivery_hour} set={setSelectDeliveryHour} required={true} disabled={type == "get"} labelText="Horario de entrega (9hs - 18hs)" />
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
              className="mb-6 py-2 pl-3 pr-1  bg-gray-50 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  cursor-not-allowed dark:bg-gray-200 dark:border-gray-400 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              disabled
            />
          </div>
        </div>
          <h6 className="text-lg font-bold mb-4">Información del remitente</h6>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <div className="mb-3">
              <label
                htmlFor="sender_city"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Ciudad
              </label>
              <input
                type="text"
                id="sender_city"
                value={data.sender_city}
                placeholder="Ciudad"
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
                placeholder="Barrio"
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="sender_address"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Dirección - Apartamento
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <div className="mb-3">
              <label
                htmlFor="recipient_city"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Ciudad 
              </label>
              <select
                id="recipient_city"
                value={data.recipient_city}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={type=="get"}
              >
                <option value="Canelones">Canelones</option>
                <option value="Montevideo">Montevideo</option>
              </select>
            </div>
            <div className="mb-3">
             <SelectNeighborhood type="" disabled={type=="get"}  token={token} city={data.recipient_city} value={data.recipient_neighborhood} set={setSelectNeighborhoodTemp}/>
            </div>
            <div className="mb-3">
              <label
                htmlFor="recipient_address"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Dirección - Apartamento
              </label>
              <input
                type="text"
                id="recipient_address"
                value={data.recipient_address}
                onChange={handleChange}
                placeholder="Dirección"
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={type=="get"}
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="recipient_phone"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Nombre Destinatario
              </label>
              <input
                type="text"
                id="recipient_name"
                value={data.recipient_name}
                onChange={handleChange}
                placeholder="Nombre completo"
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={type=="get"}
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="recipient_phone"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Telefono
              </label>
              <input
                type="text"
                id="recipient_phone"
                value={data.recipient_phone}
                onChange={handleChange}
                placeholder="Telefono"
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={type=="get"}
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="recipient_phone"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
               Quien Paga 
              </label>
              <select
                id="who_pays"
                value={data.who_pays}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={type=="get"}
              >
                <option value="Remitente">Remitente</option>
                <option value="Destinatario">Destinatario</option>
              </select>
            </div>
            <div className="mb-3 ">
              <label
                htmlFor="recipient_phone"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
              Notas 
              </label>
              <textarea id="notes"  value={data.notes}  disabled={type=="get"} onChange={handleChange} className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder=""></textarea>
            </div>
          </div>
          <div className="mb-3">
          <h6 className="mb-2 text-lg font-medium text-gray-700 flex items-center justify-center space-x-2">
            <span>Detalle de paquete</span>
            { type!="get" &&
            <button
              type="button"
              onClick={addPackage}
              className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <Icon path={mdiPlusCircle} size={1} color="green" />
            </button>
            }
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
                    disabled={type=="get"}
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
                      disabled={type=="get"}
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
                      disabled={type=="get"}
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
                      disabled={type=="get"}
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
                      disabled={type=="get"}
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
                      disabled={type=="get"}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-end">
                {type!="get" &&
                    <button
                      type="button"
                      onClick={() => removePackage(index)}
                      className="p-3 bg-red-500 text-white rounded-full"
                    >
                      <Icon path={mdiDelete} size={1} />
                    </button> 
                }
              </div>
            </div>
          ))}
          </div>
          {type!="get" &&
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              disabled={loading}
            >
              {loading ? "Guardando..." : btn}
            </button>
          }
        </form>
      </div>
    );
  }

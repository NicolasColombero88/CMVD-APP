import React, { useState, useEffect } from "react";
import { Calculate } from "@/modules/calculate/infrastructure/calculateService";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Icon } from "@mdi/react";
import { mdiPlusCircle, mdiDelete,mdiMagnify } from "@mdi/js";
import Swal from "sweetalert2";
import ModalSelect from './ModalSelect';
import SelectNeighborhood from './SelectNeighborhood';
import SelectHours from './SelectHours';
export default function FormWaybill({ type = "get" }) {
  const [loading, setLoading] = useState(false);
  const token = "";
  const [data, setData] = useState({
    sender_city: "Montevideo",
    sender_neighborhood: "",
    recipient_city: "Montevideo",
    recipient_neighborhood: "",
    recipient_address: "",
    recipient_email:"",
    recipient_phone:"",
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
  });

  const navigate = useNavigate();
  useEffect(() => {
   
  }, []);
  const handleChange = (e) => {
    const { id, value } = e.target;
    setData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handlePackageChange = (index, event) => {
    const { name, value } = event.target;
  
    const newPackageDetail = [...data.package_detail];
    if (name === "length" || name === "width" || name === "height") {
      newPackageDetail[index].dimensions[name] = value;
    } else {
      newPackageDetail[index][name] = value;
    }
    setData({ ...data, package_detail: newPackageDetail });
  };
  

  const addPackage = () => {
    setData((prevData) => ({
      ...prevData,
      package_detail: [
        ...prevData.package_detail,
        {
          type: "",
          package_number: "",
          description: "",
          weight: "",
          quantity: "",
          Price: "",
          dimensions: { length: "", width: "", height: "" },
        },
      ],
    }));
  };

  const removePackage = (index) => {
    setData((prevData) => ({
      ...prevData,
      package_detail: prevData.package_detail.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let dataC={
        "sender_city":data.sender_city,
        "sender_neighborhood": data.sender_neighborhood,
        "recipient_city": data.recipient_city,
        "recipient_neighborhood":data.recipient_neighborhood ,
        "package_detail":data.package_detail
    }
    let selectArryTemp=await Calculate.set(dataC,token);
    Swal.fire({
        title: 'Información recibida',
        html: `
          <p>Price: ${selectArryTemp.price}</p>
        <p>Zona: ${selectArryTemp.shipping_zone}</p>
        `,  
        icon: 'info',
    });
    setLoading(false);
  };
  return (
    <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">Cotizar un Envío</h5>
    
      <form className="w-full" onSubmit={handleSubmit}>
        <h6 className="text-lg font-bold mb-4">Información del remitente</h6>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="mb-5">
            <label
              htmlFor="sender_city"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Ciudad
            </label>
            <select
              id="sender_city"
              value={data.sender_city}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="Canelones">Canelones</option>
              <option value="Montevideo">Montevideo</option>
            </select>
          </div>
          <div className="mb-5">
            <SelectNeighborhood type=""  token={token} city={data.sender_city} 
             set={(value) => {
                setData((prevData) => ({
                  ...prevData,
                  sender_neighborhood: value,
                }));
              }}
            />
          </div>
  
        </div>

        <h6 className="text-lg font-bold mb-4">Información del destinatario</h6>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="mb-5">
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
            >
              <option value="Canelones">Canelones</option>
              <option value="Montevideo">Montevideo</option>
            </select>
          </div>
          <div className="mb-5">
           <SelectNeighborhood type=""  token={token} city={data.recipient_city} 
             set={(value) => {
                setData((prevData) => ({
                  ...prevData,
                  recipient_neighborhood: value,
                }));
              }}
            />
          </div>
        </div>
        <div className="mb-5">
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
                  />
                </div>
              </div>
            </div>
            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={() => removePackage(index)}
                className="p-3 bg-red-500 text-white rounded-full"
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
          Cotizar
        </button>
      </form>
    </div>
  );
}

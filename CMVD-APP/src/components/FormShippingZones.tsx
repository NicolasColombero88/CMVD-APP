import React, { useState, useEffect } from "react";
import { ShippingZones } from "@/modules/shipping-zones/infrastructure/shippingZonesService";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { Icon } from "@mdi/react";
import { mdiPlusCircle, mdiDelete } from "@mdi/js";

export default function FormShippingZones({ type = "get" }) {
  const [loading, setLoading] = useState(false);
  const token = useSelector((state) => state.auth.token);
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("Crear Zona de Envío");
  const [btn, setBtn] = useState("Crear");
  const [typeForm, setTypeForm] = useState(type);

  const [data, setData] = useState({
    name: "",
    price: 1000,
    areas: [
      {
        city: "",
        neighborhood: "",
        street: "",
      },
    ],
    status: "activo",
  });

  const loadZoneData = async () => {
    if (type === "get" && id) {
      setTypeForm("put");
    }
    if (id) {
      setBtn("Modificar");
      setTitle("Modificar Zona de Envío");
      const resp = await ShippingZones.getById(id, token);
      setData(resp.data);
    }
  };

  useEffect(() => {
    loadZoneData();
  }, []);
  const handleChange = (e) => {
    const { id, value, type } = e.target;
  
    const normalizedValue =
      type === "number" ? value.replace(/^0+(?!$)/, "") : value; 
    setData((prevData) => ({
      ...prevData,
      [id]: type === "number" && normalizedValue !== "" ? parseFloat(normalizedValue) : normalizedValue,
    }));
  };  
  const handleAreaChange = (index, e) => {
    const { name, value } = e.target;
    setData((prevData) => {
      const updatedAreas = [...prevData.areas];
      updatedAreas[index] = {
        ...updatedAreas[index],
        [name]: value,
      };
      return {
        ...prevData,
        areas: updatedAreas,
      };
    });
  };

  const addArea = () => {
    setData((prevData) => ({
      ...prevData,
      areas: [
        ...prevData.areas,
        {
          city: "",
          neighborhood: "",
          street: "",
        },
      ],
    }));
  };

  const removeArea = (index) => {
    if(data.areas.length==1){
      Swal.fire({
        icon: "error",
        title: "¡Error!",
        text: "Es obligatorio tener al menos un barrio.",
      });
      return;
    }
    setData((prevData) => ({
      ...prevData,
      areas: prevData.areas.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log(data);
    let  zone;
    if(typeForm === "put" ){
      zone=await ShippingZones.put(id,data, token);
    }else{
      zone=await ShippingZones.set(data, token);
    }
    if (typeof zone.id!='undefined'){
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: typeForm === "put" ? "Zona actualizada exitosamente" : "Zona creada exitosamente",
        }).then(() => {
          navigate("/shipping-zones");
        });
    } else {
      Swal.fire({
        icon: "error",
        title: "¡Error!",
        text: zone.mensaje,
      });
    }
  };

  return (
    <div className="block max-w-2xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">{title}</h5>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="flex flex-wrap mb-5">
          <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              id="name"
              value={data.name}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nombre completo"
              required
            />
          </div>
          <div className="w-full md:w-1/2 pl-2">
            <label htmlFor="price" className="block mb-2 text-sm font-medium text-gray-700">
              Precio
            </label>
            <input
              type="number"
              id="price"
              value={data.price}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Precio"
              required
            />
          </div>
        </div>
        <div className="flex flex-wrap mb-5">
          <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
          <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="status"
              value={data.status}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
        <div className="mb-5">
        <h6 className="mb-2 text-lg font-medium text-gray-700 flex items-center justify-center space-x-2">
          <span>Areas</span>
          { type!="get" &&
          <button
            type="button"
            onClick={addArea}
            className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <Icon path={mdiPlusCircle} size={1} color="green" />
          </button>
          }
        </h6>

          {data.areas.map((area, index) => (
            <div key={index} className="flex items-center mb-4">
              <div className="flex w-[90%] flex-wrap">
                <div className="w-full sm:w-1/3 p-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Ciudad</label>
                  <input
                    type="text"
                    name="city"
                    value={area.city}
                    onChange={(e) => handleAreaChange(index, e)}
                    className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                    placeholder="Ciudad"
                    required
                  />
                </div>
                <div className="w-full sm:w-1/3 p-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Barrio</label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={area.neighborhood}
                    onChange={(e) => handleAreaChange(index, e)}
                    className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                    placeholder="Barrio"
                    required
                  />
                </div>
              
              </div>
              {type !== "get" && (
                <button
                  type="button"
                  onClick={() => removeArea(index)}
                  className="px-2 py-1 mt-7 text-white bg-red-500 rounded-lg hover:bg-red-600"
                >
                  <Icon path={mdiDelete} size={1} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          disabled={loading}
        >
          {loading ? "Guardando..." : btn}
        </button>
      </form>
    </div>
  );
}

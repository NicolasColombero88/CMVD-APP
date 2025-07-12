import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { Settings } from "@/modules/settings/infrastructure/settingsService";
import Icon from '@mdi/react';
import { mdiPlusCircle, mdiPencil, mdiDelete } from '@mdi/js';
export default function FormCompany({ type = "get" }) {
  const [loading, setLoading] = useState(false);
  const token = useSelector((state) => state.auth.token);
  const [data, setData] = useState({
    app_env: "",
    smtp_host: "",
    smtp_port: "",
    smtp_user: "",
    smtp_password: "",
    smtp_from: "",
    shipments_enabled:false,
    should_notify_driver:false,
    max_daily_shipments_monday: 0,
    max_daily_shipments_tuesday: 0,
    max_daily_shipments_wednesday:0,
    max_daily_shipments_thursday: 0,
    max_daily_shipments_friday: 0,
    max_daily_shipments_saturday:0,
    max_daily_shipments_sunday: 0
});


  const index = async () => {
    let dataSt = await Settings.get(token);
    console.log("************",dataSt);
    setData(dataSt);
  };

  useEffect(() => {
    index();
  }, []);

  const handleChange = (e) => {
    const { id, type, checked, value } = e.target;
    setData((prevData) => ({
      ...prevData,
      [id]: type === "checkbox" ? checked : type === "number" ? Number(value) || 0 : value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      let resp = await Settings.set(data, token);
      console.log("****11*****", resp);
     
      if (typeof resp.data.app_env!="undefined") {
        Swal.fire({
          icon: "success",
          title: "Guardado exitoso",
          text: "Los ajustes han sido guardados correctamente.",
        });
      } else {
        throw new Error("No se pudo guardar la configuración.");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al guardar los ajustes. Inténtalo de nuevo.",
      });
      console.error("Error al guardar:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="block max-w-3xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">Ajuestes del app</h5>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="flex flex-wrap mb-5">
          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="smtp_host" className="block mb-2 text-sm font-medium text-gray-700">SMTP Host</label>
            <input type="text" id="smtp_host" value={data.smtp_host} onChange={handleChange} className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="smtp_port" className="block mb-2 text-sm font-medium text-gray-700">SMTP Port</label>
            <input type="text" id="smtp_port" value={data.smtp_port} onChange={handleChange} className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="smtp_user" className="block mb-2 text-sm font-medium text-gray-700">SMTP User</label>
            <input type="text" id="smtp_user" value={data.smtp_user} onChange={handleChange} className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="smtp_password" className="block mb-2 text-sm font-medium text-gray-700">SMTP Password</label>
            <input type="text" id="smtp_password" value={data.smtp_password} onChange={handleChange} className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="smtp_from" className="block mb-2 text-sm font-medium text-gray-700">SMTP From</label>
            <input type="text" id="smtp_from" value={data.smtp_from} onChange={handleChange} className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          
          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="shipments_enabled" className="block mb-2 text-sm font-medium text-gray-700">Envíos habilitados</label>
            <input type="checkbox" id="shipments_enabled" checked={data.should_notify_driver} onChange={handleChange} />
          </div>
          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="shipments_enabled" className="block mb-2 text-sm font-medium text-gray-700">Notificar acción al cadete</label>
            <input type="checkbox" id="shipments_enabled" checked={data.shipments_enabled} onChange={handleChange} />
          </div>

          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="max_daily_shipments_monday" className="block mb-2 text-sm font-medium text-gray-700">Máximo de envíos diarios lunes</label>
            <input type="number" id="max_daily_shipments_monday" value={data.max_daily_shipments_monday} onChange={handleChange} className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="max_daily_shipments_tuesday" className="block mb-2 text-sm font-medium text-gray-700">Máximo de envíos diarios martes</label>
            <input type="number" id="max_daily_shipments_tuesday" value={data.max_daily_shipments_tuesday} onChange={handleChange} className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="max_daily_shipments_wednesday" className="block mb-2 text-sm font-medium text-gray-700">Máximo de envíos diarios miércole</label>
            <input type="number" id="max_daily_shipments_wednesday" value={data.max_daily_shipments_wednesday} onChange={handleChange} className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="max_daily_shipments_thursday" className="block mb-2 text-sm font-medium text-gray-700">Máximo de envíos diarios jueves</label>
            <input type="number" id="max_daily_shipments_thursday" value={data.max_daily_shipments_thursday} onChange={handleChange} className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="max_daily_shipments_friday" className="block mb-2 text-sm font-medium text-gray-700">Máximo de envíos diarios viernes</label>
            <input type="number" id="max_daily_shipments_friday" value={data.max_daily_shipments_friday} onChange={handleChange} className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="max_daily_shipments_saturday" className="block mb-2 text-sm font-medium text-gray-700">Máximo de envíos diarios sábado</label>
            <input type="number" id="max_daily_shipments_saturday" value={data.max_daily_shipments_saturday} onChange={handleChange} className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="w-full md:w-1/2 px-2 mb-4">
            <label htmlFor="max_daily_shipments_sunday" className="block mb-2 text-sm font-medium text-gray-700">Máximo de envíos diarios domingo</label>
            <input type="number" id="max_daily_shipments_sunday" value={data.max_daily_shipments_sunday} onChange={handleChange} className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <button
           type="submit"
           className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
           
         >
           {loading ? "Guardando..." : "Modificar"}
         </button>
      </form>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getDay, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Waybills } from "@/modules/waybills/infrastructure/waybillsService";

registerLocale("es", es);

export default function DateFilter({ label="Fecha",value, set,disabled=false }) {
  const [waybillData, setWaybillData] = useState([]);
  const [blockedDaysArray, setBlockedDaysArray] = useState(new Array(7).fill(0));
  const today = startOfDay(new Date());

  useEffect(() => {
    const fetchWaybillData = async () => {
      try {
        const response = await Waybills.count();
        const data = response.data || [];
        setWaybillData(data);

        // Validar que `max_shipments` existe y tiene 7 elementos
        const maxShipments = response.max_shipments;
        if (Array.isArray(maxShipments) && maxShipments.length === 7) {
          setBlockedDaysArray(maxShipments.map((val) => (val === 0 ? 1 : 0)));
        } else {
          console.warn("max_shipments no tiene el formato esperado");
        }
      } catch (error) {
        console.error("Error al obtener los datos de los waybills:", error);
      }
    };

    fetchWaybillData();
  }, []);

  const isDateDisabled = (date) => {
    if (isBefore(date, today)) return true;
    if (blockedDaysArray[getDay(date)] === 1) return true;

    const blockedDate = waybillData.find((entry) => {
      if (!entry.date || !entry.count || !entry.max_shipments) return false;
      const entryDate = new Date(entry.date);
      return (
        entryDate.getFullYear() === date.getFullYear() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getDate() === date.getDate()
      );
    });

    return blockedDate ? blockedDate.count >= blockedDate.max_shipments : false;
  };

  return (
    <>
       <label
        htmlFor="date"
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <DatePicker
        disabled={disabled}
        selected={value}
        onChange={(date) => set(date)}
        filterDate={(date) => !isDateDisabled(date)}
        dateFormat="dd/MM/yyyy"
        locale="es"
        className="block w-full py-2 pl-3 pr-1 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholderText="Selecciona una fecha"
        required={true}
      />
    </>
  );
}

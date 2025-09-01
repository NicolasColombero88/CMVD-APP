import React, { useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getDay, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Waybills } from "@/modules/waybills/infrastructure/waybillsService";

registerLocale("es", es);

export default function DateFilterDelivery({ label="Fecha", value, set, disabled=false, minDate }) {
  const [waybillData, setWaybillData] = useState<any[]>([]);
  const [maxShipmentsByDOW, setMaxShipmentsByDOW] = useState<number[]>(new Array(7).fill(0));
  const [blockedDaysArray, setBlockedDaysArray] = useState<number[]>(new Array(7).fill(0));
  const today = startOfDay(new Date());

  useEffect(() => {
    const fetchWaybillData = async () => {
      try {
        const response = await Waybills.count();
        const data = response.data || [];
        setWaybillData(data);

        const maxShipments = response.max_shipments;
        if (Array.isArray(maxShipments) && maxShipments.length === 7) {
          setMaxShipmentsByDOW(maxShipments);
          setBlockedDaysArray(maxShipments.map((val: number) => (val === 0 ? 1 : 0)));
        } else {
          console.warn("max_shipments no tiene el formato esperado");
        }
      } catch (error) {
        console.error("Error al obtener los datos de los waybills:", error);
      }
    };

    fetchWaybillData();
  }, []);

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, today)) return true;
    const dow = getDay(date);
    if (blockedDaysArray[dow] === 1) return true; // día completo
    // Si la fecha está llena para "retiro", tampoco permitimos "entrega"
    const entry = waybillData.find((e: any) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getFullYear() === date.getFullYear()
          && d.getMonth() === date.getMonth()
          && d.getDate() === date.getDate();
    });
    if (!entry) return false;
    const dayMax = (Array.isArray(maxShipmentsByDOW) && maxShipmentsByDOW.length === 7)
      ? maxShipmentsByDOW[dow]
      : Number.POSITIVE_INFINITY;
    return typeof entry.count === 'number' && entry.count >= dayMax;
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
        /* impide elegir días anteriores al pickup */
        minDate={minDate}
        filterDate={(date) => !isDateDisabled(date)}
        dateFormat="dd/MM/yyyy"
        locale="es"
        className="block w-full py-2 pl-3 pr-1 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
        required={true}
        placeholderText="Selecciona una fecha"
      />
    </>
  );
}

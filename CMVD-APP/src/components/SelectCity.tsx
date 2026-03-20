import React, { useEffect, useRef, useState } from "react";
import { ShippingZones } from "@/modules/shipping-zones/infrastructure/shippingZonesService";
import { useSelector } from "react-redux";

type Props = {
  token?: string;                 // opcional: si no viene, se lee de Redux
  value?: string;
  set: (v: string) => void;       // actualiza tu state local
  disabled?: boolean;
  id?: string;                    // ej: "recipient_city"
  name?: string;                  // ej: "recipient_city" (lo usa tu handleChange)
  label?: string;                 // opcional: si no lo pasas, no muestra etiqueta
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void; // tu handleChange
};

export default function SelectCity({
  token: tokenProp,
  value = "",
  set = () => null,
  disabled = false,
  id = "city",
  name = "city",
  label,
  onChange,
}: Props) {
  const tokenFromStore = useSelector((s: any) => s?.auth?.token ?? "");
  const token = tokenProp && tokenProp.length > 0 ? tokenProp : tokenFromStore;

  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchCities = async () => {
    // 🔎 Log para saber si hay token o no
    console.log("[SelectCity] fetchCities → token?", token ? "SÍ" : "NO");

    try {
      setLoading(true);
      setError(null);

      // No hacemos early return si no hay token: intentamos igual.
      const res = await ShippingZones.getAreas(token as any);

      console.log("[SelectCity] getAreas response:", res);

      const list = Array.from(
        new Set(
          (res?.data || [])
            .map((a: any) => (a?.city ?? "").toString().trim())
            .filter((c) => c.length > 0)
        )
      ).sort((a, b) => a.localeCompare(b, "es"));

      if (mounted.current) setCities(list);
    } catch (e) {
      console.error("SelectCity:getAreas error", e);
      if (mounted.current) {
        setError("No se pudieron cargar las ciudades.");
        setCities((prev) => prev || []);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    fetchCities();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleChangeInternal = (e: React.ChangeEvent<HTMLSelectElement>) => {
    set(e.target.value);
    if (onChange) onChange(e);
  };

  return (
    <div className="mb-3">
      {typeof label === "string" && label.trim().length > 0 && (
        <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={id}
        name={name}
        value={value || ""}
        onChange={handleChangeInternal}
        className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
        disabled={disabled || loading}
        required
      >
        {!value && (
          <option value="" disabled>
            {loading ? "Cargando..." : (error ? "Reintenta" : "Seleccionar")}
          </option>
        )}
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      {/* Debug visible para saber si hay error */}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
}

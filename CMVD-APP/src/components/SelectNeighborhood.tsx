import React, { useEffect, useMemo, useRef, useState } from "react";
import { ShippingZones } from "@/modules/shipping-zones/infrastructure/shippingZonesService";
import { useSelector } from "react-redux";
import Select from "react-select";

type Props = {
  city: string;                         // ciudad elegida (obligatoria)
  value?: string;                       // barrio seleccionado
  set: (v: string) => void;             // actualiza tu state
  disabled?: boolean;
  id?: string;                          // ej: "recipient_neighborhood"
  name?: string;                        // ej: "recipient_neighborhood"
  label?: string;                       // opcional
  token?: string;                       // opcional: si no viene, se toma de Redux
  onChange?: (e: any) => void;          // tu handleChange (acepta evento sintético)
};

function normalize(s: string) {
  return (s || "")
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export default function SelectNeighborhood({
  city = "",
  value = "",
  set = () => null,
  disabled = false,
  id = "recipient_neighborhood",
  name = "recipient_neighborhood",
  label,
  token: tokenProp,
  onChange,
}: Props) {
  const tokenFromStore = useSelector((s: any) => s?.auth?.token ?? "");
  const token = tokenProp && tokenProp.length > 0 ? tokenProp : tokenFromStore;

  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function fetchAreas() {
      console.log("[SelectNeighborhood] fetchAreas → token?", token ? "SÍ" : "NO");

      try {
        setLoading(true);
        setError(null);

        // Igual que en SelectCity: nada de early return sin token.
        const res = await ShippingZones.getAreas(token as any);

        console.log("[SelectNeighborhood] getAreas response:", res);

        const data = Array.isArray(res?.data) ? res.data : [];
        if (mounted.current) setAreas(data);
      } catch (e) {
        console.error("SelectNeighborhood:getAreas error", e);
        if (mounted.current) {
          setError("No se pudieron cargar los barrios.");
          setAreas((prev) => prev || []);
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    }

    fetchAreas();
    return () => {
      mounted.current = false;
    };
  }, [token]);

  const neighborhoods = useMemo(() => {
    const nCity = normalize(city);
    if (!nCity) return [];
    const list = areas
      .filter((a: any) => normalize(a?.city || "") === nCity)
      .map((a: any) => (a?.neighborhood || "").toString().trim())
      .filter((b: string) => b.length > 0);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, "es"));
  }, [areas, city]);

  // si cambia la ciudad y el barrio actual ya no existe, limpiamos
  useEffect(() => {
    if (value && neighborhoods.length > 0 && !neighborhoods.includes(value)) {
      set("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, neighborhoods]);

  // valor seleccionado para react-select
  const selectedValue = value ? { value, label: value } : null;
  const options = neighborhoods.map((b) => ({ value: b, label: b }));

  const customStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: 10,
      minHeight: 40,
    }),
  };

  const handleChangeInternal = (opt: { value: string; label: string } | null) => {
    const newVal = opt?.value || "";
    set(newVal);
    if (onChange) {
      onChange({
        target: { id, name, value: newVal },
      } as any);
    }
  };

  const placeholder = !city
    ? "Elegí una ciudad primero"
    : (loading ? "Cargando..." : (error ? "Reintenta" : "Seleccionar"));

  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <Select
        inputId={id}
        name={name}
        options={options}
        styles={customStyles}
        value={selectedValue}
        onChange={handleChangeInternal}
        isDisabled={disabled || loading || !city}
        placeholder={placeholder}
        noOptionsMessage={() => city ? "Sin resultados" : "Elegí una ciudad"}
      />
      {error && (
        <button
          type="button"
          className="mt-1 text-xs underline"
          onClick={() => {
            console.log("[SelectNeighborhood] Retry getAreas");
            setLoading(true);
            ShippingZones.getAreas(token as any)
              .then((res: any) => {
                const data = Array.isArray(res?.data) ? res.data : [];
                if (mounted.current) {
                  setAreas(data);
                  setError(null);
                }
              })
              .catch((e: any) => console.error("Retry getAreas error", e))
              .finally(() => mounted.current && setLoading(false));
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

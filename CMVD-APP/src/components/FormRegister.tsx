import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import Icon from "@mdi/react";
import { mdiPlusCircle, mdiDelete, mdiEye, mdiEyeOff } from "@mdi/js";
import ReCAPTCHA from "react-google-recaptcha";
import SelectCity from "./SelectCity";
import SelectNeighborhood from "./SelectNeighborhood";

const RECAPTCHA_KEY = import.meta.env.VITE_RECAPTCHA_KEY;

export default function FormRegister({ set = (_: any) => null }) {
  const [loading, setLoading] = useState(false);
  // Si no hay sesión en registro, token puede venir undefined → pasamos "" a los selects.
  const token = useSelector((state: any) => state.auth?.token) as string | undefined;

  // Estado del formulario
  const [data, setData] = useState<any>({
    name: "",
    user_name: "",
    user_id: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    status: "activo",
    branches: [
      {
        name: "",
        address: {
          state: "",
          city: "Montevideo",
          neighborhood: "",
          street: "",
          postcode: "",
        },
        state: "",
      },
    ],
  });

  // Estado UI
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  // Logs de render para verificar token y estructura
  console.log("[FormRegister] render", {
    token: token || "(vacío)",
    branches: data.branches,
  });

  // Handlers básicos
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setData((prevData: any) => ({
      ...prevData,
      [id]: id === "email" ? value.toLowerCase() : value,
    }));
  };

  // Actualiza campos de branch (y/o address.*)
  const handleBranchField = (index: number, field: string, value: string) => {
    const updated = [...data.branches];
    if (field === "name" || field === "state") {
      updated[index][field] = value;
    } else {
      updated[index].address[field] = value;
    }
    setData((prev: any) => ({ ...prev, branches: updated }));
  };

  // Agregar / quitar sucursal
  const addBranch = () => {
    setData((prev: any) => ({
      ...prev,
      branches: [
        ...prev.branches,
        {
          name: "",
          address: {
            state: "",
            city: "Montevideo",
            neighborhood: "",
            street: "",
            postcode: "",
          },
          state: "",
        },
      ],
    }));
  };

  const removeBranch = (index: number) => {
    if (data.branches.length === 1) {
      Swal.fire({
        icon: "error",
        title: "¡Error!",
        text: "Es obligatorio tener al menos una dirección retiro.",
      });
      return;
    }
    const updated = data.branches.filter((_: any, i: number) => i !== index);
    setData((prev: any) => ({ ...prev, branches: updated }));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (data.password !== data.confirm_password) {
      Swal.fire({
        icon: "error",
        title: "Error de validación",
        text: "Las contraseñas no coinciden. Por favor verifica ambos campos.",
      });
      return;
    }

    if (!captchaVerified) {
      Swal.fire({
        icon: "error",
        title: "¡Error!",
        text: "Por favor verifica el reCAPTCHA.",
      });
      return;
    }

    setLoading(true);
    try {
      // En tu app, el padre de este componente hace el POST real.
      // Aquí sólo le pasamos todo el objeto "data".
      set(data);
      // Podrías redirigir si corresponde:
      // navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaChange = (value: string | null) => {
    setCaptchaVerified(!!value);
  };

  return (
    <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">
        Registrate
      </h5>

      <form className="w-full" onSubmit={handleSubmit}>
        {/* =======================
            Datos principales
           ======================= */}
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/2 px-2 ">
            <label
              htmlFor="user_name"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Nombre completo
            </label>
            <input
              type="text"
              id="user_name"
              value={data.user_name}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nombre completo"
              required
            />
          </div>

          <div className="w-full md:w-1/2 px-2 ">
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={data.email}
              onChange={handleChange}
              autoCapitalize="none"
              style={{ textTransform: "lowercase" }}
              className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="empresa@example.com"
              required
            />
          </div>

          <div className="w-full md:w-1/2 px-2">
            <div className="relative">
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <div className="flex">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={data.password}
                  onChange={handleChange}
                  className="flex-1 py-2 pl-3 pr-14 text-sm bg-white border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex items-center justify-center px-3 bg-gray-100 border-t border-b border-r border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <Icon
                    path={showPassword ? mdiEyeOff : mdiEye}
                    size={1}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 px-2">
            <div className="relative">
              <label
                htmlFor="confirm_password"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Confirmar Contraseña
              </label>
              <div className="flex">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirm_password"
                  id="confirm_password"
                  value={data.confirm_password}
                  onChange={handleChange}
                  className="flex-1 py-2 pl-3 pr-14 text-sm bg-white border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Confirmar contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="flex items-center justify-center px-3 bg-gray-100 border-t border-b border-r border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
                >
                  <Icon
                    path={showConfirm ? mdiEyeOff : mdiEye}
                    size={1}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 px-2 ">
            <label
              htmlFor="phone"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              value={data.phone}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Teléfono"
              required
            />
          </div>

          <div className="w-full md:w-1/2 px-2 ">
            <label
              htmlFor="name"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Nombre de la Empresa
            </label>
            <input
              type="text"
              id="name"
              value={data.name}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nombre de la empresa"
              required
            />
          </div>
        </div>

        {/* =======================
            Dirección de retiro(s)
           ======================= */}
        <div className="mb-5">
          <h6 className="mb-2 text-lg font-medium text-gray-700 flex items-center justify-center space-x-2">
            <span>Dirección retiro</span>
            <button
              type="button"
              onClick={addBranch}
              className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
              aria-label="Agregar dirección retiro"
            >
              <Icon path={mdiPlusCircle} size={1} color="green" />
            </button>
          </h6>

          {data.branches.map((branch: any, index: number) => (
            <div key={index} className="flex items-center">
              <div className="flex w-[90%] flex-wrap">
                {/* Nombre de la sucursal */}
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={branch.name}
                    onChange={(e) => handleBranchField(index, "name", e.target.value)}
                    className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Nombre de dirección retiro"
                    required
                  />
                </div>

                {/* CIUDAD */}
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <SelectCity
                    id={`branch_city_${index}`}
                    name={`branch_city_${index}`}
                    label="Ciudad"
                    token={token || ""} // tolerante: si no hay sesión, no rompe
                    value={branch.address.city || ""}
                    disabled={false}
                    set={(v: string) => {
                      console.log("[SelectCity] set()", { index, cityElegida: v, token: token || "(vacío)" });
                      const updated = [...data.branches];
                      updated[index].address.city = v;
                      updated[index].address.neighborhood = ""; // al cambiar ciudad, vaciamos barrio
                      setData((prev: any) => ({ ...prev, branches: updated }));
                    }}
                  />
                </div>

                {/* BARRIO */}
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <SelectNeighborhood
                    id={`branch_neighborhood_${index}`}
                    name={`branch_neighborhood_${index}`}
                    label="Barrio"
                    city={branch.address.city || ""}
                    value={branch.address.neighborhood || ""}
                    disabled={false}
                    set={(value: string) => {
                      console.log("[SelectNeighborhood] set()", {
                        index,
                        ciudadActual: branch.address.city || "(vacía)",
                        barrioElegido: value,
                      });
                      const updated = [...data.branches];
                      updated[index].address.neighborhood = value;
                      setData((prev: any) => ({ ...prev, branches: updated }));
                    }}
                  />
                </div>

                {/* Dirección */}
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Dirección - Apartamento
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={branch.address.street}
                    onChange={(e) => handleBranchField(index, "street", e.target.value)}
                    className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Calle, número, apto"
                    required
                  />
                </div>
              </div>

              {/* Eliminar sucursal */}
              <div className="ml-2">
                <button
                  type="button"
                  onClick={() => removeBranch(index)}
                  className="px-2 py-1 mt-7 text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-xs"
                  aria-label="Eliminar dirección retiro"
                >
                  <Icon path={mdiDelete} size={1} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* =======================
            reCAPTCHA + Submit
           ======================= */}
        <div className="mb-5">
          <ReCAPTCHA sitekey={RECAPTCHA_KEY} onChange={handleCaptchaChange} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-3 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Registrar
        </button>
      </form>
    </div>
  );
}

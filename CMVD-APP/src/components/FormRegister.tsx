import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import Icon from '@mdi/react';
import SelectNeighborhood from './SelectNeighborhood';
import { mdiPlusCircle, mdiPencil, mdiDelete } from '@mdi/js';
import ReCAPTCHA from "react-google-recaptcha";
const RECAPTCHA_KEY = import.meta.env.VITE_RECAPTCHA_KEY;
export default function FormCompany({ set = (data) => null }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
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
  const [captchaVerified, setCaptchaVerified] = useState(false);

  useEffect(() => {}, []);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setData((prevData) => ({
      ...prevData,
      // email siempre lowercase
      [id]: id === "email" ? value.toLowerCase() : value,
    }));
  };

  const handleBranchChange = (index, e) => {
    const { name, value } = e.target;
    const updatedBranches = [...data.branches];
    if (name in updatedBranches[index].address) {
      updatedBranches[index].address[name] = value;
    } else {
      updatedBranches[index][name] = value;
    }
    setData((prevData) => ({
      ...prevData,
      branches: updatedBranches,
    }));
  };

  const addBranch = () => {
    setData((prevData) => ({
      ...prevData,
      branches: [
        ...prevData.branches,
        {
          name: "",
          address: {
            state: "",
            city: "",
            neighborhood: "",
            street: "",
            postcode: "",
          },
          state: "",
        },
      ],
    }));
  };

  const removeBranch = (index) => {
    if (data.branches.length === 1) {
      Swal.fire({
        icon: "error",
        title: "¡Error!",
        text: "Es obligatorio tener al menos una dirección retiro.",
      });
      return;
    }
    const updatedBranches = [...data.branches];
    updatedBranches.splice(index, 1);
    setData((prevData) => ({
      ...prevData,
      branches: updatedBranches,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaVerified) {
      Swal.fire({
        icon: "error",
        title: "¡Error!",
        text: "Por favor verifica el reCAPTCHA.",
      });
      return;
    }
    setLoading(true);
    set(data);
    setLoading(false);
  };

  const handleCaptchaChange = (value) => {
    if (value) {
      setCaptchaVerified(true);
    } else {
      setCaptchaVerified(false);
    }
  };

  return (
    <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">Registrate</h5>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/2 px-2 ">
            <label htmlFor="user_name" className="block mb-2 text-sm font-medium text-gray-700">
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
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
            type="email"
            id="email"
            value={data.email}
            onChange={handleChange}
            autoCapitalize="none"                  // evita mayúsculas en móviles
            style={{ textTransform: "lowercase" }} // muestra siempre minúsculas
            className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="empresa@example.com"
            required
          />
          </div>
          <div className="w-full md:w-1/2 px-2 ">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={data.password}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Contraseña"
              required
            />
          </div>
          <div className="w-full md:w-1/2 px-2 ">
            <label htmlFor="confirm_password" className="block mb-2 text-sm font-medium text-gray-700">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirm_password"
              value={data.confirm_password}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Confirmar contraseña"
              required
            />
          </div>
          <div className="w-full md:w-1/2 px-2 ">
            <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900">
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              value={data.phone}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Telefono"
              required
            />
          </div>
          <div className="w-full md:w-1/2 px-2 ">
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
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
        <div className="mb-5">
          <h6 className="mb-2 text-lg font-medium text-gray-700 flex items-center justify-center space-x-2">
            <span>Dirección retiro</span>
            <button
              type="button"
              onClick={addBranch}
              className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <Icon path={mdiPlusCircle} size={1} color="green" />
            </button>
          </h6>
          {data.branches.map((branch, index) => (
            <div key={index} className="flex items-center">
              <div className="flex w-[90%] flex-wrap">
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={branch.name}
                    onChange={(e) => handleBranchChange(index, e)}
                    className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Nombre de dirección retiro"
                    required
                  />
                </div>
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Ciudad</label>
                  <select
                    name="city"
                    value={branch.address.city}
                    onChange={(e) => handleBranchChange(index, e)}
                    className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value="Canelones">Canelones</option>
                    <option value="Montevideo">Montevideo</option>
                  </select>
                </div>
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <SelectNeighborhood
                    type=""
                    city={branch.address.city}
                    set={(value) => {
                      const updatedBranches = [...data.branches];
                      updatedBranches[index].address.neighborhood = value;
                      setData((prevData) => ({
                        ...prevData,
                        branches: updatedBranches,
                      }));
                    }}
                  />
                </div>
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Dirección - Apartamento</label>
                  <input
                    type="text"
                    name="street"
                    value={branch.address.street}
                    onChange={(e) => handleBranchChange(index, e)}
                    className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Calle"
                    required
                  />
                </div>
              </div>
              <div className="ml-2">
                <button
                  type="button"
                  onClick={() => removeBranch(index)}
                  className="px-2 py-1 mt-7 text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-xs"
                >
                  <Icon path={mdiDelete} size={1} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-5">
          <ReCAPTCHA
            sitekey={RECAPTCHA_KEY}
            onChange={handleCaptchaChange}
          />
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

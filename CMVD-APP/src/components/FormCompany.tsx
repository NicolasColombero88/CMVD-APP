import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { Companies } from "@/modules/companies/infrastructure/companiesService";
import { Users } from '@/modules/users/infrastructure/usersService';
import Icon from '@mdi/react';
import { mdiPlusCircle, mdiDelete } from '@mdi/js';
import SelectNeighborhood from './SelectNeighborhood';
import SelectCity from "./SelectCity";

export default function FormCompany({ type = "get" }) {
  const [loading, setLoading] = useState(false);
  const token = useSelector((state: any) => state.auth.token);
  const { id } = useParams();
  const [title, setTitle] = useState("Crear Empresa");
  const [btn, setBtn] = useState("Crear");
  const [typeForm, setTypeForm] = useState(type);
  const [ifPassword, setIfPassword] = useState(true);
  const [data, setData] = useState<any>({
    name: "",
    user_name: "",
    user_id: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    status: "activo",
    price: 0,
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

  const index = async () => {
    if (type === "get") {
      setBtn("");
      setTitle("Informacion de Empresa");
      setIfPassword(false);
    }
    if (type === "put") {
      setBtn("Modificar");
      setTitle("Modificar Empresa");
    }
    if (id != null || type === "put") {
      setIfPassword(false);
      const company = await Companies.getById(id, token);
      // Aseguro que cada branch traiga address con city/neighborhood definidos
      const fixed = {
        ...company.data,
        branches: (company.data?.branches || []).map((b: any) => ({
          ...b,
          address: {
            state: b.address?.state || "",
            city: b.address?.city || "Montevideo",
            neighborhood: b.address?.neighborhood || "",
            street: b.address?.street || "",
            postcode: b.address?.postcode || "",
          }
        })),
      };
      setData(fixed);
    }
  };

  useEffect(() => {
    index();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setData((prevData: any) => ({
      ...prevData,
      [id]: id === "email" ? value.toLowerCase() : value,
    }));
  };

  const handleBranchChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = [...data.branches];
    if (name in updated[index].address) {
      updated[index].address[name] = value;
    } else {
      (updated[index] as any)[name] = value;
    }
    setData((prev: any) => ({ ...prev, branches: updated }));
  };

  const setBranchCity = (index: number, city: string) => {
    const updated = [...data.branches];
    updated[index].address.city = city;
    updated[index].address.neighborhood = ""; // reset barrio al cambiar ciudad
    setData((prev: any) => ({ ...prev, branches: updated }));
  };

  const setBranchNeighborhood = (index: number, neighborhood: string) => {
    const updated = [...data.branches];
    updated[index].address.neighborhood = neighborhood;
    setData((prev: any) => ({ ...prev, branches: updated }));
  };

  const addBranch = () => {
    setData((prevData: any) => ({
      ...prevData,
      branches: [
        ...prevData.branches,
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
        text: "Es obligatorio tener al menos una dirección.",
      });
      return;
    }
    const updated = data.branches.filter((_: any, i: number) => i !== index);
    setData((prev: any) => ({ ...prev, branches: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let companyResp;
    try {
      if (typeForm === "put") {
        const companyUpdate = {
          user_name: data.user_name,
          name: data.name,
          email: data.email,
          phone: data.phone,
          whatsapp: data.phone,
          price: parseFloat(String(data.price || 0)),
          status: data.status,
          branches: data.branches,
        };
        companyResp = await Companies.put(id, companyUpdate, token);
      } else {
        if (data.confirm_password !== data.password) {
          Swal.fire({
            icon: "error",
            title: "¡Error!",
            text: "La contraseña debe coincidir con la de confirmar.",
          });
          setLoading(false);
          return;
        }
        if (String(data.password || "").length < 8) {
          Swal.fire({
            icon: "error",
            title: "¡Error!",
            text: "La contraseña debe tener al menos 8 caracteres.",
          });
          setLoading(false);
          return;
        }

        const userEmail = await Users.getByEmail(data.email, token);
        let companyData = {
          id: "",
          user_id: "",
          user_name: data.user_name,
          name: data.name,
          email: data.email,
          phone: data.phone,
          whatsapp: data.phone,
          status: data.status,
          price: parseFloat(String(data.price || 0)),
          branches: data.branches,
        };

        if (userEmail.data) {
          if (typeof userEmail.data.companyId !== "undefined") {
            Swal.fire({
              icon: "error",
              title: "No se puede asignar este usuario",
              text: `Ya existe un usuario con ese email y tiene una empresa asociada: ${userEmail.data.companyId}`,
            });
            setLoading(false);
            return;
          }
          companyData.user_id = userEmail.data.id;
          companyResp = await Companies.set(companyData, token);
          if (!companyResp.id) {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Error al asociar usuario a la empresa.",
            });
            setLoading(false);
            return;
          }
        } else {
          const newUser = {
            name: data.user_name,
            companyId: "",
            email: data.email,
            Role: "Cliente",
            status: "activo",
            password: data.password,
            age: 0,
            address: {
              state: "",
              city: "",
              neighborhood: "",
              street: "",
              postcode: 0,
            },
          };
          const userResp = await Users.set(newUser, token);
          if (!userResp.id) {
            Swal.fire({
              icon: "error",
              title: userResp.error,
              text: userResp.mensaje,
            });
            setLoading(false);
            return;
          }
          companyData.user_id = userResp.id;
          companyResp = await Companies.set(companyData, token);
          if (!companyResp.id) {
            Swal.fire({
              icon: "error",
              title: "¡Error!",
              text: "Hubo un problema al procesar la empresa",
            });
            setLoading(false);
            return;
          }
          const userUpdate = await Users.put(userResp.id, { companyId: companyResp.id }, token);
          if (!userUpdate.id) {
            Swal.fire({
              icon: "error",
              title: "¡Error!",
              text: "Hubo un error al asociar el usuario a la empresa",
            });
            setLoading(false);
            return;
          }
        }
      }

      if (companyResp && companyResp.id) {
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: typeForm === "put" ? "Empresa actualizada exitosamente" : "Empresa creada exitosamente",
        }).then(() => {
          navigate("/companies");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "¡Error!",
          text: "Hubo un problema al procesar la empresa",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "¡Error en la operación!",
        text: "Ocurrió un error inesperado. Intente nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="block max-w-3xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">{title}</h5>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="flex flex-wrap mb-5">
          <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              id="name"
              value={data.name}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nombre de la empresa"
              required
              disabled={type === "get"}
            />
          </div>
          <div className="w-full md:w-1/2 pl-2">
            <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-700">
              Estado de la Empresa
            </label>
            <select
              id="status"
              value={data.status}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={type === "get"}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap mb-5">
          <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
            <label htmlFor="user_name" className="block mb-2 text-sm font-medium text-gray-700">
              Nombre del Cliente
            </label>
            <input
              type="text"
              id="user_name"
              value={data.user_name}
              onChange={handleChange}
              placeholder="Nombre del cliente"
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={type === "get"}
            />
          </div>
          <div className="w-full md:w-1/2 pl-2">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={data.email}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              placeholder="empresa@example.com"
              disabled={type === "get"}
            />
          </div>
        </div>

        {ifPassword && (
          <div className="flex flex-wrap mb-5">
            <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={data.password}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Contraseña"
                required
                disabled={type === "get"}
              />
            </div>
            <div className="w-full md:w-1/2 pl-2">
              <label htmlFor="confirm_password" className="block mb-2 text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                id="confirm_password"
                value={data.confirm_password}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Confirmar contraseña"
                required
                disabled={type === "get"}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap mb-5">
          <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
            <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900">
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              value={data.phone}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              placeholder="Telefono"
              disabled={type === "get"}
            />
          </div>
          <div className="w-full md:w-1/2 pl-2">
            <label htmlFor="price" className="block mb-2 text-sm font-medium text-gray-700">
              Precio unico
            </label>
            <input
              type="number"
              id="price"
              value={data.price}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Precio unico"
              required
              disabled={type === "get"}
            />
          </div>
        </div>

        <div className="mb-5">
          <h6 className="mb-2 text-lg font-medium text-gray-700 flex items-center justify-center space-x-2">
            <span>Dirección retiro</span>
            {type !== "get" && (
              <button
                type="button"
                onClick={addBranch}
                className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <Icon path={mdiPlusCircle} size={1} color="green" />
              </button>
            )}
          </h6>

          {data.branches.map((branch: any, index: number) => (
            <div key={index} className="flex items-center">
              <div className="flex w-[90%] flex-wrap">
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={branch.name}
                    onChange={(e) => handleBranchChange(index, e)}
                    className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                    placeholder="Nombre de dirección retiro"
                    disabled={type === "get"}
                  />
                </div>

                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <SelectCity
                    id={`branch_city_${index}`}
                    name={`branch_city_${index}`}
                    label="Ciudad"
                    token={token}
                    value={branch.address.city || ""}
                    disabled={type === "get"}
                    set={(v: string) => setBranchCity(index, v)}
                  />
                </div>

                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <SelectNeighborhood
                    id={`branch_neighborhood_${index}`}
                    name={`branch_neighborhood_${index}`}
                    label="Barrio"
                    city={branch.address.city || ""}
                    value={branch.address.neighborhood || ""}
                    disabled={type === "get"}
                    set={(v: string) => setBranchNeighborhood(index, v)}
                  />
                </div>

                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={branch.address.street}
                    onChange={(e) => handleBranchChange(index, e)}
                    className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                    disabled={type === "get"}
                  />
                </div>
              </div>

              {type !== "get" && (
                <div className="ml-2">
                  <button
                    type="button"
                    onClick={() => removeBranch(index)}
                    className="px-2 py-1 mt-7 text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-xs"
                  >
                    <Icon path={mdiDelete} size={1} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {type !== "get" && (
          <button
            type="submit"
            disabled={loading}
            className="w-full px-3 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? "Cargando..." : btn}
          </button>
        )}
      </form>
    </div>
  );
}

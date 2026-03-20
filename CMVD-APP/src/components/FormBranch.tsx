import React, { useState, useEffect } from "react";
import SelectNeighborhood from "./SelectNeighborhood";
import { Branches } from "@/modules/branches/infrastructure/branchesService";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import SelectCity from "./SelectCity";

export default function FormBranch({
  type = "get",
  set = null,
  idTemp = "",
}) {
  const [loading, setLoading] = useState(false);
  const token = useSelector((state: any) => state.auth.token);
  const [title, setTitle] = useState("Crear Dirección Retiro");
  const [btn, setBtn] = useState("Crear");
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>({
    id: "",
    name: "",
    address: {
      state: "",
      city: "Montevideo",
      neighborhood: "",
      street: "",
      postcode: "",
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id: inputId, value } = e.target;

    if (inputId.includes(".")) {
      const [root, key] = inputId.split(".");
      setData((prev: any) => ({
        ...prev,
        [root]: {
          ...prev[root],
          [key]: value,
        },
      }));
    } else {
      setData((prev: any) => ({
        ...prev,
        [inputId]: value,
      }));
    }
  };

  const setCity = (city: string) => {
    setData((prev: any) => ({
      ...prev,
      address: {
        ...prev.address,
        city,
        neighborhood: "", // reset barrio al cambiar ciudad
      },
    }));
  };

  const setNeighborhood = (neighborhood: string) => {
    setData((prev: any) => ({
      ...prev,
      address: {
        ...prev.address,
        neighborhood,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let message;
    if (type === "put") {
      message = await Branches.put(id, data, token);
    } else {
      if (idTemp !== "") {
        data.id = idTemp;
      }
      message = await Branches.set(data, token);
    }

    if ("id" in message) {
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text:
          type === "put"
            ? "Dirección retiro actualizada exitosamente"
            : "Dirección retiro creada exitosamente",
      }).then(() => {
        if (set != null) {
          set();
        } else {
          navigate("/branches");
        }
      });
    } else {
      Swal.fire({
        icon: "error",
        title: message.error,
        text: message.mensaje,
      });
    }

    setLoading(false);
  };

  const index = async () => {
    if ((id != null || type === "put") && idTemp === "") {
      const dranches = await Branches.getById(id, token);
      // Aseguramos shape de address
      const fixed = {
        ...dranches.data,
        address: {
          state: dranches.data?.address?.state || "",
          city: dranches.data?.address?.city || "Montevideo",
          neighborhood: dranches.data?.address?.neighborhood || "",
          street: dranches.data?.address?.street || "",
          postcode: dranches.data?.address?.postcode || "",
        },
      };
      setData(fixed);
    }
    if (type === "put") {
      setBtn("Modificar");
      setTitle("Modificar dirección retiro");
    }
    if (type === "get") {
      setBtn("");
      setTitle("Informacion de dirección retiro");
    }
  };

  useEffect(() => {
    index();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="block max-w-3xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">
        {title}
      </h5>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/2 px-2">
            <label
              htmlFor="name"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Nombre de dirección retiro
            </label>
            <input
              type="text"
              id="name"
              value={data.name}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nombre completo"
              required
              disabled={type === "get"}
            />
          </div>

          <div className="w-full md:w-1/2 px-2">
            <SelectCity
              id="address.city"
              name="address.city"
              label="Ciudad"
              token={token}
              value={data.address.city || ""}
              disabled={type === "get"}
              set={(v: string) => setCity(v)}
            />
          </div>

          <div className="w-full md:w-1/2 px-2">
            <SelectNeighborhood
              id="address.neighborhood"
              name="address.neighborhood"
              label="Barrio"
              city={data.address.city || ""}
              value={data.address.neighborhood || ""}
              disabled={type === "get"}
              set={(v: string) => setNeighborhood(v)}
            />
          </div>

          <div className="w-full md:w-1/2 px-2">
            <label
              htmlFor="address.street"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Dirección
            </label>
            <input
              type="text"
              id="address.street"
              value={data.address.street}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Calle"
              required
              disabled={type === "get"}
            />
          </div>
        </div>
        <div className="mt-4">
          {type !== "get" && (
            <button
              type="submit"
              className="px-6 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {btn}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

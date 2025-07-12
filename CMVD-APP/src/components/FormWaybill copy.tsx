import React, { useState, useEffect } from "react";
import { Waybills } from "@/modules/waybills/infrastructure/waybillsService";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Icon } from "@mdi/react";
import { mdiPlusCircle, mdiDelete } from "@mdi/js";
import Swal from "sweetalert2";

export default function FormWaybill({ type = "get" }) {
  const [loading, setLoading] = useState(false);
  const token = useSelector((state) => state.auth.token);
  const { id } = useParams();
  const [title, setTitle] = useState("Crear guía");
  const [btn, setBtn] = useState("Crear");
  const [typeForm, setTypeForm] = useState(type);
  const [data, setData] = useState({
    branch_id: "",
    sender_city: "1",
    sender_neighborhood: "1",
    sender_address: "dir",
    recipient_city: "1",
    recipient_neighborhood: "1",
    recipient_address: "dird",
    package_detail: [
      {
        type: "Box",
        package_number: "LU28R550UQNXZA",
        description: "Monitor 4K UHD",
        weight: 4,
        quantity: 1,
        Price: 1364049,
        dimensions: {
          length: 2,
          width: 10,
          height: 22,
        },
      },
    ],
  });

  const navigate = useNavigate();

  const index = async () => {
    if (type === "get" && id !== null) {
      setTypeForm("put");
    }
    if (id !== null) {
      setBtn("Modificar");
      setTitle("Modificar guía");
    }
  };

  useEffect(() => {
    index();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handlePackageChange = (index, e) => {
    const { name, value } = e.target;
    const updatedPackages = [...data.package_detail];
    updatedPackages[index] = { ...updatedPackages[index], [name]: value };
    setData((prevData) => ({
      ...prevData,
      package_detail: updatedPackages,
    }));
  };

  const addPackage = () => {
    setData((prevData) => ({
      ...prevData,
      package_detail: [
        ...prevData.package_detail,
        {
          type: "",
          package_number: "",
          description: "",
          weight: "",
          quantity: "",
          Price: "",
          dimensions: { length: "", width: "", height: "" },
        },
      ],
    }));
  };

  const removePackage = (index) => {
    setData((prevData) => ({
      ...prevData,
      package_detail: prevData.package_detail.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let message;
    if (typeForm === "put") {
      message = await Waybills.put(id, data, token);
    } else {
      message = await Waybills.set(data, token);
    }

    if ("id" in message) {
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text:
          typeForm === "put"
            ? "Guía actualizada exitosamente"
            : "Guía creada exitosamente",
      }).then(() => {
        navigate("/users");
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

  return (
    <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">{title}</h5>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="mb-5">
          <label
            htmlFor="branch_id"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Branch ID
          </label>
          <input
            type="text"
            id="branch_id"
            value={data.branch_id}
            onChange={handleChange}
            className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
            required
          />
        </div>

        <h6 className="text-lg font-bold mb-4">Información del remitente</h6>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="mb-5">
            <label
              htmlFor="sender_city"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Ciudad del remitente
            </label>
            <select
              id="sender_city"
              value={data.sender_city}
              onChange={handleChange}
              className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
            >
              <option value="1">Ciudad 1</option>
              <option value="2">Ciudad 2</option>
              <option value="3">Ciudad 3</option>
            </select>
          </div>
          <div className="mb-5">
            <label
              htmlFor="sender_neighborhood"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Barrio del remitente
            </label>
            <select
              id="sender_neighborhood"
              value={data.sender_neighborhood}
              onChange={handleChange}
              className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
            >
              <option value="1">Barrio 1</option>
              <option value="2">Barrio 2</option>
              <option value="3">Barrio 3</option>
            </select>
          </div>
          <div className="mb-5">
            <label
              htmlFor="sender_address"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Dirección del remitente
            </label>
            <input
              type="text"
              id="sender_address"
              value={data.sender_address}
              onChange={handleChange}
              placeholder="Dirección"
              className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
            />
          </div>
        </div>

        <h6 className="text-lg font-bold mb-4">Información del destinatario</h6>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="mb-5">
            <label
              htmlFor="recipient_city"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Ciudad del destinatario
            </label>
            <select
              id="recipient_city"
              value={data.recipient_city}
              onChange={handleChange}
              className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
            >
              <option value="1">Ciudad 1</option>
              <option value="2">Ciudad 2</option>
              <option value="3">Ciudad 3</option>
            </select>
          </div>
          <div className="mb-5">
            <label
              htmlFor="recipient_neighborhood"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Barrio del destinatario
            </label>
            <select
              id="recipient_neighborhood"
              value={data.recipient_neighborhood}
              onChange={handleChange}
              className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
            >
              <option value="1">Barrio 1</option>
              <option value="2">Barrio 2</option>
              <option value="3">Barrio 3</option>
            </select>
          </div>
          <div className="mb-5">
            <label
              htmlFor="recipient_address"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Dirección del destinatario
            </label>
            <input
              type="text"
              id="recipient_address"
              value={data.recipient_address}
              onChange={handleChange}
              placeholder="Dirección"
              className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
            />
          </div>
        </div>

        <h6 className="text-lg font-bold mb-4">Paquetes</h6>
        {data.package_detail.map((pkg, index) => (
          <div key={index} className="mb-6 p-5 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h6 className="text-xl font-medium text-gray-800">Paquete {index + 1}</h6>
              <button
                type="button"
                onClick={() => removePackage(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Icon path={mdiDelete} size={1} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="mb-5">
                <label
                  htmlFor={`type-${index}`}
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Tipo
                </label>
                <input
                  type="text"
                  name="type"
                  id={`type-${index}`}
                  value={pkg.type}
                  onChange={(e) => handlePackageChange(index, e)}
                  className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                />
              </div>
              <div className="mb-5">
                <label
                  htmlFor={`package_number-${index}`}
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Número de paquete
                </label>
                <input
                  type="text"
                  name="package_number"
                  id={`package_number-${index}`}
                  value={pkg.package_number}
                  onChange={(e) => handlePackageChange(index, e)}
                  className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="mb-5">
                <label
                  htmlFor={`description-${index}`}
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Descripción
                </label>
                <input
                  type="text"
                  name="description"
                  id={`description-${index}`}
                  value={pkg.description}
                  onChange={(e) => handlePackageChange(index, e)}
                  className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                />
              </div>
              <div className="mb-5">
                <label
                  htmlFor={`weight-${index}`}
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Peso
                </label>
                <input
                  type="number"
                  name="weight"
                  id={`weight-${index}`}
                  value={pkg.weight}
                  onChange={(e) => handlePackageChange(index, e)}
                  className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="mb-5">
                <label
                  htmlFor={`length-${index}`}
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Largo
                </label>
                <input
                  type="number"
                  name="dimensions.length"
                  id={`length-${index}`}
                  value={pkg.dimensions.length}
                  onChange={(e) => handlePackageChange(index, e)}
                  className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                />
              </div>
              <div className="mb-5">
                <label
                  htmlFor={`width-${index}`}
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Ancho
                </label>
                <input
                  type="number"
                  name="dimensions.width"
                  id={`width-${index}`}
                  value={pkg.dimensions.width}
                  onChange={(e) => handlePackageChange(index, e)}
                  className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                />
              </div>
              <div className="mb-5">
                <label
                  htmlFor={`height-${index}`}
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Alto
                </label>
                <input
                  type="number"
                  name="dimensions.height"
                  id={`height-${index}`}
                  value={pkg.dimensions.height}
                  onChange={(e) => handlePackageChange(index, e)}
                  className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                />
              </div>
            </div>

            <div className="mb-5">
              <label
                htmlFor={`price-${index}`}
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Precio
              </label>
              <input
                type="number"
                name="Price"
                id={`price-${index}`}
                value={pkg.Price}
                onChange={(e) => handlePackageChange(index, e)}
                className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
              />
            </div>
          </div>
        ))}
        
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={addPackage}
            className="flex items-center text-blue-600 font-medium"
          >
            <Icon path={mdiPlusCircle} size={1} />
            <span className="ml-2">Agregar paquete</span>
          </button>
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {btn}
          </button>
        </div>
      </form>
    </div>
  );
}

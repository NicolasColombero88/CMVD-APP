import React, { useState,useEffect } from "react";
import SelectNeighborhood from './SelectNeighborhood';
import { Branches } from '@/modules/branches/infrastructure/branchesService';
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Swal from 'sweetalert2';
export default function FormBranch({ type = "get",set = null,idTemp="" }) {
  const [loading, setLoading] = useState(false);
  const token = useSelector((state) => state.auth.token);
  const [title, setTitle] = useState("Crear Dirección Retiro");
  const [btn, setBtn] = useState("Crear");
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({
    id:"",
    name: "",
    address: {
      state: "",
      city: "Montevideo",
      neighborhood: "",
      street: "",
      postcode: "",
    },
  });
  const handleChange = (e) => {
    const { id, value } = e.target;

    if (id.includes(".")) {
      const keys = id.split(".");
      setData((prevData) => ({
        ...prevData,
        [keys[0]]: {
          ...prevData[keys[0]],
          [keys[1]]: value,
        },
      }));
    } else {
      setData((prevData) => ({
        ...prevData,
        [id]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    let message;
    if (type=== "put") {
      message = await Branches.put(id,data, token);
    } else {
      if(idTemp!=""){
        data.id=idTemp;
      }
      message = await Branches.set(data, token);
    }
    if ("id" in message) {
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: type === "put" ? 'Dirección retiro actualizada exitosamente' : 'Dirección retiro creada exitosamente',
      }).then(() => {
        if(set!=null){
          set();
        }else{
          navigate('/branches');
        }
      });
    } else {
      Swal.fire({
        icon: 'error',
        title:message.error ,
        text: message.mensaje,
      });
    }
  
    setLoading(false);
  };
  
  const index = async () => {
    if ((id != null || type=="put") &&  idTemp=="") {
      const dranches = await Branches.getById(id, token);
      setData(dranches.data);
    }
    if ( type=="put") {
      setBtn("Modificar");
      setTitle("Modificar dirección retiro");
      
    }
    if ( type=="get") {
      setBtn("");
      setTitle("Informacion de dirección retiro");
      
    }
  };
  useEffect(() => {
    index();
  }, []);
  return (
    <div className="block max-w-3xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">{title}</h5>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/2 px-2">
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
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
              disabled={type=="get"}
            />
          </div>

          <div className="w-full md:w-1/2 px-2">
            <label htmlFor="address.city" className="block mb-2 text-sm font-medium text-gray-700">
              Ciudad
            </label>
            <select
              id="address.city"
              value={data.address.city}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={type=="get"}
            >
              <option value="Canelones">Canelones</option>
              <option value="Montevideo">Montevideo</option>
            </select>
          </div>

          <div className="w-full md:w-1/2 px-2">
            <SelectNeighborhood
              type=""
              city={data.address.city}
              value={data.address.neighborhood}
              set={(value) => {
                setData((prevData) => ({
                  ...prevData,
                  address: {
                    ...prevData.address,
                    neighborhood: value,
                  },
                }));
              }}
              disabled={type=="get"}
            />
          </div>

          <div className="w-full md:w-1/2 px-2">
            <label htmlFor="address.street" className="block mb-2 text-sm font-medium text-gray-700">
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
              disabled={type=="get"}
            />
          </div>
        </div>
        <div className="mt-4">
        {type!="get" &&
          <button
          type="submit"
          className="px-6 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {btn}
        </button>
        }    
        </div>
      </form>
    </div>
  );
}

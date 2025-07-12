import React, { useState,useEffect } from 'react';
import { Users } from '@/modules/users/infrastructure/usersService';
import { useNavigate,useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';

export default function FormUser({type="get"}) {
  const [loading, setLoading] = useState(false);
  const token = useSelector((state) => state.auth.token);
  const { id } = useParams();
  const [title, setTitle] = useState("Crear Usuario");
  const [btn, setBtn] = useState("Crear");
  const [typeForm, setTypeForm] = useState(type);
  const [data, setData] = useState({
    name: "",
    email: "",
    role: "Admin",
    password: "",
    confirm_password: "",
    status: "activo",
  });
  const index = async () => {
    if (type=="post"){
      setBtn("Crear");
      setTitle("Crear Usuario");
    }
    if (type == "put") {
      setBtn("Modificar");
      setTitle("Modificar Usuario");
    }
    if (type == "get") {
      setBtn("");
      setTitle("Informacion de Usuario");
     
    }
    if(id!=null){
      const resp = await  Users.getById(id,token);
      setData(resp.data);
    }
    
  
  }
  useEffect(() => {
   
    index();
  }, []);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    let message;
    if (typeForm === "put") {
      message = await Users.put(id,data, token);
    } else {
      message = await Users.set(data, token);
    }
  
    if ("id" in message) {
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: typeForm === "put" ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente',
      }).then(() => {
        navigate('/users');
      });
    } else {
      console.log("message===",message);
      Swal.fire({
        icon: 'error',
        title:message.error ,
        text: message.mensaje,
      });
    }
  
    setLoading(false);
  };
  

  return (
    <div className="block max-w-2xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">{title}</h5>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="flex flex-wrap mb-5">
          <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              id="name"
              value={data.name}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nombre completo"
              required
              disabled={type=="get"}
            />
          </div>
          <div className="w-full md:w-1/2 pl-2">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={data.email}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="name@example.com"
              required
              disabled={type=="get"}
            />
          </div>
        </div>
        <div className="flex flex-wrap mb-5">
          <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
            <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-700">Rol</label>
            <select
              id="role"
              disabled={type=="get"}
              value={data.role}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="Super Admin">Administrador</option>
              <option value="Cadete">Cadete</option>
              <option value="Cliente">Cliente</option>
            </select>
          </div>
          <div className="w-full md:w-1/2 pl-2">
            <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-700">Estado</label>
            <select
              id="status"
              disabled={type=="get"}
              value={data.status}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
        {type=="post" &&
          <div className="flex flex-wrap mb-5">
            <div className="w-full md:w-1/2 pr-2 mb-4 md:mb-0">
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password"
                id="password"
                value={data.password}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div className="w-full md:w-1/2 pl-2">
              <label htmlFor="confirm_password" className="block mb-2 text-sm font-medium text-gray-700">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirm_password"
                value={data.confirm_password}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>
        }
        {(type=="post" || type=="put") &&
          <button
          type="submit"
          className="text-white bg-blue-600 font-medium rounded-lg text-base px-6 py-3 w-full"
          >
            {btn}
          </button>
        }
      </form>
    </div>
  );
}

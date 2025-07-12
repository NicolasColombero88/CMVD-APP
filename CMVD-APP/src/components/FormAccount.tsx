import React, { useState, useEffect } from 'react';
import { Users } from '@/modules/users/infrastructure/usersService';
import { Companies } from "@/modules/companies/infrastructure/companiesService";
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';

export default function FormAccount() {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [company, setCompany] = useState({id:"",name:""});
  const [passwordData, setPasswordData] = useState({
    password: '',
    current_password:'',
    confirm_password: '',
  });
  const token = useSelector((state) => state.auth.token);
  const id = useSelector((state) => state.auth.id);
  const [data, setData] = useState({
    name: "",
    email: "",
    phone:"",
    role: "Admin",
    company_name:"",
    status: "activo",
  });

  const index = async () => {
    const resp = await Users.getById(id, token);
    let datatemp=resp.data;
    if(datatemp.role=="Cliente" && datatemp.companyId!=""){
        let  companyData = await Companies.search('', token);
        companyData=companyData.data[0];
        datatemp.company_name=companyData.name;
    }
    setData(datatemp);
  };

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

  const handlePasswordChange = (e) => {
    const { id, value } = e.target;
    setPasswordData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let update=await Users.account( data, token);
    if(typeof update.id!="undefined"){
        Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: "Cuenta actulizada" ,
          }).then(() => {
            navigate("/waybills");
        });
    }else{
        Swal.fire({
            icon: "error",
            title: update.error,
            text:update.mensaje ,
        });
    }
   
    setLoading(false);
  };

  const handlePasswordSubmit = async () => {
    if (passwordData.password == passwordData.current_password) {
      Swal.fire('Error', 'Las contraseña debe ser distinta', 'error');
      return;
    }
    if (passwordData.password !== passwordData.confirm_password) {
        Swal.fire('Error', 'Las contraseñas no coinciden con la de confirmacion', 'error');
        return;
    }
    setLoading(true);
    const newPasword = await Users.password(passwordData, token);
    if(typeof newPasword.error!="undefined"){
        Swal.fire({
            icon: "error",
            title: newPasword.error,
            text:newPasword.mensaje ,
          });
    }else{
        Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: "Contraseña actulizada" ,
          }).then(() => {
            navigate("/waybills");
          });
    }
    setLoading(false);
  };

  return (
    <div className="block max-w-2xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">Perfil</h5>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              id="name"
              value={data.name}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nombre completo"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={data.email}
              onChange={handleChange}
              className="block w-full py-2 pl-3 pr-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-700">Rol</label>
            <input
              type="text"
              id="role"
              value={data.role}
              className="mb-6 py-2 pl-3 pr-1  bg-gray-50 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  cursor-not-allowed dark:bg-gray-200 dark:border-gray-400 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              disabled
              placeholder="Rol"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-700">Estado</label>
            <input
              type="text"
              id="status"
              value={data.status}
              onChange={handleChange}
              className="mb-6 py-2 pl-3 pr-1  bg-gray-50 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  cursor-not-allowed dark:bg-gray-200 dark:border-gray-400 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              disabled
              placeholder="Estado"
            />
          </div>
            <div className="mb-4">
                <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-700">Telefono</label>
                <input
                type="text"
                id="phone"
                value={data.phone}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Telefono"
                required
                />
            </div>
          {data.role=="Cliente" && 
            <>
            <div className="mb-4">
                <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-700">Nombre de empresa</label>
                <input
                type="text"
                id="status"
                value={data.company_name}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Estado"
                required
                />
            </div>
            </>

          }
        </div>
        <button
          type="submit"
          className="text-white bg-blue-600 font-medium rounded-lg text-base px-6 py-3 w-full mb-4"
        >
          Actualizar
        </button>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-white bg-gray-600 font-medium rounded-lg text-base px-6 py-3 w-full"
        >
          Cambiar Contraseña
        </button>
      </form>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="mb-4 text-xl font-bold">Cambiar Contraseña</h3>
            <div className="mb-4">
              <label htmlFor="current_password" className="block mb-2 text-sm font-medium">Contraseña actual</label>
              <input
                type="password"
                id="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                className="block w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block mb-2 text-sm font-medium">Nueva Contraseña</label>
              <input
                type="password"
                id="password"
                value={passwordData.password}
                onChange={handlePasswordChange}
                className="block w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="confirm_password" className="block mb-2 text-sm font-medium">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                className="block w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

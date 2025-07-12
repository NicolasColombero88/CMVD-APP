import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import { useSelector } from 'react-redux';
import { Pagination, Users } from '../infrastructure/usersService';
import { useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiEye, mdiPencil, mdiDelete } from '@mdi/js';
import ButtonAlert from '@/components/ButtonAlert';
export default function UsersPage() {
  const role = useSelector((state) => state.auth.role);
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const token = useSelector((state) => state.auth.token);
  const [search, setSearch] = useState("");

  const index = async (pag=1,search="") => {
    const response = await Pagination(pag, 10, search, token);
    setData(response.data);
    setTotalPages(response.total_pages);
  }
  const seacrh = async (value,filter={}) => {
    index(1,value);
    setSearch(value);
  }
  const pagination = async (pag=1) => {
    setCurrentPage(pag);
    index(pag,search);
  }
  useEffect(() => {
    index();
  }, []);

  const handleDelete = async (id) => {
    try {
      await Users.delete(id, token);
      await index(currentPage,search);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    }
  };

  const columns = ['name', 'email','role', 'status', 'created_at'];
  const titles = ['Nombre', 'Email','Rol', 'Estado', 'Fecha de Registro'];

  const handleAction = (row) => (
    <>
      <button
        type="button"
         title="Ver"
        onClick={() => navigate(`/users/view/${row.id}`)}
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-2 py-2  me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
      >
        <Icon path={mdiEye} size={1} />
      </button>
      <button
        type="button"
        title="Editar"
        onClick={() => navigate(`/users/edit/${row.id}`)}
        className="text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-2 py-2  me-2 mb-2 dark:bg-yellow-500 dark:hover:bg-yellow-600 focus:outline-none dark:focus:ring-yellow-700"
      >
        <Icon path={mdiPencil} size={1} />
      </button>
      {(role == "Super Admin") && (
        <ButtonAlert 
            title="¿Estás seguro de eliminar el usuario?" 
            body="Esta acción no se puede deshacer y eliminará información asociada a este." 
            type="delete" 
            set={() => handleDelete(row.id)}
          />
        )}
    </>
  );

  return (
    <Layout>
      <Table
        titles={titles}
        columns={columns}
        data={data}
        pag={currentPage}
        totalPag={totalPages}
        onPageChange={(page) => pagination(page)}
        searchPag={seacrh}
        searchPlaceholder = "Nombre,Correo"
        action={handleAction}
        create="/users/create"
      />
    </Layout>
  );
}

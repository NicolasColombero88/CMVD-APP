import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import { useSelector } from 'react-redux';
import { Pagination,Branches } from '../infrastructure/branchesService';
import { useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiEye, mdiPencil, mdiDelete } from '@mdi/js';
import Swal from 'sweetalert2';
export default function UsersPage() {
  const role = useSelector((state) => state.auth.role);
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const token = useSelector((state) => state.auth.token);

  const fetchUsers = async (page = 1) => {
    try {
      const response = await Pagination(page, 10, "", token);
      setData(response.data);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error("Error al obtener zonas:", error);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const handleDelete = async (id) => {
    let deleteTemp=await Branches.delete(id, token);
    if(typeof deleteTemp.error=="undefined"){
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text:'Borrado exitosamente',
      });
    }else{
      Swal.fire({
        icon: 'error',
        title:deleteTemp.error ,
        text: deleteTemp.mensaje,
      });
    }
    await fetchUsers(currentPage); 
   
  };
  const columns = ['name', 'address.city', 'address.neighborhood','address.street'];
  const titles = ['Nombre', 'Ciudad', 'Barrio','Direccion'];

  const handleAction = (row) => (
    <>
      <button
        type="button"
        title="Ver"
        onClick={() => navigate(`/branches/view/${row.id}`)}
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-2 py-2  me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
      >
        <Icon path={mdiEye} size={1} />
      </button>
   
      <button
      type="button"
      title="Editar"
      onClick={() => navigate(`/branches/edit/${row.id}`)}
      className="text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-2 py-2  me-2 mb-2 dark:bg-yellow-500 dark:hover:bg-yellow-600 focus:outline-none dark:focus:ring-yellow-700"
      >
      <Icon path={mdiPencil} size={1} />
      </button>
   
      <button
        type="button"
        title="Eliminar"
        onClick={() => handleDelete(row.id)}
        className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800"
      >
        <Icon path={mdiDelete} size={1}  />
      </button>
    
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
        onPageChange={(page) => setCurrentPage(page)}
        action={handleAction}
        create="/branches/create"
      />
    </Layout>
  );
}

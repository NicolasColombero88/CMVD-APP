
import React, { useState,useEffect } from 'react';
import  Layout from '@/components/Layout';
import  Table from '@/components/Table';
import {useSelector} from 'react-redux';
import { Pagination,Companies } from '../infrastructure/companiesService';
import Icon from '@mdi/react';
import { mdiEye, mdiPencil, mdiDelete } from '@mdi/js';
import { useNavigate } from 'react-router-dom';
import ButtonAlert from '@/components/ButtonAlert';
export default function users() {
  const role = useSelector((state) => state.auth.role);
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const token = useSelector((state) => state.auth.token);
  const [search, setSearch] = useState("");
  const index = async (pag=1,search="") => {
    let users=await Pagination(pag,10,search,token);
    setData(users.data);
    setTotalPages(users.total_pages);
  }
  const seacrh = async (value,filter={}) => {
    index(1,value);
    setSearch(value);
  }
  const pagination = async (pag=1) => {
    setCurrentPage(pag);
    index(pag,search);
  }
  const handleDelete = async (id) => {
    try {
      await Companies.delete(id, token);
      await pagination();
      
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    }
  };
  useEffect(() => {
    index();
  }, []);
  const columns = ['name', 'email', 'status', 'created_at'];
  const titles = ['Nombre', 'Email', 'Estado', 'Fecha de Registro'];
  const handleAction = (row) => (
    <>
      <button
        type="button"
        title="Ver"
        onClick={() => navigate(`/companies/view/${row.id}`)}
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-2 py-2  me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
      >
        <Icon path={mdiEye} size={1} />
      </button>
      <button
        type="button"
        title="Editar"
        onClick={() => navigate(`/companies/edit/${row.id}`)}
        className="text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-2 py-2  me-2 mb-2 dark:bg-yellow-500 dark:hover:bg-yellow-600 focus:outline-none dark:focus:ring-yellow-700"
      >
        <Icon path={mdiPencil} size={1} />
      </button>
       {(role == "Super Admin") && (
       <ButtonAlert 
          title="¿Estás seguro de eliminar esta Empresa?" 
          body="Esta acción no se puede deshacer y eliminará información asociada a esta." 
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
        action={handleAction}
        searchPag={seacrh}
        searchPlaceholder = "Nombre, nombre de la empresa o dirección"
        create="/companies/create"
      />
      
    </Layout>
  );
}

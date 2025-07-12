import React, { useState, useEffect } from 'react';
interface Filter {
  cadete_id: string;
  sender_city: string;
  sender_neighborhood: string;
  receiver_city: string;
  receiver_neighborhood: string;
  status: string;
  created_at: string;
  pickup_datetime: string;
}
import * as XLSX from "xlsx";
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import ModalSelect from '@/components/ModalSelect';
import SelectCadete from '@/components/SelectCadete';
import { useSelector } from 'react-redux';
import { Pagination, Waybills } from '../infrastructure/waybillsService';
import { useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import {mdiCash, mdiEye, mdiPencil, mdiDelete,mdiDownload,mdiTruckDeliveryOutline,mdiPackageVariant,mdiPackageVariantClosedCheck } from '@mdi/js';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import {Users } from '@/modules/users/infrastructure/usersService';
export default function UsersPage() {
  const role = useSelector((state) => state.auth.role);
  const user_id = useSelector((state) => state.auth.id);
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [createUrl, setCreateUrl] = useState("/waybills/create");
  const [filter, setFilter] = useState<Filter>({
    cadete_id: "",
    sender_city: "",
    sender_neighborhood: "",
    receiver_city: "",
    receiver_neighborhood: "",
    status: "",
    created_at: "",
    pickup_datetime: ""
  });  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const token = useSelector((state) => state.auth.token);
  const [search, setSearch] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectArray,setSelectArray]=useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectCadeteTemp,setSelectCadete]=useState({id:"",name:""});
  const [selectWaybill,setSelectWaybill]=useState("");
  // Función para formatear fecha y hora
  const formatDateTime = (date, hour) => {
    if (!date) return "";
    const d = new Date(date);
    const formattedDate = d.toLocaleDateString('es-AR');
    return hour ? `${formattedDate} ${hour}` : formattedDate;
  };
  // Obtiene datos y añade teléfono destinatario y fecha de entrega
  const fetchUsers = async (page = 1, searchText = "", filterTemp = {}) => {
  try {
    const filterP: any = {};
    const activeFilter = Object.keys(filterTemp).length > 0 ? filterTemp : filter;

    // ✨ Usar fechas en formato ISO
    if (activeFilter.created_at) {
      const date = new Date(activeFilter.created_at);
      filterP.after  = date.toISOString().split("T")[0] + "T00:00:00Z";
      filterP.before = date.toISOString().split("T")[0] + "T23:59:59Z";
    }

    if (activeFilter.pickup_datetime) {
      const date = new Date(activeFilter.pickup_datetime);
      filterP.delivery_after  = date.toISOString().split("T")[0] + "T00:00:00Z";
      filterP.delivery_before = date.toISOString().split("T")[0] + "T23:59:59Z";
    }

    // Resto de filtros
    Object.entries(activeFilter).forEach(([key, val]) => {
      if (val !== "" && key !== "created_at" && key !== "pickup_datetime") {
        filterP[key] = val;
      }
    });

    const response = await Pagination(page, 10, searchText, token, filterP);
    setData(response.data.map(item => ({
      ...item,
      receiver_phone: item.receiver?.phone || '',
      delivery_datetime: formatDateTime(item.delivery_date, item.delivery_hour),
    })));
    setTotalPages(response.total_pages);
  } catch (error) {
    console.error("Error al obtener zonas:", error);
  }
};



  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);
  useEffect(() => {
    if(role=="Cadete"){
      setCreateUrl("");
    }
    handleSearch("");
  }, []);

  const handleDelete = async (id) => {
    try {
      await Waybills.delete(id, token);
      await fetchUsers(currentPage);
      
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    }
  };
  const selectCadete = async (id) => {
    try {
      setSelectWaybill(id);
      setModalVisible(true);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    }
  };
  /*const confirmPackagePickup = async (id) => {
    try {
      let data = {
        status: "Recogido",
        location: "",
      };
  
      const result = await Swal.fire({
        title: '¿Recibiste el paquete?',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'Cancelar',
        icon: 'question',
      });
  
      if (result.isConfirmed) {
        Swal.fire({
          title: '',
          text: 'Cargando...',
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
  
        const historySet = await Waybills.historySet(id, data, token);
  
        if (historySet && typeof historySet.id !== "undefined") {
          pagination(1);
          Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: "Se cambió el estado del envío.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar el estado del envío.",
          });
        }
      } else if (result.isDismissed) {
        console.log('El paquete no fue recibido.');
      }
    } catch (error) {
      console.error("Error al cambiar el estado del paquete:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un problema al procesar la solicitud.",
      });
    }
  };*/
  const confirmPackageDelivery = async (id) => {
    try {
      let data = {
        status: "Entregado",
        location: "",
      };
      const result = await Swal.fire({
        title: 'Paquete entregado?',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'Cancelar',
        icon: 'question',
      });
      if (result.isConfirmed) {
        Swal.fire({
          title: '',
          text: 'Cargando...',
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        const historySet = await Waybills.historySet(id, data, token);
        if (historySet && typeof historySet.id !== "undefined") {
          pagination(1);
          Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: "Se cambió el estado del envío.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar el estado del envío.",
          });
        }
      } else if (result.isDismissed) {
        console.log('El paquete no fue recibido.');
      }
    } catch (error) {
      console.error("Error al cambiar el estado del paquete:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un problema al procesar la solicitud.",
      });
    }
  };
  const confirmPayment = async (id, who_pays) => {
    try {
      let data = {
        payment_status: "Pagado",
        payment_reference: role+"-"+user_id,
        payment_method: "Efectivo",
      };
  
      const result = await Swal.fire({
        title: "¿Confirma que recibió el pago?",
        text: who_pays + " realizó el pago. Por favor, confirme.",
        showCancelButton: true,
        confirmButtonText: "Sí, confirmar",
        cancelButtonText: "Cancelar",
        icon: "question",
      });
  
      if (result.isConfirmed) {
        Swal.fire({
          title: "",
          text: "Cargando...",
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
  
        const historySet = await Waybills.payment(id, data, token);
        console.log("===******====", historySet);
  
        if (historySet && typeof historySet.id !== "undefined") {
          pagination(1);
          Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: "El estado del pago se cambió correctamente.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar el estado del pago.",
          });
        }
      } else if (result.isDismissed) {
        console.log("La confirmación del pago fue cancelada.");
      }
    } catch (error) {
      console.error("Error al cambiar el estado del pago:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un problema al procesar la solicitud.",
      });
    }
  };
  // Confirmación de cancelación (usada por clientes)
const confirmCancel = async (id) => {
  const result = await Swal.fire({
    title: '¿Estás seguro de cancelar esta guía?',
    text: 'No podrás revertir esta acción.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, cancelar',
    cancelButtonText: 'No',
  });
  if (result.isConfirmed) {
    Swal.fire({
      title: '',
      text: 'Cancelando...',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    await handleDelete(id)
    Swal.fire('¡Guía cancelada!', '', 'success');
    pagination(1);
  }
};

  
  const searchHandler = async (value, filter = {}) => {
    fetchUsers(1, value);
    setSearch(value);
  };
  const pagination = async (pag = 1,filterTem={}) => {
    setCurrentPage(pag);
    fetchUsers(pag, search,filterTem);
  };
  const downloadExcel = async () => {
    let data = await Waybills.exel(search,filter,token);
  };
  const filterSave = async () => {
    pagination(1);
    setIsFilterModalOpen(false);
  };
  const setSelectUserTemp = async(value) => {
    Swal.fire({
      title: '',
      text: 'Cargando...',
      button: false,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: false,
      timer: 5000,
      timerProgressBar: true,
          didOpen: () => {
              Swal.showLoading()
          },
    });
    setSelectCadete(value);
    let data={cadete_id:value.id};
    let cadeteTemp = await Waybills.cadeteSet(selectWaybill,data,token);
    if(typeof cadeteTemp.id!="undefined"){
      Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: "Se asignó el cadete al envio" ,
      }).then(() => {
        pagination(1); 
      });
    }else{
      Swal.fire({
          icon: "error",
          title: cadeteTemp.error,
          text:cadeteTemp.mensaje ,
      });
    }
  };
  const handleSearch = async (text) => {
    let selectArryTemp=await Users.getCadetes(text,token);
    setSelectArray(selectArryTemp.data);
  };
  const columns = ['company_name', 'sender_address', 'receiver_address', 'receiver_phone','status', 'shipping_cost', 'pickup_datetime', 'delivery_datetime' ];
  const titles = ['Empresa', 'Direccion de origen', 'Direccion de destino','Teléfono destinatario',  'Estado', 'Precio', 'Fecha recogida', 'Fecha de entrega'];

  const handleFilterChange = (key, value) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  const filterObject = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      <div className="w-full">
        <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-700">Estado</label>
        <select id="status" value={filter.status} onChange={(e) => handleFilterChange("status", e.target.value)} className="block w-full py-2 pl-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">Todos los estados</option>
          <option value="Procesando">Procesando</option>
          <option value="Aceptado">Aceptado</option>
          <option value="Recogido">Recogido</option>
          <option value="Entregado">Entregado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>
      <div className="w-full">
        <SelectCadete
            token={token}
            value={filter.cadete_id}
            set={(value) => {
              handleFilterChange("cadete_id",value)
            }}
        />
      </div>
      <div className="w-full">
        <label htmlFor="created_at" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Recogida</label>
        <input type="date" id="created_at" value={filter.created_at} onChange={(e) => handleFilterChange("created_at", e.target.value)} className="block w-full py-2 pl-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
      <div className="w-full">
        <label htmlFor="pickup_datetime" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
        <input type="date" id="pickup_datetime" value={filter.pickup_datetime} onChange={(e) => handleFilterChange("pickup_datetime", e.target.value)} className="block w-full py-2 pl-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
    </div>
  );
  const handleFilterRemoval = async(key) => {
    const updatedFilter = { ...filter, [key]: "" };
    setFilter(updatedFilter);
    pagination(1,updatedFilter);
  };

  const handleAction = (row) => (
    <>
      <button type="button"  title="Ver informacion" onClick={() => navigate(`/waybills/view/${row.id}`)} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-2 py-2  me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
        <Icon path={mdiEye} size={1} />
      </button>
      {(((role == "Super Admin" || role == "Cliente" || role == "Admin") && row.status=="Procesando" )) && 
        <button type="button"  title="Editar" onClick={() => navigate(`/waybills/edit/${row.id}`)} className="text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-2 py-2  me-2 mb-2 dark:bg-yellow-500 dark:hover:bg-yellow-600 focus:outline-none dark:focus:ring-yellow-700">
          <Icon path={mdiPencil} size={1} />
        </button>
      }
      {(role == "Super Admin" || role === "Cliente" || role === "Admin" && (!row.cadete_id || row.cadete_id === "000000000000000000000000")) && row.status === "Procesando" && (
        <button type="button"  title="Eliminar" onClick={() => confirmCancel(row.id)} className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800">
          <Icon path={mdiDelete} size={1} />
        </button>
      )}

      {/* Asignar Cadete (solo super admin) hasta que esté Pagado o Entregado */}
    {(role == "Super Admin" || role == "Admin")
      && row.status !== "Entregado"
      && row.payment_status !== "Pagado" && (
      <button
        type="button"
        title="Selecciona cadete"
        onClick={() => selectCadete(row.id)}
        className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
      >
        <Icon path={mdiTruckDeliveryOutline} size={1} />
      </button>
    )}
      
      {/*
      {role == "Cadete" && row.status=="Aceptado"  && (
        <button  type="button" title="Confirmar recogida"  onClick={() => confirmPackagePickup(row.id)} className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
        >
         <Icon path={mdiPackageVariant} size={1} />
        </button>
      )}
      */}

      {/*SE cambió row.status=="Recogido" por row.status=="Aceptado" */}
      {role == "Cadete" && row.status=="Aceptado" && (
        <button  type="button" title="Confirmar entrega" onClick={() => confirmPackageDelivery(row.id)} className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
        >
         <Icon path={mdiPackageVariantClosedCheck} size={1} />
        </button>
      )}
      {(role == "Cadete" || role == "Super Admin"  || role == "Admin") && row.payment_status!="Pagado"  && (
        <button  type="button" title="Confirmar pago"  onClick={() => confirmPayment(row.id,row.who_pays)} className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
        >
        <Icon path={mdiCash} size={1} />
        </button>
      )}
    </>
  );
  //  {key.replace("_", " ").toUpperCase()}:
  const filterDisplay = Object.keys(filter).map((key) => {
    if (filter[key]) {
      return (
        <span key={key} className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full mr-2 mb-2 inline-flex items-center">
          {filter[key]}
          <button onClick={() => handleFilterRemoval(key)} className="ml-2 text-red-600">x</button>
        </span>
      );
    }
    return null;
  });
  const filterBtn = (
    <div className="flex items-center">
      <button
        onClick={() => setIsFilterModalOpen(true)}
        className="text-white bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-2 py-2"
      >
        Filtrar
      </button>
      <button
        onClick={() => downloadExcel()}
        className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-2 py-1.5 ml-4"
      >
        <Icon path={mdiDownload} size={1} />
      </button>
      <div className="ml-4 flex flex-wrap">{filterDisplay}</div>
    </div>
  );
  

  const modalFilter = (
    <Modal isOpen={isFilterModalOpen} onRequestClose={() => setIsFilterModalOpen(false)} contentLabel="Filtros" className="modal-content w-full max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Filtrar datos</h2>
      {filterObject}
      <div className="flex justify-end mt-4">
        <button onClick={() => setIsFilterModalOpen(false)} className="text-white bg-gray-600 hover:bg-gray-700 font-medium rounded-lg text-sm px-4 py-2">Cerrar</button>
        <button onClick={() => filterSave()} className="ml-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-4 py-2">Aplicar filtros</button>
      </div>
    </Modal>
  );

  return (
    <Layout>
      {modalFilter}
       <ModalSelect
              visible={modalVisible}
              title="Selecciona un cadete"
              placeholder="Nombre  o email" 
              titles={['Nombre', 'Email']}
              columns={['name', 'email']}
              data={selectArray}
              set={setSelectUserTemp}
              search={handleSearch}
              setVisible={setModalVisible} 
              pag={currentPage}
              totalPag={totalPages}
      />
      <Table 
        titles={titles} 
        columns={columns} 
        data={data} 
        pag={currentPage} 
        totalPag={totalPages} 
        onPageChange={(page) => pagination(page)} 
        action={handleAction} 
        searchPag={searchHandler} 
        searchPlaceholder="Número, nombre de la empresa o dirección" 
        create={createUrl} 
        filter={filterBtn} />
    </Layout>
  );
}

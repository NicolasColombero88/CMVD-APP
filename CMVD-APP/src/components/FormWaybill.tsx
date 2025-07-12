  import React, { useState, useEffect } from "react";
  import { Waybills } from "@/modules/waybills/infrastructure/waybillsService";
  import { Companies } from "@/modules/companies/infrastructure/companiesService";
  import { Calculate } from "@/modules/calculate/infrastructure/calculateService";
  import { useNavigate, useParams } from "react-router-dom";
  import { useSelector } from "react-redux";
  import { Icon } from "@mdi/react";
  import { mdiPlusCircle, mdiDelete,mdiMagnify,mdiTruckDeliveryOutline,mdiPackageVariant,mdiPackageVariantClosedCheck,mdiCash } from "@mdi/js";
  import Swal from "sweetalert2";
  import ModalSelect from './ModalSelect';
  import SelectNeighborhood from './SelectNeighborhood';
  import ButtonStatus from './ButtonStatus';
  import SelectHours from './SelectHours';
  import SelectCadete from '@/components/SelectCadete';
  import {Users } from '@/modules/users/infrastructure/usersService';
  import DateFilter from './DateFilter';
  import DateFilterDelivery from './DateFilterDelivery';
  import SelectHoursRange from './SelectHoursRange';
  import ButtonCreateBranch from './ButtonCreateBranch';
  export default function FormWaybill({ type = "get" }) {
    const [modalBranch, setModalBranch] = useState(false);
    const role = useSelector((state) => state.auth.role);
    const user_id = useSelector((state) => state.auth.id);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectCompany,setSelectCompany]=useState({id:"",name:"",email:"",branches:[]});
    const [selectArray,setSelectArray]=useState([]);
    const token = useSelector((state) => state.auth.token);
    const { id } = useParams();
    const [title, setTitle] = useState("Crear guía");
    const [btn, setBtn] = useState("Crear");
    const [selectCadeteTemp,setSelectCadete]=useState({id:"",name:""});
    const handleClick = (event) => {
      event.preventDefault(); 
      setModalVisible(true);
    };
    const [disabled, setDisabled] = useState({
      company_name: false,
      user_name: false,
      branch_id: false,
      date: false,
      hour: false,
      price: false,
      sender_city: false,
      sender_neighborhood: false,
      sender_address: false,
      sender_phone: false,
      recipient_city: false,
      recipient_neighborhood: false,
      recipient_address: false,
      recipient_name: false,
      recipient_phone: false,
      who_pays: false,
      cadete_id:false,
      notes:false,
      payment_status:false,
      delivery_date:false
    });
    const [data, setData] = useState({
      company_name:"",
      user_name:"",
      branch_id: "",
      cadete_id:"",
      status:"",
      date:"",
      hour:"",
      price:"",
      sender_city: "Montevideo",
      sender_neighborhood: "",
      sender_address: "",
      sender_phone: "",
      recipient_city: "Montevideo",
      recipient_neighborhood: "",
      recipient_address: "",
      recipient_apartment:"",
      recipient_email:"",
      recipient_phone:"",
      recipient_name:"",
      who_pays:"Remitente",
      payment_status:"",
      created_at:"",
      notes:"",
      withdrawal_date:"",
      delivery_date:"",
      delivery_hour:"",
      package_detail: [
        {
          type: "Box",
          package_number: "",
          description: "",
          weight: 0,
          quantity: 1,
          price:0,
          dimensions: {
            length: 0,
            width: 0,
            height: 0,
          },
        },
      ],
    });
    const navigate = useNavigate();
    const index = async () => {
      if (type=="post"){
        setBtn("Crear");
        setTitle("Crear guía");
      }
      if (type == "put") {
        setBtn("Modificar");
        setTitle("Modificar guía");
      }
      if (type == "get") {
        setBtn("");
        setTitle("Informacion de guia");
        setDisabled((prevState) => 
          Object.keys(prevState).reduce((acc, key) => {
            acc[key] = true;
            return acc;
          }, {})
        );
      }
      if (type == "put" || type == "get") {
        let dataWb = await Waybills.getById(id, token);
        let pickupDatetime=dataWb.pickup_datetime.split(" ");
        let company=await Companies.getById(dataWb.company_id,token);
        if(pickupDatetime[0].split("-")[0].length==2){
           pickupDatetime[0]=pickupDatetime[0].split("-").reverse().join("-");
        }
        const formattedDate = new Date(dataWb.created_at).toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        let horTem="";
        if(pickupDatetime.length>3){
          horTem=pickupDatetime[1]+" - "+pickupDatetime[3];
        }
        let pickupDate="";
        if(typeof pickupDatetime[0]!="undefined"){
          pickupDate= pickupDatetime[0];
        }
        let dataTemp={
          company_name:dataWb.company_name,
          user_name:company.data.user_name,
          branch_id: dataWb.branch_id,
          date:pickupDate,
          hour:horTem,
          price: dataWb.shipping_cost,
          sender_city:  dataWb.sender.address.city,
          sender_neighborhood:dataWb.sender.address.neighborhood,
          sender_address:dataWb.sender.address.street,
          sender_phone: dataWb.sender.phone,      // asignación teléfono cliente
          recipient_city:dataWb.receiver.address.city,
          recipient_neighborhood: dataWb.receiver.address.neighborhood,
          recipient_address:dataWb.receiver.address.street,
          recipient_email:dataWb.receiver.email,
          recipient_phone:dataWb.receiver.phone,
          recipient_name:dataWb.receiver.name,
          package_detail:dataWb.package_details,
          status:dataWb.status,
          who_pays:dataWb.who_pays,
          cadete_id:dataWb.cadete_id,
          payment_status:dataWb.payment_status,
          notes:dataWb.notes,
          created_at:formattedDate,
          withdrawal_date:dataWb.withdrawal_date,
          delivery_date:dataWb.delivery_date,
          delivery_hour:dataWb.delivery_hour,
        }
        setSelectCompany(company.data);
        setData(dataTemp); 
      }
    };
    useEffect(() => {
      index();
    }, []);
    const setSelectNeighborhoodTemp = (value) => {
      setData((prevData) => ({
        ...prevData,
        recipient_neighborhood: value,
      }));
      setSearchZone(value);
    }
    const setSelectCompanyTemp = (value) => {
      setData((prevData) => ({
        ...prevData,
        company_name: value.name,
        user_name: value.user_name,
      }));
      setSelectCompany(value);
    };
    const setSelectHours = (value) => {
      setData((prevData) => ({
        ...prevData,
        hour: value,
      }));
     
    };
    const handleChange = (e) => {
      const { id, value } = e.target;
      if(id=="branch_id"){
        const filteredBranch = selectCompany.branches?.find((branch) => branch.id === value);
        if (filteredBranch) {
          setData((prevData) => ({
            ...prevData,
            sender_city: filteredBranch.address.city,
            sender_neighborhood: filteredBranch.address.neighborhood,
            sender_address: filteredBranch.address.street,
          }));
        }
      }
      setData((prevData) => ({
        ...prevData,
        [id]: value,
      }));
    };
    const handlePackageChange = (index, event) => {
      const { name, value } = event.target;
      const newPackageDetail = [...data.package_detail];
      value2 = value !== "" && !isNaN(value) ? Number(value) : "";
      if (name === "length" || name === "width" || name === "height") {
        newPackageDetail[index].dimensions[name] = value;
      } else {
        newPackageDetail[index][name] = value;
      }
      setData({ ...data, package_detail: newPackageDetail });
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
      if (new Date(data.delivery_date) < new Date(data.date)) {
        Swal.fire({
          icon: 'error',
          title: 'Fecha inválida',
          text: 'La fecha de entrega debe ser mayor a la fecha de recogida.',
          confirmButtonText: 'Entendido',
        });
        return;
      }
      setLoading(true);
      let dateFin="";
      if (typeof data.date === "string") {
        dateFin =  data.date.split('T')[0];
        dateFin = dateFin.split("-").reverse().join("-");
      } else if (data.date instanceof Date) {
        dateFin = [
          String(data.date.getDate()).padStart(2, "0"),
          String(data.date.getMonth() + 1).padStart(2, "0"),
          data.date.getFullYear(),
        ].join("-");
      } else {
        dateFin = "";
      }
      let horTem=data.hour;
      if(data.hour=="Sin horario"){
        horTem="";
      }
      let dataW={
        "company_id":selectCompany.id,
        "branch_id":data.branch_id ,
        "company_name": selectCompany.name,
        "pickup_datetime":dateFin +" "+horTem,
        "who_pays":data.who_pays,
        "notes":data.notes,
        "receiver": {
          "name": data.recipient_name,
          "address": {
            "city":data.recipient_city,
            "neighborhood": data.recipient_neighborhood,
            "street": data.recipient_address+","+data.recipient_apartment,
          },
          "email": data.recipient_email,
          "phone":data.recipient_phone
        },
        "package_details": data.package_detail,
        "shipping_cost": data.price,
        "status": "Aceptado",
        withdrawal_date:data.withdrawal_date,
        delivery_date:data.delivery_date,
        delivery_hour:data.delivery_hour
      };
      console.log("==000===",dataW);
     
      let message;
      if (type === "put") {
        message = await Waybills.put(id, dataW, token);
      } else {
        message = await Waybills.set(dataW, token);
      }

      if ("id" in message) {
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text:
            type === "put"
              ? "Guía actualizada exitosamente"
              : "Guía creada exitosamente",
        }).then(() => {
          navigate("/waybills");
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
    const handleSearch = async (text) => {
      let selectArryTemp=await Users.getCadetes(text,token);
      setSelectArray(selectArryTemp.data);
    };
    const setSearchZone =async (value) => {
     
      let dataC={
        "sender_city":data.sender_city,
        "sender_neighborhood": data.sender_neighborhood,
        "recipient_city": data.recipient_city,
        "recipient_neighborhood": value,
        "package_detail":data.package_detail,
        "company_id":selectCompany.id
      }
      let selectArryTemp=await Calculate.set(dataC,token);
      if (typeof selectArryTemp.price!="undefined"){
        setData((prevData) => ({
          ...prevData,
          price: selectArryTemp.price,
        }));
      }
    };
    const selectCadete = async () => {
      try {
       
        setModalVisible(true);
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
      }
    };
    const confirmPackagePickup = async () => {
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
    const confirmPackageDelivery = async () => {
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
    const confirmPayment = async () => {
        try {
          let dataPayment = {
            payment_status: "Pagado",
            payment_reference: role+"-"+user_id,
            payment_method: "Efectivo",
          };
      
          const result = await Swal.fire({
            title: "¿Confirma que recibió el pago?",
            text: data.who_pays + " realizó el pago. Por favor, confirme.",
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
      
            const historySet = await Waybills.payment(id, dataPayment, token);
            console.log("===******====", historySet);
      
            if (historySet && typeof historySet.id !== "undefined") {
              Swal.fire({
                icon: "success",
                title: "¡Éxito!",
                text: "El estado del pago se cambió correctamente.",
              });
              index();
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
        let cadeteTemp = await Waybills.cadeteSet(id,data,token);
        if(typeof cadeteTemp.id!="undefined"){
          Swal.fire({
                icon: "success",
                title: "¡Éxito!",
                text: "Se asignó el cadete al envio" ,
          }).then(() => {
            index(); 
          });
        }else{
          Swal.fire({
              icon: "error",
              title: cadeteTemp.error,
              text:cadeteTemp.mensaje ,
          });
        }
      };
    const setSelectDate = (value) => {
      setData((prevData) => ({
        ...prevData,
        withdrawal_date: value,
        date:value,
      }));
    };
    const setSelectDateDelivery = (value) => {
      setData((prevData) => ({
        ...prevData,
        delivery_date: value,
      }));
    };
    const addBranch =async () => {
        let company=await Companies.getById(selectCompany.id,token);
        setSelectCompany(company.data);
        setModalBranch(false);
    }
    const valitateBranch =async () => {
      

        setModalBranch(true);
    }
    const setSelectDeliveryHour = (value) => {
      setData((prevData) => ({
        ...prevData,
        delivery_hour: value,
      }));
    };
    return (
      <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
 <div className="flex flex-wrap items-center">
  <div className="w-full sm:w-[45%] mb-4 sm:mb-0">
    <h5 className="text-2xl font-bold tracking-tight text-gray-800 sm:text-3xl break-words">
      {title}
    </h5>
  </div>
  <ButtonCreateBranch  visible={modalBranch} setVisible={setModalBranch} set={addBranch}  idTemp={selectCompany.id}/>
  {(type === "put" || type === "get") && (
    <div className="w-full sm:w-[55%] flex flex-wrap items-center gap-2">
      <span>Fecha:{data.created_at}</span>
      {type === "put" && (
        <div className="flex flex-wrap items-center gap-2">
          {role == "Super Admin" && (
            <button
              type="button"
              title="Selecciona cadete"
              onClick={() => selectCadete()}
              className={`text-white font-medium rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-4 ${
                (data.cadete_id == "" ||data.cadete_id=="000000000000000000000000" )
                  ? "bg-green-600 hover:bg-green-700 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                  : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
              }`}
            >
              <Icon path={mdiTruckDeliveryOutline} size={1} />
            </button>
          )}
          {role == "Cadete" && data.status=="Aceptado" &&
          <button
            type="button"
            title="Confirmar recogida"
            onClick={() => confirmPackagePickup()}
            className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-3 py-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
          >
            <Icon path={mdiPackageVariant} size={1} />
          </button>
          }
          {(role == "Cadete" && data.status=="Recogido") && 
            <button
              type="button"
              title="Confirmar entrega"
              onClick={() => confirmPackageDelivery()}
              className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-3 py-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
            >
              <Icon path={mdiPackageVariantClosedCheck} size={1} />
            </button>
          }
       
          {(role == "Cadete" || role == "Super Admin"  || role == "Admin") && data.payment_status!="Pagado"  && (
          <button
            type="button"
            title="Confirmar pago"
            onClick={() => confirmPayment()}
            className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-3 py-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
          >
            <Icon path={mdiCash} size={1} />
          </button>
          )}
        </div>
      )}
    </div>
  )}
</div>
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
            />
        <form className="w-full" onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/3 px-2">
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
              Empresa 
            </label>
            {type!="post"  &&
              <input
                type="text"
                id="disabled-input"
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={data.company_name}
                required
                disabled
              />
            }
            {type=="post"  &&
            <div className="relative mt-1 bg-white sm:rounded-lg w-full border border-gray-200 rounded-[10px]">
              <input
                type="text"
                id="name"
                value={data.company_name}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Nombre de la empresa"
                onMouseDown={handleClick}
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  className="text-gray-700 text-sm font-medium flex items-center justify-center"
                  onClick={() => setModalVisible(true)}
                >
                  <Icon path={mdiMagnify} size={1} color="black" />
                </button>
              </div>
            </div>
            }
          </div>
          <div className="w-full md:w-1/3 px-2 ">
            <label
              htmlFor="sender_address"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Propietario
            </label>
            <input
              type="text"
              id="sender_address"
              value={data.user_name}
              onChange={handleChange}
              placeholder="Propietario"
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled
            />
          </div>
          <div className="w-full md:w-1/3 px-2 ">
            <label
              htmlFor="branch_id"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              <div className="flex items-center gap-2">
                Dirección retiro
                <button
                  type="button"
                  onClick={() => valitateBranch()}
                  className="rounded-full"
                >
                  <Icon path={mdiPlusCircle} size={1} color="green" />
                </button>
              </div>
            </label>
            <select
              id="branch_id"
              value={data.branch_id}
              onChange={(e) => handleChange(e)}
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={disabled.branch_id}
            >
              <option value="">Selecciona una dirección</option>
              {selectCompany.branches?.map((branche) => (
                <option key={branche.id} value={branche.id}>
                  {branche.name}
                </option>
              ))}
            </select>

          </div>
          <div className="w-full md:w-1/4 px-2 ">
            <DateFilter value={data.date} set={setSelectDate} label="Fecha de retiro"  disabled={disabled.date} />
          </div>
          <div className="w-full md:w-1/3 px-2 ">
            <SelectHoursRange  value={data.hour} set={setSelectHours}   disabled={disabled.hour} labelText="Horario de retiro (8hs - 16hs)"/>
          </div>
          <div className="w-full md:w-1/3 px-2 ">
            <label
              htmlFor="sender_address"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Precio de envio
            </label>
            <input
              type="text"
              id="price"
              value={data.price}
              placeholder="Precio de envio"
              className="mb-6 py-2 pl-3 pr-1  bg-gray-50 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  cursor-not-allowed dark:bg-gray-200 dark:border-gray-400 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              disabled={disabled.price}
            />
          </div>
          <div className="w-full md:w-1/4 px-2 ">
            <DateFilterDelivery  value={data.delivery_date}  disabled={disabled.delivery_date} set={setSelectDateDelivery} label="Fecha de entrega" />  
          </div>
          <div className="w-full md:w-1/3 px-2 ">
            <SelectHoursRange value={data.delivery_hour} set={setSelectDeliveryHour} required={true} disabled={type == "get"} labelText="Horario de entrega (9hs - 18hs)" />
          </div>
          {type!="post" &&
            <div className="w-full md:w-1/3 px-2 ">
              <SelectCadete
                  token={token}
                  value={data.cadete_id}
                  disabled={true}
                 
              />
            </div>
          }
          <div className="w-full md:w-1/3 px-2 ">
            <label htmlFor="company_email" className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="text"
              id="company_email"
              value={selectCompany.email}
              placeholder="Email"
              className="mb-6 py-2 pl-3 pr-1  bg-gray-50 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  cursor-not-allowed dark:bg-gray-200 dark:border-gray-400 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              disabled
            />
          </div>
          {type!="post" &&
          <div className="w-full md:w-1/3 px-2 ">
            <label htmlFor="sender_address" className="block mb-2 text-sm font-medium text-gray-700">
              Estado
            </label>
            <input
              type="text"
              id="status"
              value={data.status}
              placeholder="estado"
              className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled
            />
          </div>        
          }
          <div className="w-full md:w-1/3 px-2 ">
            <label htmlFor="sender_address" className="block mb-2 text-sm font-medium text-gray-700">
              Estado de pago
            </label>
            <select
                id="payment_status"
                value={data.payment_status}
                onChange={handleChange}
                disabled={disabled.payment_status}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
            </select>
          </div>
        </div>
          <h6 className="text-lg font-bold mb-4">Información del remitente</h6>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <div className="mb-3">
              <label
                htmlFor="sender_city"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Ciudad
              </label>
              <input
              type="text"
              id="sender_city"
              value={data.sender_city}
              placeholder="Ciudad "
              className="py-2 pl-3 pr-1  bg-gray-50 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  cursor-not-allowed dark:bg-gray-200 dark:border-gray-400 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              disabled
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="sender_neighborhood"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Barrio
              </label>
              <input
              type="text"
              id="sender_neighborhood"
              value={data.sender_neighborhood}
              placeholder="Barrio"
              className=" py-2 pl-3 pr-1  bg-gray-50 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  cursor-not-allowed dark:bg-gray-200 dark:border-gray-400 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              disabled
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="sender_address"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Dirección
              </label>
              <input
                type="text"
                id="sender_address"
                placeholder="Dirección"
                value={data.sender_address}
                className=" py-2 pl-3 pr-1  bg-gray-50 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  cursor-not-allowed dark:bg-gray-200 dark:border-gray-400 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                disabled
                required
              />
            </div>
            <div className="mb-3">
            <label htmlFor="sender_phone" className="block mb-2 text-sm font-medium text-gray-700">Teléfono remitente</label>
            <input type="text" id="sender_phone" value={data.sender_phone} disabled className="block w-full py-2 pl-3 pr-10 text-sm bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed" />
          </div>
          </div>

          <h6 className="text-lg font-bold mb-4">Información del destinatario</h6>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <div className="mb-3">
              <label
                htmlFor="recipient_city"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Ciudad 
              </label>
              <select
                id="recipient_city"
                value={data.recipient_city}
                onChange={handleChange}
                disabled={disabled.recipient_city}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="Canelones">Canelones</option>
                <option value="Montevideo">Montevideo</option>
              </select>
            </div>
            <div className="mb-3">
             <SelectNeighborhood type="" disabled={disabled.recipient_neighborhood} value={data.recipient_neighborhood} token={token} city={data.recipient_city} set={setSelectNeighborhoodTemp}/>
            </div>
            <div className="mb-3">
              <label
                htmlFor="recipient_address"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Dirección 
              </label>
              <input
                type="text"
                id="recipient_address"
                value={data.recipient_address}
                onChange={handleChange}
                placeholder="Dirección"
                disabled={disabled.recipient_address}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            {type=="post" &&
                        <div className="mb-3">
                        <label
                          htmlFor="recipient_apartment"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          Apartamento
                        </label>
                        <input
                          type="text"
                          id="recipient_apartment"
                          placeholder="Apartamento"
                          value={data.recipient_apartment}
                          onChange={handleChange}
                          className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"    
                          required
                        />
                      </div>
            }
            <div className="mb-3">
              <label
                htmlFor="recipient_phone"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Nombre Destinatario
              </label>
              <input
                type="text"
                id="recipient_name"
                value={data.recipient_name}
                onChange={handleChange}
                placeholder="Nombre completo"
                disabled={disabled.recipient_name}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="recipient_phone"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Telefono
              </label>
              <input
                type="text"
                id="recipient_phone"
                value={data.recipient_phone}
                onChange={handleChange}
                placeholder="Telefono"
                className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={disabled.recipient_phone}
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="recipient_phone"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
               Quien Paga 
              </label>
              <select
                id="who_pays"
                value={data.who_pays}
                onChange={handleChange}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={disabled.who_pays}
              >
                <option value="Remitente">Remitente</option>
                <option value="Destinatario">Destinatario</option>
              </select>
            </div>
            <div className="mb-3 ">
              <label
                htmlFor="recipient_phone"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
              Notas 
              </label>
              <textarea id="notes" disabled={disabled.notes} value={data.notes} onChange={handleChange} className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder=""></textarea>
            </div>
          </div>
          <div className="mb-3">
          <h6 className="mb-2 text-lg font-medium text-gray-700 flex items-center justify-center space-x-2">
            <span>Detalle de paquete</span>
            { type!="get" &&
            <button
              type="button"
              onClick={addPackage}
              className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <Icon path={mdiPlusCircle} size={1} color="green" />
            </button>
            }
          </h6>
          {data.package_detail.map((item, index) => (
            <div key={index} className="flex items-center mb-4">
              <div className="flex w-full flex-wrap">
                <div className="w-full md:w-2/5 mb-5 pr-2">
                  <label
                    htmlFor={`description_${index}`}
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Descripción
                  </label>
                  <input
                    type="text"
                    id={`description_${index}`}
                    name="description"
                    value={item.description}
                    onChange={(e) => handlePackageChange(index, e)}
                    className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2 pl-3 pr-1"
                    required
                    disabled={type=="get"}
                  />
                </div>
                <div className="w-full md:w-3/5 flex flex-wrap">
                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label
                      htmlFor={`quantity_${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Cantidad
                    </label>
                    <input
                      type="number"
                      id={`quantity_${index}`}
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handlePackageChange(index, e)}
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                      disabled={type=="get"}
                    />
                  </div>
                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label
                      htmlFor={`weight_${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      id={`weight_${index}`}
                      name="weight"
                      value={item.weight}
                      onChange={(e) => handlePackageChange(index, e)}
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                      disabled={type=="get"}
                    />
                  </div>
                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label
                      htmlFor={`length_${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Largo (cm)
                    </label>
                    <input
                      type="number"
                      id={`length_${index}`}
                      name="length"
                      value={item.dimensions.length}
                      onChange={(e) => handlePackageChange(index, e)}
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                      disabled={type=="get"}
                    />
                  </div>
                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label
                      htmlFor={`width_${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Ancho (cm)
                    </label>
                    <input
                      type="number"
                      id={`width_${index}`}
                      name="width"
                      value={item.dimensions.width}
                      onChange={(e) => handlePackageChange(index, e)}
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                      disabled={type=="get"}
                    />
                  </div>
                  <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                    <label
                      htmlFor={`height_${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Alto (cm)
                    </label>
                    <input
                      type="number"
                      id={`height_${index}`}
                      name="height"
                      value={item.dimensions.height}
                      onChange={(e) => handlePackageChange(index, e)}
                      className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                      required
                      disabled={type=="get"}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-end">
                {type!="get" &&
                  <button
                    type="button"
                    onClick={() => removePackage(index)}
                    className="p-3 bg-red-500 text-white rounded-full"
                  >
                    <Icon path={mdiDelete} size={1} />
                  </button>
                }
              </div>
            </div>
          ))}
          </div>
          {type!="get" && 
           <button
           type="submit"
           className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
           disabled={loading}
         >
           {loading ? "Guardando..." : btn}
         </button>

          }
        </form>
      </div>
    );
  }

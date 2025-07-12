  import React, { useState, useEffect } from "react";
  import dayjs from "dayjs";
  import "dayjs/locale/es";
  import { Waybills } from "@/modules/waybills/infrastructure/waybillsService";
  import { Calculate } from "@/modules/calculate/infrastructure/calculateService";
  import { Companies } from "@/modules/companies/infrastructure/companiesService";
  import { useNavigate, useParams } from "react-router-dom";
  import { useSelector } from "react-redux";
  import { Icon } from "@mdi/react";
  import { mdiPlusCircle, mdiDelete,mdiMagnify } from "@mdi/js";
  import Swal from "sweetalert2";
  import ModalSelect from './ModalSelect';
  import SelectNeighborhood from './SelectNeighborhood';
  import SelectHours from './SelectHours';
  import SelectHoursRange from './SelectHoursRange';
  import DateFilterDelivery from './DateFilterDelivery';
  import DateFilter from './DateFilter';
  export default function FormWaybill({ type = "get" }) {
    const [loading, setLoading] = useState(false);
    const [disabled, setDisabled] = useState({branch_id:false});
    const [modalVisible, setModalVisible] = useState(false);
    const [selectCompany,setSelectCompany]=useState({id:"",name:"",email:"",branches:[]});
    const [selectArray,setSelectArray]=useState([]);
    const token = useSelector((state) => state.auth.token);
    const companyId = useSelector((state) => state.auth.companyId);
    const { id } = useParams();
    const [title, setTitle] = useState("Crear guía");
    const [btn, setBtn] = useState("Crear");
    const [typeForm, setTypeForm] = useState(type);
    const [data, setData] = useState({
      company_name:"",
      user_name:"",
      branch_id: "",
      date:"",
      hour:"",
      price:"",
      sender_city: "Montevideo",
      sender_neighborhood: "",
      sender_address: "",
      recipient_city: "Montevideo",
      recipient_neighborhood: "",
      recipient_address: "",
      recipient_email:"",
      recipient_phone:"",
      recipient_name:"",
      who_pays:"Remitente",
      notes:"",
      withdrawal_date:"",
      delivery_date:"",
      delivery_hour: "",
      package_detail: [
        {
          type: "Box",
          package_number: "",
          description: "",
          weight: 0,
          quantity: 1,
          price: 0,
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
      let selectArryTemp=await Companies.search("",token);
      setSelectCompany(selectArryTemp.data[0]);
      if (type=="post"){
        setBtn("Crear");
        setTitle("Crear guía");
      }
      if (type == "put") {
        setBtn("Modificar");
        setTitle("Modificar guía");
      }
      if (type == "get") {
        setDisabled({branch_id:true});
        setTitle("Informacion de guía");
      }
      if (type == "put" || type == "get") {
          let dataWb = await Waybills.getById(id, token);
          let pickupDatetime=dataWb.pickup_datetime.split(" ");
          let horTem="";
          if(pickupDatetime.length>3){
            horTem=pickupDatetime[1]+" - "+pickupDatetime[3];
          }
         
          let company=await Companies.getById(dataWb.company_id,token);
          let dataTemp={
            company_name:dataWb.company_name,
            user_name:company.data.user_name,
            branch_id: dataWb.branch_id,
            date:pickupDatetime[0],
            hour:horTem,
            price: dataWb.shipping_cost,
            sender_city:  dataWb.sender.address.city,
            sender_neighborhood:dataWb.sender.address.neighborhood,
            sender_address:dataWb.sender.address.street,
            recipient_city:dataWb.receiver.address.city,
            recipient_neighborhood: dataWb.receiver.address.neighborhood,
            recipient_address:dataWb.receiver.address.street,
            recipient_email:dataWb.receiver.email,
            recipient_phone:dataWb.receiver.phone,
            recipient_name:dataWb.receiver.name,
            package_detail:dataWb.package_details,
            status:dataWb.status,
            who_pays:dataWb.who_pays,
            notes:dataWb.notes,
            withdrawal_date:dataWb.withdrawal_date,
            delivery_date:dataWb.delivery_date,
            delivery_hour:dataWb.delivery_hour
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
    const setSelectHours = (value) => {
      setData((prevData) => ({
        ...prevData,
        hour: value,
      }));
    };
    const setSearchZone =async (value) => {
     
      let dataC={
        "sender_city":data.sender_city,
        "sender_neighborhood": data.sender_neighborhood,
        "recipient_city": data.recipient_city,
        "recipient_neighborhood": value,
        "package_detail":data.package_detail,
        "company_id":companyId
      }
      let selectArryTemp=await Calculate.set(dataC,token);
      console.log("=*******=",selectArryTemp);
      if (typeof selectArryTemp.price!="undefined"){
        setData((prevData) => ({
          ...prevData,
          price: selectArryTemp.price,
        }));
      }
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
      if(id=="recipient_neighborhood" && value!=""){
        setSearchZone(value);
      }
      setData((prevData) => ({
        ...prevData,
        [id]: value,
      }));
    };

    const handlePackageChange = (index, event) => {
      const { name, value } = event.target;
    
      const newPackageDetail = [...data.package_detail];
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

      let dataW = {
        company_id: selectCompany.id,
        branch_id: data.branch_id,
        company_name: selectCompany.name,
        pickup_datetime: dateFin + " " + horTem,
        who_pays: data.who_pays,
        notes: data.notes,
        receiver: {
          name: data.recipient_name,
          address: {
            city: data.recipient_city,
            neighborhood: data.recipient_neighborhood,
            street: data.recipient_address,
          },
          email: data.recipient_email,
          phone: data.recipient_phone
        },
        package_details: data.package_detail,
        shipping_cost: data.price,
        status: "Procesando",
        withdrawal_date: data.withdrawal_date,
        delivery_date: data.delivery_date,
        delivery_hour:data.delivery_hour
      };
      
      
      let message;
      if (typeForm === "put") {
        message = await Waybills.put(id, dataW, token);
      } else {
        message = await Waybills.set(dataW, token);
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
    const setSelectDate = (value) => {
      setData((prevData) => ({
        ...prevData,
        withdrawal_date: value,
        date:value,
      }));
    };
    const setSelectDeliveryHour = (value) => {
      setData((prevData) => ({
        ...prevData,
        delivery_hour: value,
      }));
    };
    const setSelectDateDelivery = (value) => {
      setData((prevData) => ({
        ...prevData,
        delivery_date: value,
      }));
    };
    return (
      <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
        <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">{title}</h5>
      
        <form className="w-full" onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/4 px-2 ">
            <label
              htmlFor="branch_id"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Dirección retiro
            </label>
            <select
              id="branch_id"
              value={data.branch_id}
              onChange={(e) => handleChange(e)}
              className="disabled block w-full py-2 pl-3 pr-1 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            {typeForm === "get" ? (
    <p className="py-2 px-3 bg-gray-100 rounded text-gray-800">
      Fecha de retiro:{" "}
      {data.withdrawal_date
        ? dayjs(data.withdrawal_date).locale("es").format("DD/MM/YYYY")
        : "-"}
    </p>
  ) : (
    <DateFilter
      value={data.date}
      set={setSelectDate}
      label="Fecha de retiro"
    />
  )}
          </div>
          <div className="w-full md:w-1/3 px-2 ">
            <SelectHoursRange value={data.hour} set={setSelectHours}   labelText="Horario de entrega (9hs - 18hs)"  required={true} disabled={type=="get"} />
          </div>
          <div className="w-full md:w-1/4 px-2 ">
            <label
              htmlFor="price"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Precio de envio
            </label>
            <input
              type="text"
              id="price"
              value={data.price}
              onChange={handleChange}
              placeholder="Precio"
              className="mb-6 py-2 pl-3 pr-1  bg-gray-50 border border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  cursor-not-allowed dark:bg-gray-200 dark:border-gray-400 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
              disabled
            />
          </div>
          <div className="w-full md:w-1/4 px-2 ">
            {typeForm === "get" ? (
    <p className="py-2 px-3 bg-gray-100 rounded text-gray-800">
      Fecha de entrega:{" "}
      {data.delivery_date
        ? dayjs(data.delivery_date).locale("es").format("DD/MM/YYYY")
        : "-"}
    </p>
  ) : (
    <DateFilterDelivery
      value={data.delivery_date}
      set={setSelectDateDelivery}
      label="Fecha de entrega"
    />
  )}  
          </div>
          <div className="w-full md:w-1/3 px-2 ">
            <SelectHoursRange value={data.delivery_hour} set={setSelectDeliveryHour} required={true} disabled={type == "get"} labelText="Horario de entrega (9hs - 18hs)" />
          </div>
          <div className="w-full md:w-1/4 px-2 ">
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
                placeholder="Ciudad"
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="sender_address"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Dirección - Apartamento
              </label>
              <input
                type="text"
                id="sender_address"
                value={data.sender_address}
                onChange={handleChange}
                placeholder="Dirección"
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled
             />
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
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={type=="get"}
              >
                <option value="Canelones">Canelones</option>
                <option value="Montevideo">Montevideo</option>
              </select>
            </div>
            <div className="mb-3">
             <SelectNeighborhood type="" disabled={type=="get"}  token={token} city={data.recipient_city} value={data.recipient_neighborhood} set={setSelectNeighborhoodTemp}/>
            </div>
            <div className="mb-3">
              <label
                htmlFor="recipient_address"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Dirección - Apartamento
              </label>
              <input
                type="text"
                id="recipient_address"
                value={data.recipient_address}
                onChange={handleChange}
                placeholder="Dirección"
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={type=="get"}
              />
            </div>
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
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={type=="get"}
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
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={type=="get"}
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
                disabled={type=="get"}
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
              <textarea id="notes"  value={data.notes}  disabled={type=="get"} onChange={handleChange} className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder=""></textarea>
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

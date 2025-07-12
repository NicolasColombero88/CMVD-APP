import React, { useState, useEffect } from "react";
import { Waybills } from "@/modules/waybills/infrastructure/waybillsService";
import { Calculate } from "@/modules/calculate/infrastructure/calculateService";
import { Companies } from "@/modules/companies/infrastructure/companiesService";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Icon } from "@mdi/react";
import { mdiPlusCircle, mdiDelete,mdiMagnify,mdiClose } from "@mdi/js";
import Swal from "sweetalert2";
import SelectNeighborhood from './SelectNeighborhood';
import SelectHours from './SelectHours';
import DateFilter from './DateFilter';
import DateFilterDelivery from './DateFilterDelivery';
import SelectHoursRange from './SelectHoursRange';
import ButtonCreateBranch from './ButtonCreateBranch';
export default function FormWaybill({ type = "get" }) {
  const [loading, setLoading] = useState(false);
  const [modalBranch, setModalBranch] = useState(false);
  const [disabled, setDisabled] = useState({branch_id:false,hour:false});
  const [selectCompany,setSelectCompany]=useState({id:"",name:"",email:"",branches:[]});
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
    date:null,
    hour:"",
    price:"",
    sender_city: "Montevideo",
    sender_neighborhood: "",
    sender_address: "",
    withdrawal_date:null,
    delivery_date:null,
    delivery_hour: ""
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
        let company=await Companies.getById(dataWb.company_id,token);
        let horTem="";
        if(pickupDatetime.length>3){
          horTem=pickupDatetime[1]+" - "+pickupDatetime[3];
        }
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
          delivery_hour:dataWb.delivery_hour,

        }
        setSelectCompany(company.data);
        setData(dataTemp); 
    }
  };
  useEffect(() => {
    index();
  }, []);
  const setSelectHours = (value) => {
    setData((prevData) => ({
      ...prevData,
      hour: value,
    }));
  };
  const setSelectDeliveryHour = (value) => {
    setData((prevData) => ({
      ...prevData,
      delivery_hour: value,
    }));
  };
  const setSearchZone =async (recipient_city,value,package_detail) => {
    let dataC={
      "sender_city":data.sender_city,
      "sender_neighborhood": data.sender_neighborhood,
      "recipient_city":recipient_city,
      "recipient_neighborhood": value,
      "package_detail":package_detail,
      "company_id":companyId
    }
    let selectArryTemp=await Calculate.set(dataC,token);
    console.log("=*******=",selectArryTemp);
    if (typeof selectArryTemp.price!="undefined"){
     return selectArryTemp.price;
    }
    return 0;
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
  const addRecipient = () => {
    setRecipient((prevRecipients) => [
      ...prevRecipients,
      {
        recipient_city: "Montevideo",
        recipient_neighborhood: "",
        recipient_address: "",
        recipient_apartment:"",
        recipient_email: "",
        recipient_phone: "",
        recipient_name: "",
        who_pays: "Remitente",
        price:0,
        notes:"",
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
      },
    ]);
  };
  const removeRecipient = (index) => {
    if(recipient.length>1){
      setRecipient((prevRecipients) =>
        prevRecipients.filter((_, i) => i !== index)
      );
    }
  };
  
  const addPackage = (recipientIndex) => {
    const newPackage = {
      description: "",
      quantity: 1,
      weight: 0,
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
      },
    };
    setRecipient((prevRecipients) =>
      prevRecipients.map((recipient, i) =>
        i === recipientIndex
          ? {
              ...recipient,
              package_detail: [...recipient.package_detail, newPackage],
            }
          : recipient
      )
    );
  };
  const removePackage = (recipientIndex, packageIndex) => {
    if(recipient[recipientIndex].package_detail.length>1){
      setRecipient((prevRecipients) =>
        prevRecipients.map((recipient, i) =>
          i === recipientIndex
            ? {
                ...recipient,
                package_detail: recipient.package_detail.filter((_, j) => j !== packageIndex),
              }
            : recipient
        )
      );
    }
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
    const recipientCopy = recipient.map((r) => ({
      ...r,
      package_detail: r.package_detail.map((pkg) => ({
        ...pkg,
        dimensions: { ...pkg.dimensions },
      })),
    }));
  
    try {
      let allSucceeded = true;
  
      for (let i = 0; i < recipientCopy.length; i++) {
        const {
          who_pays,
          recipient_name,
          recipient_city,
          recipient_neighborhood,
          recipient_address,
          recipient_email,
          recipient_phone,
          package_detail,
          price,
          notes,
          recipient_apartment,
        } = recipientCopy[i];
       
        let dateFin="";
        if (typeof data.date === "string") {
          dateFin = data.date.split("-").reverse().join("-");
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
        const dataW = {
          company_id: selectCompany.id,
          branch_id: data.branch_id,
          company_name: selectCompany.name,
          pickup_datetime: `${dateFin} ${horTem}`,
          who_pays,
          notes:notes,
          receiver: {
            name: recipient_name,
            address: {
              city: recipient_city,
              neighborhood: recipient_neighborhood,
              street: recipient_address+","+recipient_apartment,
            },
            email: recipient_email,
            phone: recipient_phone,
          },
          package_details: package_detail,
          shipping_cost: price,
          status: "Procesando",
          withdrawal_date:data.withdrawal_date,
          delivery_date:data.delivery_date,
          delivery_hour:data.delivery_hour
        };
        //alert(data.delivery_date);
        const message = await Waybills.set(dataW, token);
  
        if (!("id" in message)) {
          allSucceeded = false;
          Swal.fire({
            icon: "error",
            title: "Error",
            text: message.mensaje || "Error al procesar el registro.",
          });
          break;
        }else{
          setRecipient((prevRecipients) =>
            prevRecipients.filter((_, index) => index !== i)
          );
        }
      }
  
      if (allSucceeded) {
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text:"Todos los registros se crearon exitosamente",
        }).then(() => {
          navigate("/waybills");
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error durante el envío. Por favor, intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const [recipient, setRecipient] = useState([{
    recipient_city: "Montevideo",
    recipient_neighborhood: "",
    recipient_address: "",
    recipient_apartment:"",
    recipient_email:"",
    recipient_phone:"",
    recipient_name:"",
    who_pays:"Remitente",
    price:0,
    notes:"",
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
  }]);
  const handleRecipientChange = async (index, field, value) => {
    if (field === "recipient_neighborhood") {
      try {
        const price = await setSearchZone(
          recipient[index].recipient_city,
          value,
          recipient[index].package_detail
        );
  
        setRecipient((prevRecipients) => {
          const updatedRecipients = prevRecipients.map((recipient, i) =>
            i === index
              ? { ...recipient, [field]: value, price }
              : recipient
          );
  
          const totalPrice = updatedRecipients.reduce(
            (sum, recipient) => sum + recipient.price,
            0
          );
  
          setData((prevData) => ({
            ...prevData,
            price: totalPrice,
          }));
  
          return updatedRecipients;
        });
      } catch (error) {
        console.error("Error al actualizar el precio:", error);
      }
    } else {
      setRecipient((prevRecipients) =>
        prevRecipients.map((recipient, i) =>
          i === index ? { ...recipient, [field]: value } : recipient
        )
      );
    }
  };
  const handlePackageDetailChange = (recipientIndex, packageIndex, field, value) => {
    setRecipient((prevRecipients) =>
      prevRecipients.map((recipient, i) => {
        if (i === recipientIndex) {
          return {
            ...recipient,
            package_detail: recipient.package_detail.map((pkg, j) =>
              j === packageIndex
                ? field === "length" || field === "width" || field === "height"
                  ? {
                      ...pkg,
                      dimensions: {
                        ...pkg.dimensions,
                        [field]: parseFloat(value),
                      },
                    }
                  : field === "weight" || field === "quantity" 
                  ? { ...pkg, [field]: parseFloat(value) }
                  : { ...pkg, [field]: value }
                : pkg
            ),
          };
        }
        return recipient;
      })
    );
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
  return (
    <div className="block max-w-4xl p-8 bg-white border border-gray-300 rounded-lg shadow mx-auto">
      <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800">{title}</h5>
      <ButtonCreateBranch  visible={modalBranch} setVisible={setModalBranch} set={addBranch}/>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/4 px-2 ">
            <label
              htmlFor="branch_id"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              <div className="flex items-center gap-2">
                Dirección retiro
                <button
                  type="button"
                  onClick={() => setModalBranch(true)}
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
              className="disabled block w-full py-2 pl-3 pr-1 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={disabled.branch_id}
            >
              <option value="">Selecciona una Dirección</option>
              {selectCompany.branches?.map((branche) => (
                <option key={branche.id} value={branche.id}>
                  {branche.name}
                </option>
              ))}
            </select>

          </div>
          <div className="w-full md:w-1/4 px-2 ">
            <DateFilter value={data.date} set={setSelectDate} label="Fecha de retiro" />
          </div>
          <div className="w-full md:w-1/3 px-2 ">
            <SelectHoursRange  value={data.hour} set={setSelectHours}   disabled={disabled.hour} labelText="Hora de retiro (8hs - 16hs)" />
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
            <DateFilterDelivery value={data.delivery_date} set={setSelectDateDelivery} label="Fecha de entrega" />  
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
                Dirección
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
        <h6 className="text-lg font-bold mb-4">Información del destinatario
 
        </h6> 
        {recipient.map((dataR, index) => (
   <div className="relative rounded-[10px] p-4 border border-gray-300 mb-5" key={index}>
    <button
      type="button"
      onClick={() => removeRecipient(index)}
      className="absolute top-2 right-2 bg-red-500 text-white rounded-full"
    >
      <Icon path={mdiClose} size={1} />
    </button>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
      <div className="mb-3">
        <label
          htmlFor={`recipient_city_${index}`}
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Ciudad
        </label>
        <select
          id={`recipient_city_${index}`}
          value={dataR.recipient_city}
          onChange={(e) => handleRecipientChange(index, "recipient_city", e.target.value)}
          className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
          disabled={type === "get"}
        >
          <option value="Canelones">Canelones</option>
          <option value="Montevideo">Montevideo</option>
        </select>
      </div>
      <div className="mb-3">
        <SelectNeighborhood
          type=""
          disabled={type === "get"}
          token={token}
          city={dataR.recipient_city}
          value={dataR.recipient_neighborhood}
          set={(value) => handleRecipientChange(index, "recipient_neighborhood", value)}
        />
      </div>
      <div className="mb-3">
        <label
          htmlFor={`recipient_address_${index}`}
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Dirección
        </label>
        <input
          type="text"
          id={`recipient_address_${index}`}
          value={dataR.recipient_address}
          onChange={(e) => handleRecipientChange(index, "recipient_address", e.target.value)}
          className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
          disabled={type === "get"}
        />
      </div>
      <div className="mb-3">
        <label
          htmlFor={`recipient_apartment_${index}`}
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Apartamento
        </label>
        <input
          type="text"
          id={`recipient_apartment_${index}`}
          value={dataR.recipient_apartment}
          onChange={(e) => handleRecipientChange(index, "recipient_apartment", e.target.value)}
          className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
          disabled={type === "get"}
        />
      </div>
      <div className="mb-3">
        <label
          htmlFor={`recipient_name_${index}`}
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Nombre Destinatario
        </label>
        <input
          type="text"
          id={`recipient_name_${index}`}
          value={dataR.recipient_name}
          onChange={(e) => handleRecipientChange(index, "recipient_name", e.target.value)}
          className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={type === "get"}
        />
      </div>
      <div className="mb-3">
        <label
          htmlFor={`recipient_phone_${index}`}
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Teléfono
        </label>
        <input
          type="text"
          id={`recipient_phone_${index}`}
          value={dataR.recipient_phone}
          onChange={(e) => handleRecipientChange(index, "recipient_phone", e.target.value)}
          className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
          disabled={type === "get"}
        />
      </div>
      <div className="mb-3">
        <label
          htmlFor={`who_pays_${index}`}
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Quien Paga
        </label>
        <select
          id={`who_pays_${index}`}
          value={dataR.who_pays}
          onChange={(e) => handleRecipientChange(index, "who_pays", e.target.value)}
          className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
          disabled={type === "get"}
        >
          <option value="Remitente">Remitente</option>
          <option value="Destinatario">Destinatario</option>
        </select>
      </div>
      <div className="mb-3">
        <label
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Precio
        </label>
        <input
          type="text"
          value={dataR.price}
          className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
          disabled
        />
      </div>
      <div className="mb-3 ">
          <label
            htmlFor="notes"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
          Notas 
          </label>
          <textarea  id={`notes_${index}`}  value={dataR.notes}
          onChange={(e) => handleRecipientChange(index, "notes", e.target.value)} className="block w-full py-2 pl-3 pr-2 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder=""></textarea>
        </div>
    </div>
    <div className="mb-3">
      <h6 className="mb-2 text-lg font-medium text-gray-700 flex items-center justify-center space-x-2">
        <span>Detalle de paquete</span>
        {type !== "get" && (
          <button
            type="button"
            onClick={() => addPackage(index)}
            className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <Icon path={mdiPlusCircle} size={1} color="green" />
          </button>
        )}
      </h6>
      {dataR.package_detail.map((pkg, pkgIndex) => (
        <div key={pkgIndex} className="flex items-center mb-4">
          <div className="flex w-full flex-wrap">
            <div className="w-full md:w-2/5 mb-5 pr-2">
              <label
                htmlFor={`description_${index}_${pkgIndex}`}
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Descripción
              </label>
              <input
                type="text"
                id={`description_${index}_${pkgIndex}`}
                name="description"
                value={pkg.description}
                onChange={(e) => handlePackageDetailChange(index, pkgIndex, "description", e.target.value)}
                className="shadow-sm bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2 pl-3 pr-1"
                required
                disabled={type === "get"}
              />
            </div>
            <div className="w-full md:w-3/5 flex flex-wrap">
              <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                <label
                  htmlFor={`quantity_${index}_${pkgIndex}`}
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Cantidad
                </label>
                <input
                  type="number"
                  id={`quantity_${index}_${pkgIndex}`}
                  name="quantity"
                  value={pkg.quantity}
                  onChange={(e) => handlePackageDetailChange(index, pkgIndex, "quantity", e.target.value)}
                  className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                  required
                  disabled={type === "get"}
                />
              </div>
              <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                <label
                  htmlFor={`weight_${index}_${pkgIndex}`}
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Peso (kg)
                </label>
                <input
                  type="number"
                  id={`weight_${index}_${pkgIndex}`}
                  name="weight"
                  value={pkg.weight}
                  onChange={(e) => handlePackageDetailChange(index, pkgIndex, "weight", e.target.value)}
                  className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                  required
                  disabled={type === "get"}
                />
              </div>
              <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                <label
                  htmlFor={`length_${index}_${pkgIndex}`}
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Largo (cm)
                </label>
                <input
                  type="number"
                  id={`length_${index}_${pkgIndex}`}
                  name="length"
                  value={pkg.dimensions.length}
                  onChange={(e) => handlePackageDetailChange(index, pkgIndex, "length", e.target.value)}
                  className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                  required
                  disabled={type === "get"}
                />
              </div>
              <div className="mb-5 w-full sm:w-1/2 md:w-1/5 pr-2">
                <label
                  htmlFor={`width_${index}_${pkgIndex}`}
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Ancho (cm)
                </label>
                <input
                  type="number"
                  id={`width_${index}_${pkgIndex}`}
                  name="width"
                  value={pkg.dimensions.width}
                  onChange={(e) => handlePackageDetailChange(index, pkgIndex, "width", e.target.value)}
                  className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                  required
                  disabled={type === "get"}
                />
              </div>
              <div className="mb-5 w-full sm:w-1/2 md:w-1/5">
                <label
                  htmlFor={`height_${index}_${pkgIndex}`}
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Alto (cm)
                </label>
                <input
                  type="number"
                  id={`height_${index}_${pkgIndex}`}
                  name="height"
                  value={pkg.dimensions.height}
                  onChange={(e) => handlePackageDetailChange(index, pkgIndex, "height", e.target.value)}
                  className="shadow-sm bg-white border border-gray-300 rounded-lg w-full py-1.5 pl-3 pr-1"
                  required
                  disabled={type === "get"}
                />
              </div>
            </div>
          </div>
          {type !== "get" && (
            <button
              type="button"
              onClick={() => removePackage(index, pkgIndex)}
              className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <Icon path={mdiDelete} size={1} color="red" />
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
))}
        {type !== "get" && 
            <button
            type="button"
            onClick={() => addRecipient()}
            className="mt-4  mb-4 p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300 flex items-center gap-2 mx-auto"
          >
            Agregar destinatario
            <Icon path={mdiPlusCircle} size={1} color="green" />
          </button>
        } 



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

const API_URL = import.meta.env.VITE_API_URL+'v1/';
import * as XLSX from "xlsx";
const createHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorResponse = await response.json();
    return Promise.reject(errorResponse);
  }
  return response.json(); 
};
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};
const formatDataForExcel = (json,userMap) => {
  return {
    "Empresa": json.company_name || "",
    "Remitente - Nombre": json.sender?.name || "",
    "Remitente - Dirección (Calle)": json.sender?.address?.street || "",
    "Remitente - Barrio": json.sender?.address?.neighborhood || "",
    "Remitente - Ciudad": json.sender?.address?.city || "",
    "Remitente - Teléfono": json.sender?.phone || "",
    "Destinatario - Nombre": json.receiver?.name || "",
    "Destinatario - Dirección (Calle)": json.receiver?.address?.street || "",
    "Destinatario - Barrio": json.receiver?.address?.neighborhood || "",
    "Destinatario - Ciudad": json.receiver?.address?.city || "",
    "Destinatario - Teléfono": json.receiver?.phone || "",
    "Fecha de Envío": json.pickup_datetime.replace(/(\d{2})-(\d{2})-(\d{4})/, '$1/$2/$3')|| "",
    "Precio": json.shipping_cost || "",
    "Estado": json.status || "",
    "Fecha de Creación": json.created_at
      ? formatDate(json.created_at)
      : "",
    "Fecha de Actualización": json.updated_at
      ? formatDate(json.updated_at)
      : "",
    "Nombre de cadete": userMap[json.cadete_id] || "Desconocido", 
    "Estado de pago": json.payment_status || "Pendiente",
    "Quien paga": json.who_pays
  };
};


const exportExcel = async (search,filter={}, token) => {
  try {
    let queryString = Object.entries(filter)
    .filter(([key, value]) => value !== "") 
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
    const resp = await request("GET", `waybills?search=${search}&${queryString}`, token);
    const respUser = await request('GET', `users?role=Cadete`, token);
    const userMap = respUser.data.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {});
    if (!Array.isArray(resp.data)) {
      console.error("El formato de los datos no es válido.");
      return;
    }
    const formattedData = resp.data.map((waybill) => formatDataForExcel(waybill, userMap));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
    XLSX.writeFile(workbook, "datos.xlsx");
    console.log("Archivo Excel exportado correctamente.");
  } catch (error) {
    console.error("Error al exportar el Excel:", error);
  }
};

const request = async (method, endpoint, token, body = null) => {
  const headers = createHeaders(token);
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error en Api:', error);
    return { status: 'error', error: error.error,mensaje:error.mensaje };
  }
};
export const Pagination = async (page = 1, limit = 10, search = "", token = "",filter={status:""}) => {
  let queryString = Object.entries(filter)
  .filter(([key, value]) => value !== "") 
  .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  .join("&");
  return request('GET', `waybills?page=${page}&limit=${limit}&search=${search}&${queryString}`, token);
};
export const Waybills = {
  getById: (userId, token = "") => request('GET', `waybills/${userId}`, token),
  set: (userData, token = "") => request('POST', 'waybills', token, userData),
  put: (userId, userData, token = "") => request('PUT', `waybills/${userId}`, token, userData),
  delete: (userId, token = "") => request('DELETE', `waybills/${userId}`, token),
  exel:(search,filter,token = "") => exportExcel(search,filter,token),
  historySet:(userId,userData, token = "") => request('POST',  `waybills/${userId}/history`, token, userData),
  cadeteSet:(id,userData, token = "") => request('PUT',  `waybills/${id}/cadete`, token, userData),
  payment:(id,userData, token = "") => request('POST',  `waybills/${id}/payment`, token, userData),
  count: () => request('GET', `waybills/count`,''),
};

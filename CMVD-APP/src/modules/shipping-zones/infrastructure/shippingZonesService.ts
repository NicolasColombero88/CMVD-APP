const API_URL = import.meta.env.VITE_API_URL+'v1/';
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
export const Pagination = async (page = 1, limit = 10, search = "", token = "") => {
  return request('GET', `shipping-zones?page=${page}&limit=${limit}&search=${search}`, token);
};
export const ShippingZones = {
  getById: (userId, token = "") => request('GET', `shipping-zones/${userId}`, token),
  getByEmail: (email, token = "") => request('GET', `shipping-zones/email/${email}`, token),
  getAreas:(token = "") => request('GET', `shipping-zones/areas`, token),
  set: (userData, token = "") => request('POST', 'shipping-zones', token, userData),
  put: (userId, userData, token = "") => request('PUT', `shipping-zones/${userId}`, token, userData),
  delete: (userId, token = "") => request('DELETE', `shipping-zones/${userId}`, token),
};

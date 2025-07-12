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
  return request('GET', `users?page=${page}&limit=${limit}&search=${search}`, token);
};
export const Users = {
  getById: (userId, token = "") => request('GET', `users/${userId}`, token),
  getByEmail: (email, token = "") => request('GET', `users/email/${email}`, token),
  getClint:(token = "") => request('GET', `users`, token),
  set: (userData, token = "") => request('POST', 'users', token, userData),
  put: (userId, userData, token = "") => request('PUT', `users/${userId}`, token, userData),
  account: ( userData, token = "") => request('PUT', `users/account`, token, userData),
  password: ( userData, token = "") => request('PUT', `users/password`, token, userData),
  delete: (userId, token = "") => request('DELETE', `users/${userId}`, token),
  getCadetes:(search,token = "") => request('GET', `users?role=Cadete&search=${search}`, token),
};

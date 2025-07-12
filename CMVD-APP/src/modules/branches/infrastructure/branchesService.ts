
const API_URL = import.meta.env.VITE_API_URL+'v1/';
const createHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en la solicitud');
  }
  return await response.json();
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
    return { status: 'error', error: error.message };
  }
};
export const Pagination = async (page = 1, limit = 10, search = "", token = "") => {
  return request('GET', `companies/branches`, token);
};
export const Branches = {
  getById: (userId, token = "") => request('GET', `companies/branches/${userId}`, token),
  set: (userData, token = "") => request('POST', 'companies/branches', token, userData),
  search:(search, token = "") => request('GET',`companies/branches?search=${search} `, token),
  put: (userId, userData, token = "") => request('PUT', `companies/branches/${userId}`, token, userData),
  delete: (userId, token = "") => request('DELETE', `companies/branches/${userId}`, token),
};

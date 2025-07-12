const API_URL = import.meta.env.VITE_API_URL + 'v1/';

const request = async (endpoint, method, body = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error('Error in Api:', error);
    return { status: 'error', error: error.message };
  }
};

export const auth = (email, password) => 
  request('auth', 'POST', { email, password });

export const register = (data) => 
  request('auth/register', 'POST', data);

export const Recovery = {
  set: (data) => request('auth/recovery', 'POST', data),
  put: (data) => request('auth/recovery', 'PUT', data),
};

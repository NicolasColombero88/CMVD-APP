
const API_URL = import.meta.env.VITE_API_URL+'v1/';


export const auth = async (email,password) => {
  try {
    const dataHttp = {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ email, password }),
    };
    const response = await fetch(`${API_URL}auth`, dataHttp);
    return await response.json();
  } catch (error) {
     console.error('Error in Api:', error);
    return {status:"sss",error};
  }
};
export const register = async (data) => {
  try {
    const dataHttp = {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(data),
    };
    const response = await fetch(`${API_URL}auth/register`, dataHttp);
    return await response.json();
  } catch (error) {
     console.error('Error in Api:', error);
    return {status:"sss",error};
  }
};


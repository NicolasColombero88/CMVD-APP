import { auth ,register} from '../infrastructure/authService';
import {addAuth} from  './authSlice';
import { jwtDecode } from "jwt-decode";
export const login = (email, password) => async (dispatch) => {
    try {
      const data = await auth(email, password);
      if(typeof data.Token!="undefined"){
        console.log("data=11=", data);
        const token = data.Token;
        let decoded = jwtDecode(token);
        let info=decoded.sub;
        info.token=token;
        dispatch(addAuth(info));
      }else{
        return data.Mensaje;
      }
      return "";
    } catch (error) {
     
      console.error('Error de autenticación:', error);
    }
  };
  export const registerAuth = (dataR) => async (dispatch) => {
    try {
      const data = await register(dataR);
      if(typeof data.Token!="undefined"){
        const token = data.Token;
        let decoded = jwtDecode(token);
        let info=decoded.sub;
        info.token=token;
        dispatch(addAuth(info));
      }else{
        return data.error;
      }
      return "";
    } catch (error) {
     
      console.error('Error de autenticación:', error);
    }
  };
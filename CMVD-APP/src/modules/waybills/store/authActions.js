import { auth } from '../infrastructure/authService';
import {addAuth} from  './authSlice';
import { jwtDecode } from "jwt-decode";
export const Pagination = (email, password) => async (dispatch) => {
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
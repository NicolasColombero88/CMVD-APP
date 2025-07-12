import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {registerAuth } from '../store/authActions';
import { useNavigate,useLocation} from 'react-router-dom';
import FormRegister from '@/components/FormRegister';
import Layout from '@/components/LayoutHome';
import Swal from 'sweetalert2';
export default function Register() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/waybills';
  const dispatch = useDispatch();
  const navigate = useNavigate(); 
  const handleSubmit = async (data) => {
    let messeage:any= await dispatch(registerAuth(data));
    console.log("------",messeage);
    if(messeage!=""){
      Swal.fire({
        icon: 'error',
        title: 'Registration Error',
        text: messeage,
      });
    }else{
      navigate(redirectPath);   
    }
  }

  return (
    <Layout>
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
     <FormRegister set={handleSubmit}/>
    </div>
    </Layout>
  );
}

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {registerAuth } from '../store/authActions';
import { useNavigate } from 'react-router-dom';
import FormRegister from '@/components/FormRegister';
export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate(); 
  const handleSubmit = async (data) => {
    let messeage:any= await dispatch(registerAuth(data));
    if(messeage!=""){
      console.log("------",messeage);
    }else{
      navigate('/waybills');   
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
     <FormRegister set={handleSubmit}/>
    </div>
  );
}

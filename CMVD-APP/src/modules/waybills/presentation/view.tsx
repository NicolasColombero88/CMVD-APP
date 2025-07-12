
import React, { useState,useEffect } from 'react';
import  Layout from '@/components/Layout';
import  FormWaybill from '@/components/FormWaybill';
import  FormWaybillClient from '@/components/FormWaybillClient';
import {useSelector} from 'react-redux';
import { Pagination } from '../infrastructure/waybillsService';
export default function users() {
  const role = useSelector((state) => state.auth.role);
  const [data, setData] = useState([]);
  const token = useSelector((state) => state.auth.token);
  const index = async () => {
   
  }
  useEffect(() => {
    index();
  }, []);

  return (
    <Layout>
      {role=="Cliente" &&   <FormWaybillClient type="get" /> }
      {(role === "Super Admin" || role === "Cadete" || role === "Admin") && <FormWaybill type="get" />}
    </Layout>
  );
}

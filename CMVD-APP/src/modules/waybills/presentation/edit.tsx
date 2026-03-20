
import React, { useState,useEffect } from 'react';
import  Layout from '@/components/Layout';
import  FormWaybill from '@/components/FormWaybillAdmin';
import  FormWaybillClient from '@/components/FormWaybillClient';
import {useSelector} from 'react-redux';
import { Pagination } from '../infrastructure/waybillsService';
import FormWaybillAdmin from '../../../components/FormWaybillAdmin';
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
      {role=="Cliente" &&   <FormWaybillClient type="put" /> }
      {(role === "Super Admin" || role === "Admin") && <FormWaybillAdmin type="put" />}
    </Layout>
  );
}

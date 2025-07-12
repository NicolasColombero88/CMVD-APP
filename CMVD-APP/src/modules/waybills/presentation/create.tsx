
import React, { useState,useEffect } from 'react';
import  Layout from '@/components/Layout';
import  FormWaybill from '@/components/FormWaybillAdmin';
import  FormWaybillClient from '@/components/FormWaybillClientCreate';
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
      {role=="Cliente" &&   <FormWaybillClient type="post" /> }
      {role=="Super Admin" &&   <FormWaybill type="post" /> }
    </Layout>
  );
}

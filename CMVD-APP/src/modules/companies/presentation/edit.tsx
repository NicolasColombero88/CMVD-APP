
import React, { useState,useEffect } from 'react';
import  Layout from '@/components/Layout';
import  FormCompany from '@/components/FormCompany';
import {useSelector} from 'react-redux';
import { Pagination } from '../infrastructure/companiesService';
export default function users() {
  const [data, setData] = useState([]);
  const token = useSelector((state) => state.auth.token);
  const index = async () => {
   
  }
  useEffect(() => {
    index();
  }, []);

  return (
    <Layout>
      <FormCompany type="put"/>
    </Layout>
  );
}

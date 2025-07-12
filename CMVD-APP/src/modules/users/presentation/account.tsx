
import React, { useState,useEffect } from 'react';
import  Layout from '@/components/Layout';
import  FormAccount from '@/components/FormAccount';
import {useSelector} from 'react-redux';
import { Pagination } from '../infrastructure/usersService';
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
      <FormAccount/>
    </Layout>
  );
}

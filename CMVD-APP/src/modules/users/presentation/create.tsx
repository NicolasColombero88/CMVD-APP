
import React, { useState,useEffect } from 'react';
import  Layout from '@/components/Layout';
import  FormUser from '@/components/FormUser';
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
      <FormUser type="post"/>
    </Layout>
  );
}

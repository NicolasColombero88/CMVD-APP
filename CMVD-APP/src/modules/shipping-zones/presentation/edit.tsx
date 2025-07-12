
import React, { useState,useEffect } from 'react';
import  Layout from '@/components/Layout';
import  FormUser from '@/components/FormShippingZones';
import {useSelector} from 'react-redux';
import { Pagination } from '../infrastructure/shippingZonesService';
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
      <FormUser type="put"/>
    </Layout>
  );
}

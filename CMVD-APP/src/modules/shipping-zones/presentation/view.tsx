
import React, { useState,useEffect } from 'react';
import  Layout from '@/components/Layout';
import  FormUser from '@/components/FormShippingZones';
import {useSelector} from 'react-redux';
export default function users() {
  const token = useSelector((state) => state.auth.token);
  const index = async () => {
  }
  useEffect(() => {
    index();
  }, []);

  return (
    <Layout>
      <FormUser type="get"/>
    </Layout>
  );
}

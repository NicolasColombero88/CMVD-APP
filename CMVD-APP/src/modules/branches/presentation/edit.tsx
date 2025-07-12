
import React, { useState,useEffect } from 'react';
import  Layout from '@/components/Layout';
import  FormBranch from '@/components/FormBranch';
export default function users() {

  const index = async () => {
   
  }
  useEffect(() => {
    index();
  }, []);

  return (
    <Layout>
        <FormBranch type="put" />
    </Layout>
  );
}

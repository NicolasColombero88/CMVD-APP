
import React, { useState,useEffect } from 'react';
import  Layout from '@/components/LayoutHome';
import  FormCalculate from '@/components/FormCalculate';
export default function users() {

  return (
    <Layout>
      <FormCalculate type="post" />
    </Layout>
  );
}

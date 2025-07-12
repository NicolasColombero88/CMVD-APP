import React, { useState, useEffect } from 'react';
import Header from './Header';
import {useLocation } from 'react-router-dom';
const Layout = ({ children }) => {
  const location = useLocation();
  useEffect(() => {
    const defaultTitle = import.meta.env.VITE_APP_TITLE || 'App';
    const currentPath = location.pathname;
    const titleFromPath = currentPath.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) || 'Home'; 
    document.title = `${defaultTitle} - ${titleFromPath}`;
  }, [location]);
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        <Header/>
        <main className="flex-1  overflow-y-auto">
          {children} 
        </main>
      </div>
    </div>
  );
};

export default Layout;

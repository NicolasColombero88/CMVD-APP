import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileHeader from './MobileHeader';
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
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <MobileHeader />
        <main className="flex-1 p-6 overflow-y-auto">
          {children} 
        </main>
      </div>
    </div>
  );
};

export default Layout;

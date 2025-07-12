import React from 'react';
import { Outlet,Navigate,useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = () => {
  const token = useSelector((state) => state.auth.token);
  const location = useLocation();
  if (!token) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
  }
  return <Outlet />; 
};

export default PrivateRoute;

import React from 'react';
import Logo from '@/assets/logo.webp';
import Icon from '@mdi/react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  mdiCubeSend,
  mdiStore,
  mdiAccountMultiple,
  mdiMapMarkerRadius,
  mdiPoll,
  mdiDomain,
  mdiCog 
} from '@mdi/js';
import { useSelector } from "react-redux";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = useSelector((state) => state.auth.role);

  const navItems = [
    { path: '/waybills', label: 'Guias', icon: mdiCubeSend, role: ['Super Admin','Cadete', 'Cliente', 'Admin'] },
    { path: '/branches', label: 'Dirección retiro', icon: mdiDomain , role: ['Cliente'] },
    { path: '/companies', label: 'Empresas', icon: mdiStore, role: ['Super Admin', 'Admin'] },
    { path: '/users', label: 'Usuarios', icon: mdiAccountMultiple, role: ['Super Admin', 'Admin'] },
    { path: '/shipping-zones', label: 'Zona de envios', icon: mdiMapMarkerRadius, role: ['Super Admin', 'Admin'] },
    { path: '/settings', label: 'Ajustes', icon: mdiCog , role: ['Super Admin', 'Admin'] },
  
  ];

  return (
    <aside className="relative bg-sidebar h-screen w-64 hidden sm:block shadow-xl w-[200px]">
      <div className="p-6">
        <a href="https://www.cadeteria-mvd.com/" className="text-white text-3xl font-semibold uppercase hover:text-gray-300">
          <img
            className="mx-auto h-30 w-auto"
            src={Logo}
            alt="Logo de la empresa"
          />
        </a>
      </div>
      <nav className="text-white text-base font-semibold pt-3 w-[200px] ">
        {navItems.map((item) => (
          item.role?.includes(role) && ( 
            <a
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center py-4 pl-6 nav-item cursor-pointer ${
                location.pathname === item.path
                  ? 'bg-gray-700 text-white opacity-100'
                  : 'text-black opacity-75 hover:opacity-100'
              }`}
            >
              <Icon
                path={item.icon}
                size={1}
                color={location.pathname === item.path ? "white" : "black"}
                style={{ marginRight: '10px' }}
              />
              {item.label}
            </a>
          )
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

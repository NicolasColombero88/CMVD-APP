import React, { useState } from 'react';
import Icon from '@mdi/react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  mdiCubeSend,
  mdiStore,
  mdiAccountMultiple,
  mdiMapMarkerRadius,
  mdiPoll,
  mdiDomain,
  mdiMenu,
  mdiCog
} from '@mdi/js';
import { useSelector } from "react-redux";

const MobileHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = useSelector((state) => state.auth.role);
  const name = useSelector((state) => state.auth.name);
  const navItems = [
    { path: '/waybills', label: 'Guias', icon: mdiCubeSend, role: ['Super Admin','Cadete','Cliente', 'Admin'] },
    { path: '/branches', label: 'Dirección retiro', icon: mdiDomain , role: ['Cliente'] },
    { path: '/companies', label: 'Empresas', icon: mdiStore, role: ['Super Admin', 'Admin'] },
    { path: '/users', label: 'Usuarios', icon: mdiAccountMultiple, role: ['Super Admin', 'Admin'] },
    { path: '/shipping-zones', label: 'Zona de envios', icon: mdiMapMarkerRadius, role: ['Super Admin', 'Admin'] },
    { path: '/settings', label: 'Ajustes', icon: mdiCog , role: ['Super Admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.role.includes(role));

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleSignOut = () => {
    navigate('/login');
  };

  return (
    <header className="w-full bg-sidebar py-5 px-6 sm:hidden bg-cyan-400">
      <div className="flex items-center justify-between">
      <a 
        href="index.html" 
        className="text-white text-3xl font-semibold capitalize hover:text-gray-300 truncate"
        style={{ maxWidth: "75%" }}
      >
        {name}
      </a>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white text-3xl focus:outline-none">
          <Icon path={mdiMenu} size={2} color="white" />
        </button>
      </div>
      <nav className={`flex flex-col pt-4 ${isOpen ? 'flex' : 'hidden'}`}>
        {filteredNavItems.map(item => (
          <a 
            href="#"
            key={item.path}
            className="flex items-center text-white opacity-75 hover:opacity-100 py-2 pl-4 nav-item"
            onClick={() => handleNavigation(item.path)}
          >
            <Icon path={item.icon} size={1} color="white" className="mr-3" />
            {item.label}
          </a>
        ))}
        <a href="#"  onClick={() => handleNavigation('/users/support')} className="flex items-center text-white opacity-75 hover:opacity-100 py-2 pl-4 nav-item">
          <i className="fas fa-cogs mr-3"></i> Soporte
        </a>
        <a href="#" onClick={() => handleNavigation('/users/account')}  className="flex items-center text-white opacity-75 hover:opacity-100 py-2 pl-4 nav-item">
          <i className="fas fa-user mr-3"></i> Mi cuenta
        </a>
        <a href="#" className="flex items-center text-white opacity-75 hover:opacity-100 py-2 pl-4 nav-item" onClick={() => window.location.replace('https://www.cadeteria-mvd.com')}>
          <i className="fas fa-sign-out-alt mr-3"></i> Cerrar sesion
        </a>
      </nav>
    </header>
  );
};

export default MobileHeader;

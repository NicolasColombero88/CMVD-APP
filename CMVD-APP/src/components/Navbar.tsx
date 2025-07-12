import React, { useState, useEffect } from 'react';
import { useSelector } from "react-redux";
import Icon from '@mdi/react';
import { mdiAccount } from '@mdi/js';
import { useNavigate } from 'react-router-dom';
const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const auth = useSelector((state) => state.auth);
  const [styles, setStyles] = useState({
    textColor: "",
    borderColor: "",
    bgColor: "",
  });

  const roleStyles = {
    "Super Admin": { textColor: "text-gray-800", borderColor: "border-gray-800", bgColor: "" },
    "Cliente": { textColor: "text-white", borderColor: "border-white", bgColor: "" },
    "Cadete": { textColor: "text-yellow-500", borderColor: "border-yellow-500", bgColor: "" },
  };
  
  useEffect(() => {
    const styles = roleStyles[auth.role] || { textColor: "text-gray-400", borderColor: "border-gray-400", bgColor: "" };
    console.log("Applied styles:", styles); 
    setStyles(styles);
  }, [auth.role]);
  

  return (
    <header className="w-full items-center py-2 px-6 hidden sm:flex bg-cyan-400">
      <div className="w-1/2"></div>
      <div className="relative w-1/2 flex justify-end" >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative z-10 w-12 h-12 rounded-full overflow-hidden flex justify-center items-center 
          border-4 ${styles.borderColor} ${styles.bgColor}`}
        >
          <Icon path={mdiAccount} size={1} className={styles.textColor} />
        </button>
        {isOpen && (
            <div className="absolute w-32 bg-white rounded-lg shadow-lg py-2 mt-16">
              <a href="#"  onClick={() => navigate('/users/account')} className="block px-4 py-2 account-link hover:bg-gray-100 hover:text-blue-500">Cuenta</a>
              <a href="#"  onClick={() => navigate('/users/support')} className="block px-4 py-2 account-link hover:bg-gray-100 hover:text-blue-500">Soporte</a>
              <a href="#" onClick={() => window.location.replace('https://www.cadeteria-mvd.com')} className="account-link hover:bg-gray-100 hover:text-blue-500">Cerrar sesión</a>
            </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

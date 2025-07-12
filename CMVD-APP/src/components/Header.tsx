/*import React from "react";*/
import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Logo from "@/assets/logo.webp";

export default function Header() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { label: "Home", href: "https://www.cadeteria-mvd.com/" },
    { label: "Servicios", href: "https://www.cadeteria-mvd.com/services-4" },
    { label: "Acerca de nosotros", href: "https://www.cadeteria-mvd.com/about-7" },
    { label: "Términos y condiciones", href: "https://www.cadeteria-mvd.com/general-5" },
    { label: "FAQ (Preguntas Frecuentes)", href: "https://www.cadeteria-mvd.com/faq-preguntas-frecuentes" },
    { label: "Cotizar", href: "/calculate" },
  ];

  const isExternal = (href) => /^https?:\/\//.test(href);

  return (
    <header>
      <nav className="bg-white border-b border-gray-200 px-4 lg:px-6 py-2.5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <a href="https://www.cadeteria-mvd.com/" className="flex items-center">
            <img src={Logo} alt="Logo de la empresa" className="h-10 w-auto" />
          </a>

          {/* Desktop menu */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            <ul className="flex space-x-4">
              {menuItems.map((item) => (
                <li key={item.href}>
                  {isExternal(item.href) ? (
                    // Enlaces externos abren en la misma página
                    <a
                      href={item.href}
                      className={`block py-2 ${
                        location.pathname === item.href
                          ? "text-black font-bold border-b-2 border-black"
                          : "text-gray-700 hover:text-black"
                      }`}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className={`block py-2 ${
                        location.pathname === item.href
                          ? "text-black font-bold border-b-2 border-black"
                          : "text-gray-700 hover:text-black"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Social + Auth always visible (outside responsive menu) */}
          <div className="flex items-center space-x-4">
            <a
              href="https://www.instagram.com/cadeteriamvd/"
              aria-label="Instagram"
              className="p-2"
            >
              <img
                src="https://static.wixstatic.com/media/01c3aff52f2a4dffa526d7a9843d46ea.png"
                alt="Instagram"
                className="h-5 w-5 object-cover"
              />
            </a>
            <Link
              to="/login"
              className="text-black hover:bg-gray-100 font-medium rounded-lg text-sm px-3 py-2"
            >
              Inicia sesión
            </Link>
            <Link
              to="/register"
              className="text-white bg-black hover:bg-gray-800 font-medium rounded-lg text-sm px-3 py-2"
            >
              Regístrate
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg
                className="h-6 w-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu panel: solo items */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 px-4 pb-4">
            <ul className="flex flex-col space-y-2 mt-4">
              {menuItems.map((item) => (
                <li key={item.href}>
                  {isExternal(item.href) ? (
                    <a
                      href={item.href}
                      className={`block py-2 ${
                        location.pathname === item.href
                          ? "text-black font-bold"
                          : "text-gray-700 hover:text-black"
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className={`block py-2 ${
                        location.pathname === item.href
                          ? "text-black font-bold"
                          : "text-gray-700 hover:text-black"
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}


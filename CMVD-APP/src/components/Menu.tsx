import React from 'react';

export default function Menu() {
  return (
    <div>
      {/* Header */}
      <header style={{ backgroundColor: '#333', color: '#fff', padding: '10px 0', textAlign: 'center' }}>
        <h1>Mi Menú</h1>
        <nav>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            <li style={{ display: 'inline', margin: '0 10px' }}>
              <a href="#" style={{ color: '#fff', textDecoration: 'none' }}>Inicio</a>
            </li>
            <li style={{ display: 'inline', margin: '0 10px' }}>
              <a href="#" style={{ color: '#fff', textDecoration: 'none' }}>Acerca de</a>
            </li>
            <li style={{ display: 'inline', margin: '0 10px' }}>
              <a href="#" style={{ color: '#fff', textDecoration: 'none' }}>Contacto</a>
            </li>
          </ul>
        </nav>
      </header>

      {/* Slider */}
      <section style={{ width: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', transition: 'transform 0.5s ease', transform: 'translateX(0%)' }}>
          <div style={{ minWidth: '100%', backgroundColor: '#f2f2f2', padding: '50px 0', textAlign: 'center' }}>
            <h2>Slide 1</h2>
            <p>Contenido del primer slide</p>
          </div>
          <div style={{ minWidth: '100%', backgroundColor: '#ddd', padding: '50px 0', textAlign: 'center' }}>
            <h2>Slide 2</h2>
            <p>Contenido del segundo slide</p>
          </div>
          <div style={{ minWidth: '100%', backgroundColor: '#bbb', padding: '50px 0', textAlign: 'center' }}>
            <h2>Slide 3</h2>
            <p>Contenido del tercer slide</p>
          </div>
        </div>
      </section>
    </div>
  );
}

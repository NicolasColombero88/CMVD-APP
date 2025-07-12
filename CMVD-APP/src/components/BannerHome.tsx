import React from 'react';
import Caja from '@/assets/cajas.webp';
import { useLocation, Link } from "react-router-dom";
export default function BannerHome() {
    return (
        <div
            className="relative w-full h-[500px] bg-cover bg-center flex flex-col items-center justify-center text-white"
            style={{ backgroundImage: `url(${Caja})` }}
        >
            <div className="bg-black bg-opacity-50 p-4 rounded">
                <h1 className="text-4xl font-bold mb-2">Cadetería MVD</h1>
                <h3 className="text-lg mb-4">La solución logística para todas tus entregas</h3>
                 <Link className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded" to="/waybills/create" >
                    Agenda tu envío
                </Link>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Waybills } from "@/modules/waybills/infrastructure/waybillsService";
export default function ButtonStatus({ initialState="",id="",token="", set }) {
  const [status, setStatus] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };
  const handleAction = (action) => {
    let newStatus = '';
    switch (action) {
      case 'aceptado':
        newStatus = 'Aceptado';
        break;
      case 'rechazado':
        newStatus = 'Rechazado';
        break;
      case 'cancelado':
        newStatus = 'Cancelado';
        break;
      case 'asignadoCadete':
        newStatus = 'AsignadoCadete';
        break;
      case 'recogido':
        newStatus = 'Recogido';
        break;
      case 'entregado':
        newStatus = 'Entregado';
        break;
      default:
        break;
    }
    if (newStatus !== status) {
      setStatus(newStatus); 
      if (set) {
        set(newStatus);
        create(newStatus); 
      }
      closeModal(); 
    }
  };
  useEffect(() => {
    if (status !== initialState) {
        setStatus(initialState);
    }
  }, [initialState]);
  const create = async (text) => {
    let data={
        company_id:id,
        status: text,
        location: "",
    }
    let historySet = await Waybills.historySet(id,data, token);
    console.log("historySet==",historySet);
  }
  const getButtonColor = (status) => {
    switch (status) {
      case 'Procesando':
        return 'bg-gray-500 text-white';
      case 'Aceptado':
        return 'bg-blue-500 text-white';
      case 'AsignadoCadete':
        return 'bg-yellow-500 text-white';
      case 'Recogido':
        return 'bg-green-500 text-white';
      case 'Entregado':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div>
      <button
        className={`px-4 py-2 rounded-lg ${getButtonColor(status)}`}
        onClick={openModal}
      >
        {status}
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3 max-w-md">
            <h3 className="text-2xl font-semibold mb-4 text-center text-gray-800">Acciones disponibles</h3>
            <div className="space-y-3">
              {status === 'Procesando' && (
                <>
                  <button
                    className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    onClick={() => handleAction('aceptado')}
                  >
                    Aceptar
                  </button>
                  <button
                    className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    onClick={() => handleAction('rechazado')}
                  >
                    Rechazar
                  </button>
                </>
              )}

              {status === 'Aceptado' && (
                <button
                  className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                  onClick={() => handleAction('cancelado')}
                >
                  Cancelar
                </button>
              )}

              {status === 'AsignadoCadete' && (
                <button
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  onClick={() => handleAction('recogido')}
                >
                  Recoger
                </button>
              )}

              {status === 'Recogido' && (
                <button
                  className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  onClick={() => handleAction('entregado')}
                >
                  Entregar
                </button>
              )}

              {status === 'Entregado' && (
                <p className="text-center text-gray-500">El envío ya ha sido entregado.</p>
              )}
            </div>
            <div className="mt-6 flex justify-center">
              <button
                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
                onClick={closeModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

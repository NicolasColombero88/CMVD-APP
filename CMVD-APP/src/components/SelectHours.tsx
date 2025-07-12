import React, { useState, useEffect } from "react";

export default function SelectHours({ set = () => null, value = "" ,disabled=false,labelText="Hora"}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState(value);

  useEffect(() => {
    setSelectedTime(value);
  }, [value]);

  const hours = [
    "9:00 - 11:00",
    "10:00 - 12:00",
    "11:00 - 13:00",
    "12:00 - 14:00",
    "13:00 - 15:00",
    "14:00 - 16:00",
    "Sin horario",
  ];
  
  const modalOpen = (event) => {
    event.preventDefault(); 
    setShowModal(true);
  }
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setShowModal(false);
    set(time);
  };

  return (
    <>
      <label
        htmlFor="recipient_neighborhood"
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        {labelText}
      </label>
      <input
        type="text"
        value={selectedTime}
        onClick={modalOpen}
        className="block w-full py-2 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Selecciona una hora"
        
        required
        disabled={disabled}
      />
      
      {showModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-medium mb-4">Selecciona una hora</h2>
            <div className="grid grid-cols-2 gap-2">
              {hours.map((hour) => (
                <button
                  key={hour}
                  onClick={() => handleTimeSelect(hour)}
                  className={`border rounded-md px-4 py-2 text-center focus:outline-none ${
                    hour === selectedTime
                      ? "bg-blue-500 text-white"
                      : "border-gray-300 hover:bg-blue-100 hover:text-blue-700"
                  }`}
                  aria-label={`Seleccionar hora ${hour}`}
                >
                  {hour}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full bg-red-500 text-white rounded-md px-4 py-2 hover:bg-red-600 focus:outline-none"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

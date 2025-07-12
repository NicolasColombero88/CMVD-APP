import React, { useState } from "react";
import { Recovery } from '@/modules/auth/infrastructure/authService';
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";
export default function FormRecovery() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
 const navigate = useNavigate();
  const handleEmailSubmit = async() => {
    Swal.fire({
      title: "",
      text: "Cargando...",
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    let code=await Recovery.set({email:email});
    if (typeof code.error=='undefined'){
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text:"Revisa tu correo se envio el codigo de recueracion ",
      }).then(() => {
        
      }); 
      setStep(2);
    } else {
      Swal.fire({
        icon: "error",
        title: "¡Error!",
        text: code.mensaje,
      });
    }
  };

  const handlePinSubmit = async() => {
    Swal.fire({
      title: "",
      text: "Cargando...",
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    let code=await Recovery.put({email:email,password:newPassword,recovery_pin:pin});
    if (typeof code.error=='undefined'){
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text:"Se actualizo la clave",
      }).then(() => {
        navigate("/login");
      }); 
    }else{
      Swal.fire({
        icon: "error",
        title: "¡Error!",
        text: code.mensaje,
      });
    }
  };

  const handlePasswordSubmit = () => {
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "¡Error!",
        text: "Las contraseñas no coinciden",
      });
    }
    setStep(3);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
              Paso 1: Ingrese su correo electrónico
            </h2>
            <input
              type="email"
              placeholder="Ingrese su correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleEmailSubmit}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Enviar código
            </button>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
              Paso 3: Ingrese el código
            </h2>
            <input
              type="text"
              placeholder="Ingrese el código enviado a su correo"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handlePinSubmit}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
            >
             Actualizar contraseña
            </button>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
              Paso 2: Ingrese su nueva contraseña
            </h2>
            <input
              type="password"
              placeholder="Ingrese la nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Confirme la nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handlePasswordSubmit}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
            >
             Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

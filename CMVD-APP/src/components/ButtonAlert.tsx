import React from 'react';
import Swal from 'sweetalert2';
import { mdiDelete, mdiCancel } from '@mdi/js';
import Icon from '@mdi/react';

export default function ButtonAlert({ title = "¿Estás seguro?", body = "Esta acción no se puede deshacer.", type = "delete", set }) {
  const handleClick = () => {
    Swal.fire({
      title: title,
      text: body,
      icon: type === "delete" ? "warning" : "info",
      showCancelButton: true,
      confirmButtonText: type === "delete" ? "Confirmar eliminación" : "Sí, cancelar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        set();
      }
    });
  };

  const buttonContent = type === "delete" ? {
    label: "Eliminar",
    icon: mdiDelete,
    color: "bg-red-700 hover:bg-red-800 focus:ring-red-300",
    focusRing: "dark:focus:ring-red-800"
  } : {
    label: "Cancelar",
    icon: mdiCancel,
    color: "bg-[#D17F4B] hover:bg-[#C56B3F] focus:ring-[#D17F4B]",
    focusRing: "dark:focus:ring-[#C56B3F]"
  };

  return (
    <button
      type="button"
      title={buttonContent.label}
      onClick={handleClick}
      className={`text-white ${buttonContent.color} focus:ring-4 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2 dark:${buttonContent.color} focus:outline-none dark:${buttonContent.focusRing}`}
    >
      <Icon path={buttonContent.icon} size={1} />
    </button>
  );
}

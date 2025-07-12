import React from "react";
import FormBranch from "@/components/FormBranch";

export default function CreateBranchButton({
  visible = false,
  set = () => null,
  setVisible = () => null,
  idTemp=""
}) {
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      {visible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setVisible(false)}
        >
          <div
            className="relative bg-white rounded-lg shadow-lg w-full max-w-lg"
            onClick={handleModalClick}
          >
            <button
              className="absolute top-2 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
              onClick={() => setVisible(false)}
              aria-label="Cerrar"
            >
              &times;
            </button>
            <FormBranch type="post" set={set} idTemp={idTemp}/>
          </div>
        </div>
      )}
    </>
  );
}

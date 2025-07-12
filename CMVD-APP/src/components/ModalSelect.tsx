import React, { useState, useEffect } from "react";
import { Icon } from "@mdi/react";
import { mdiMagnify, mdiCheckboxBlankOutline, mdiCheckboxMarkedOutline } from "@mdi/js";

export default function ModalSelect({
  visible = false,
  title = "",
  placeholder = "",
  titles = [],
  columns = [],
  data = [],
  set = () => null,
  search = () => null,
  setVisible = () => null,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    if (visible) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";

    return () => (document.body.style.overflow = "unset");
  }, [visible]);

  const handleSelectRecord = (record) => {
    setSelectedRecord(record);
    set(record);
    setVisible(false);
  };

  const handleSearch = () => {
    search(searchQuery);
  };

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <>
      {visible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleClose}
        >
          <div
            className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-full"
              >
                <svg
                  className="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full py-2 px-4 pr-10 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder={placeholder}
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 h-full px-3 flex items-center text-gray-600 hover:text-gray-800"
                  onClick={handleSearch}
                >
                  <Icon path={mdiMagnify} size={1} />
                </button>
              </div>

              <table className="w-full text-sm mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                  <tr>
                    {titles.map((header, index) => (
                      <th key={index} className="px-4 py-2 text-left">
                        {header}
                      </th>
                    ))}
                    <th className="px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    data.map((record, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-b last:border-none hover:bg-gray-50"
                      >
                        {columns.map((column, colIndex) => (
                          <td key={colIndex} className="px-4 py-2">
                            {record[column]}
                          </td>
                        ))}
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleSelectRecord(record)}
                            className="flex items-center space-x-2"
                          >
                            <Icon
                              path={
                                selectedRecord && selectedRecord.id === record.id
                                  ? mdiCheckboxMarkedOutline
                                  : mdiCheckboxBlankOutline
                              }
                              size={1}
                              color="blue"
                            />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        className="px-4 py-4 text-center text-gray-500"
                      >
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

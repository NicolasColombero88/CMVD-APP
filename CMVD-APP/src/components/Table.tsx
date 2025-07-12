import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiChevronLeft, mdiChevronRight, mdiMagnify, mdiRefresh } from '@mdi/js';

export default function Table({
  titles = [],
  columns = [],
  data = [],
  pag = 1,
  totalPag = 0,
  onPageChange,
  searchPag,
  action = () => null,
  searchPlaceholder = '',
  create = '',
  filter = () => null,
}) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const searchPagination = () => searchPag(search, {});
  const refreshPagination = () => onPageChange(pag);
  const handlePrevPage = () => pag > 1 && onPageChange(pag - 1);
  const handleNextPage = () => pag < totalPag && onPageChange(pag + 1);
  const handlePageClick = (page) => onPageChange(page);

  const getPaginationItems = () => {
    const pages = [];
    if (totalPag <= 7) {
      for (let i = 1; i <= totalPag; i++) pages.push(i);
    } else {
      pages.push(1);
      if (pag > 4) pages.push('...');
      for (let i = Math.max(2, pag - 2); i <= Math.min(totalPag - 1, pag + 2); i++) {
        pages.push(i);
      }
      if (pag < totalPag - 3) pages.push('...');
      pages.push(totalPag);
    }
    return pages;
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-5 grid grid-cols-1 gap-4">
      <div className="overflow-x-auto flex justify-between items-center">
        <div className="pb-4 bg-white sm:rounded-lg w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 w-full">
            <div className="relative w-full sm:w-[300px] bg-white border border-gray-200 rounded-[10px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full py-2 pl-3 pr-10 text-sm bg-white border-none rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder={searchPlaceholder}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button onClick={searchPagination} className="text-gray-700 text-sm font-medium">
                  <Icon path={mdiMagnify} size={1} color="black" />
                </button>
              </div>
            </div>
            <button
              onClick={refreshPagination}
              className="text-gray-700 text-sm font-medium flex items-center justify-center mt-2 sm:mt-0 sm:ml-2"
            >
              <Icon path={mdiRefresh} size={1} />
            </button>
            <div className="flex items-center flex-col sm:flex-row sm:space-x-2 mt-2 sm:mt-0 w-full sm:w-auto">
              {filter}
            </div>
          </div>
        </div>
        {create && (
          <button
            onClick={() => navigate(create)}
            className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-4 py-2.5"
          >
            Crear
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acción
              </th>
              {titles.map((title, index) => (
                <th
                  key={index}
                  className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="py-3 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                  {action(row)}
                </td>
                {columns.map((col, colIndex) => {
                  let value = row;
                  col.split('.').forEach((key) => {
                    if (value && typeof value === 'object') value = value[key];
                  });
                  return (
                    <td key={colIndex} className="px-2 whitespace-nowrap text-sm text-gray-500">
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav aria-label="Page navigation" className="flex justify-center my-5">
        <ul className="inline-flex -space-x-px text-sm">
          <li>
            <button
              onClick={handlePrevPage}
              disabled={pag === 1}
              className="flex items-center justify-center px-3 h-8 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100"
            >
              <Icon path={mdiChevronLeft} size={1} color="black" />
            </button>
          </li>
          {getPaginationItems().map((page, idx) => (
            <li key={idx}>
              {page === '...' ? (
                <span className="flex items-center justify-center px-3 h-8 text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => handlePageClick(page)}
                  className={`flex items-center justify-center px-3 h-8 leading-tight ${
                    pag === page
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )}
            </li>
          ))}
          <li>
            <button
              onClick={handleNextPage}
              disabled={pag === totalPag}
              className="flex items-center justify-center px-3 h-8 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100"
            >
              <Icon path={mdiChevronRight} size={1} color="black" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

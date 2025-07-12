import React, { useState } from 'react';

const TabbedContent = () => {
  const [openTab, setOpenTab] = useState(1);

  return (
    <div className="w-full mt-6">
      <div>
        <ul className="flex border-b">
          {['Tab 1', 'Tab 2', 'Tab 3', 'Tab 4'].map((tab, index) => (
            <li key={index} className="-mb-px mr-1" onClick={() => setOpenTab(index + 1)}>
              <a
                className={`inline-block py-2 px-4 font-semibold ${openTab === index + 1 ? 'border-l border-t border-r rounded-t text-blue-700 font-semibold' : 'text-blue-500 hover:text-blue-800'}`}
                href="#"
              >
                {tab}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white p-6">
        <div className="tab-content">
          {openTab === 1 && <div>Lorem ipsum dolor sit amet...</div>}
          {openTab === 2 && <div>Curabitur at lacinia felis...</div>}
          {openTab === 3 && <div>Duis imperdiet ullamcorper...</div>}
          {openTab === 4 && <div>Nullam nisi leo, luctus in sapien...</div>}
        </div>
      </div>
    </div>
  );
};

export default TabbedContent;

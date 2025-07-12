import React, { useState, useEffect } from "react";
import { Users } from '@/modules/users/infrastructure/usersService';
import Select from 'react-select';

export default function SelectCadete({
  value = "",
  token = "",
  disabled=false,
  set = () => null,  
}) {
  const [cadetes, setCadetes] = useState([]);
  const [selectedValue, setSelectedValue] = useState(null);

  useEffect(() => {
    index();
    setSelectedValue(null);
  }, []);

  useEffect(() => {
    if (value && value !== selectedValue?.value) {
      const selectedOption = cadetes.find(cadete => cadete.value === value);
      if (selectedOption) {
        setSelectedValue(selectedOption);
      }
    }
  }, [value, cadetes]);

  const index = async () => {
    try {
      let selectArryTemp = await Users.getCadetes("", token);
      const selectTemp = selectArryTemp.data.map(item => ({
        value: item.id,  
        label: item.name + "-" + item.email,
      }));
      setCadetes(selectTemp); 
    } catch (error) {
      console.error("Error fetching cadetes:", error);  
    }
  };

  const customStyles = {
    control: (base) => ({
      ...base,
      borderRadius: '10px',
      borderColor: '#d1d5db',
      padding: '1',
      fontSize: '0.875rem',
      backgroundColor: 'white',
      '&:hover': {
        borderColor: '#3b82f6',
      },
      '&:focus': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.4)',
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '10px',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#dbeafe' : 'white',
      color: state.isSelected ? '#1e40af' : 'black',
      padding: '10px',
      '&:hover': {
        backgroundColor: '#e2e8f0',
      },
    }),
  };

  return (
    <>
      <label className="block mb-2 text-sm font-medium text-gray-700">
        Cadete
      </label>
      <Select
        options={cadetes}
        styles={customStyles}
        value={selectedValue} 
        onChange={(selectedOption) => {
          setSelectedValue(selectedOption);
          set(selectedOption?.value);
        }}
        isDisabled={disabled} 
        required
      />
    </>
  );
}

import React, { useState, useEffect } from "react";
import { ShippingZones } from '@/modules/shipping-zones/infrastructure/shippingZonesService';
import Select from 'react-select';

export default function SelectNeighborhood({
  city = "",
  type = "",
  token = "",
  value = "",
  set = () => null,  
  disabled=false
}) {
  const [neighborhood, setNeighborhood] = useState([]);
  const [selectedValue, setSelectedValue] = useState(null);

  useEffect(() => {
    index();
    setSelectedValue(null);
  }, [city]);

  useEffect(() => {
    if (value && neighborhood.length > 0) {
      const defaultOption = neighborhood.find(option => option.value === value);
      setSelectedValue(defaultOption || null);
    }
  }, [value, neighborhood]);

  const index = async () => {
    try {
      const response = await ShippingZones.getAreas(token);
     
      if (city !== "") {
        const selectTemp = response.data
        .filter(item => item.city.trimEnd().toLowerCase() === city.toLowerCase())  
        .map(item => ({
          value: item.neighborhood,  
          label: item.neighborhood  
        }));
        setNeighborhood(selectTemp); 
      }
    } catch (error) {
      console.error("Error fetching neighborhoods:", error);  
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
      <label htmlFor="recipient_neighborhood" className="block mb-2 text-sm font-medium text-gray-700">
        Barrio
      </label>
      <Select
        options={neighborhood}
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

import React, { useState, useEffect } from 'react';
import { RoundedScrollContainer } from '@components/containers';
import { TextInput as FormInput } from '@components/common/TextInput';
import { DropdownSheet } from '@components/common/BottomSheets';
import { fetchAccessoriesDropdown } from '@api/dropdowns/dropdownApi';

const Accessories = ({ formData, onFieldChange, errors }) => {

  const [isVisible, setIsVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const [dropdown, setDropdown] = useState({
    accessories: [],
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const AccessoriesData = await fetchAccessoriesDropdown();
        setDropdown(prevDropdown => ({
          ...prevDropdown,
          accessories: AccessoriesData.map(data => ({
            id: data._id,
            label: data.accessories_name,
          })),
        }));
      } catch (error) {
        console.error('Error fetching Accessories dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  const toggleBottomSheet = (type) => {
    setSelectedType(type);
    setIsVisible(!isVisible);
  };

  const renderBottomSheet = () => {
    let items = [];
    let fieldName = '';

    switch (selectedType) {
      case 'Accessories':
        items = dropdown.accessories;
        fieldName = 'accessories';
        break;
      default:
        return null;
    }
    return (
      <DropdownSheet
        isVisible={isVisible}
        items={items}
        title={selectedType}
        onClose={() => setIsVisible(false)}
        onValueChange={(value) => onFieldChange(fieldName, value)}
      />
    );
  };

  return (
    <RoundedScrollContainer>
      <FormInput
        label={"Accessories"}
        placeholder={"Select Accessories"}
        dropIcon={"menu-down"}
        items={dropdown.accessories}
        editable={false}
        validate={errors.accessories}
        value={formData.accessories?.label}
        onPress={() => toggleBottomSheet('Accessories')}
      />
      {renderBottomSheet()}
    </RoundedScrollContainer>
  )
}

export default Accessories;
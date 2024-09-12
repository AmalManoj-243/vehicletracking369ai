import React, { useState, useEffect } from 'react';
import { RoundedScrollContainer } from '@components/containers';
import { TextInput as FormInput } from '@components/common/TextInput';
import { DropdownSheet } from '@components/common/BottomSheets';
import { fetchComplaintsDropdown, fetchSubComplaintsDropdown } from '@api/dropdowns/dropdownApi';

const Complaints = ({ formData, onFieldChange, errors }) => {

  const [isVisible, setIsVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const [dropdown, setDropdown] = useState({
    complaints: [],
    subComplaints: [],
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const complaintsData = await fetchComplaintsDropdown();
        setDropdown(prevDropdown => ({
          ...prevDropdown,
          complaints: complaintsData.map(data => ({
            id: data._id,
            masterProblemId: data.master_problem_id,
            label: data.master_problem_name,
          })),
        }));
      } catch (error) {
        console.error('Error fetching complaints dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (formData.complaints) {
      const fetchSubComplaintsData = async () => {
        try {
          const subComplaintsData = await fetchSubComplaintsDropdown(formData.complaints.masterProblemId);
          console.log('Fetched Sub Complaints:', subComplaintsData);
          setDropdown(prevDropdown => ({
            ...prevDropdown,
            subComplaints: subComplaintsData.map(data => ({
              id: data._id,
              label: data.name, 
            })),
          }));
          
        } catch (error) {
          console.error('Error fetching sub-complaints dropdown data:', error);
        }
      };
      fetchSubComplaintsData();
    }
  }, [formData.complaints]);

  const toggleBottomSheet = (type) => {
    setSelectedType(type);
    setIsVisible(!isVisible);
  };

  const renderBottomSheet = () => {
    let items = [];
    let fieldName = '';

    switch (selectedType) {
      case 'Complaints':
        items = dropdown.complaints;
        fieldName = 'complaints';
        break;
      case 'SubComplaints':
        items = dropdown.subComplaints;
        fieldName = 'subComplaints';
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
        label={"Complaints"}
        placeholder={"Select Complaints"}
        dropIcon={"menu-down"}
        items={dropdown.complaints}
        editable={false}
        validate={errors.complaints}
        value={formData.complaints?.label}
        onPress={() => toggleBottomSheet('Complaints')}
      />
      <FormInput
        label="Sub Complaints"
        placeholder="Select Sub Complaints"
        dropIcon="menu-down"
        items={dropdown.subComplaints}
        editable={false}
        validate={errors.subComplaints}
        value={formData.subComplaints?.label}
        onPress={() => toggleBottomSheet('SubComplaints')}
      />
      <FormInput
        label="Remarks"
        placeholder="Enter Remarks"
        editable={true}
        multiline={true}
        numberOfLines={5}
        textAlignVertical="top"
        marginTop={10}
        onChangeText={(value) => onFieldChange('remarks', value)}
      />
      {renderBottomSheet()}
    </RoundedScrollContainer>
  );
}

export default Complaints;

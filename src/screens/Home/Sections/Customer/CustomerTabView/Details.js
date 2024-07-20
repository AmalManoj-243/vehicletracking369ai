import React, { useState, useEffect } from 'react';
import { Keyboard } from 'react-native';
import { RoundedScrollContainer } from '@components/containers';
import { TextInput as FormInput } from '@components/common/TextInput';
import { DropdownSheet } from '@components/common/BottomSheets';
import { fetchsalesPersonDropdown, fetchmopDropdown } from '@api/dropdowns/dropdownApi';
import { customerTypes } from '@constants/customerTypes';
import { customerTitles } from '@constants/customerTitles';
import { LoadingButton } from '@components/common/Button';

const Details = ({ formData, setFormData }) => {
  const [errors, setErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const [dropdown, setDropdown] = useState({
    salesPerson: [],
    customerTypes: [],
    mop: [],
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const salesPersonData = await fetchsalesPersonDropdown();
        setDropdown(prevDropdown => ({
          ...prevDropdown,
          salesPerson: salesPersonData.map(data => ({
            id: data._id,
            label: data.name,
          })),
        }));
      } catch (error) {
        console.error('Error fetching sales person dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const mopData = await fetchmopDropdown();
        setDropdown(prevDropdown => ({
          ...prevDropdown,
          mop: mopData.map(data => ({
            id: data._id,
            label: data.xxx,
          })),
        }));
      } catch (error) {
        console.error('Error fetching mop dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [field]: null,
      }));
    }
  };

  const toggleBottomSheet = (type) => {
    setSelectedType(type);
    setIsVisible(!isVisible);
  };

  const renderBottomSheet = () => {
    let items = [];
    let fieldName = '';

    switch (selectedType) {
      case 'Customer Type':
        items = customerTypes;
        fieldName = 'customerTypes';
        break;
      case 'Customer Title':
        items = customerTitles;
        fieldName = 'customerTitles';
        break;
      case 'Sales Person':
        items = dropdown.salesPerson;
        fieldName = 'salesPerson';
        break;
      case 'MOP (Mode Of Payment)':
        items = dropdown.mop;
        fieldName = 'mop';
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
        onValueChange={(value) => handleFieldChange(fieldName, value)}
      />
    );
  };

  const validate = () => {
    Keyboard.dismiss();
    let isValid = true;
    let errors = {};

    const requiredFields = {
      customerTypes: 'Please select Customer Type',
      customerName: 'Please enter Customer Name',
      customerTitles: 'Please select Customer Title',
      emailAddress: 'Please enter Email Address',
      salesPerson: 'Please select Sales Person',
      collectionAgent: 'Please enter Collection Agent',
      mop: 'Please select Mode Of Payment',
      mobileNumber: "Please enter Mobile Number",
      whatsappNumber: 'Please enter Whatsapp Number',
      landlineNumber: 'Please enter Landline Number',
      fax: 'Please enter Fax',
    };

    Object.keys(requiredFields).forEach(field => {
      if (!formData[field]) {
        errors[field] = requiredFields[field];
        isValid = false;
      }
    });

    setErrors(errors);
    return isValid;
  };

  const submit = () => {
    if (validate()) {
      setIsSubmitting(true);
      // Handle form submission
      // ...
      setIsSubmitting(false);
    }
  };

  return (
    <RoundedScrollContainer>
      <FormInput
        label={"Customer Type :"}
        placeholder={"Select Customer Type"}
        dropIcon={"menu-down"}
        items={customerTypes}
        editable={false}
        validate={errors.customerTypes}
        value={formData.customerTypes?.label}
        onPress={() => toggleBottomSheet('Customer Type')}
      />
      <FormInput
        label={"Customer Name :"}
        placeholder={"Enter Customer Name"}
        editable={true}
        validate={errors.customerName}
        onValueChange={(value) => handleFieldChange('customerName', value)}
      />
      <FormInput
        label={"Customer Title :"}
        placeholder={"Select Customer Title"}
        dropIcon={"menu-down"}
        items={customerTitles}
        editable={false}
        validate={errors.customerTitles}
        value={formData.customerTitles?.label}
        onPress={() => toggleBottomSheet('Customer Title')}
      />
      <FormInput
        label={"Email Address :"}
        placeholder={"Enter Email Address"}
        editable={true}
        validate={errors.emailAddress}
        onValueChange={(value) => handleFieldChange('emailAddress', value)}
      />
      <FormInput
        label={"Sales Person :"}
        placeholder={"Select Sales Person"}
        dropIcon={"menu-down"}
        editable={false}
        validate={errors.salesPerson}
        value={formData.salesPerson?.label}
        onPress={() => toggleBottomSheet('Sales Person')}
      />
      <FormInput
        label={"Collection Agent :"}
        placeholder={"Enter Collection Agent"}
        editable={true}
        validate={errors.collectionAgent}
        onValueChange={(value) => handleFieldChange('collectionAgent', value)}
      />
      <FormInput
        label={"MOP (Mode Of Payment) :"}
        placeholder={"Select MOP"}
        dropIcon={"menu-down"}
        editable={false}
        validate={errors.mop}
        value={formData.mop?.label}
        onPress={() => toggleBottomSheet('MOP (Mode Of Payment)')}
      />
      <FormInput
        label={"Mobile Number :"}
        placeholder={"Enter Mobile Number"}
        editable={true}
        keyboardType="numeric"
        validate={errors.mobileNumber}
        onValueChange={(value) => handleFieldChange('mobileNumber', value)}
      />
      <FormInput
        label={"Whatsapp Number :"}
        placeholder={"Enter Whatsapp Number"}
        editable={true}
        keyboardType="numeric"
        validate={errors.whatsappNumber}
        onValueChange={(value) => handleFieldChange('whatsappNumber', value)}
      />
      <FormInput
        label={"Landline Number :"}
        placeholder={"Enter Landline Number"}
        editable={true}
        keyboardType="numeric"
        validate={errors.landlineNumber}
        onValueChange={(value) => handleFieldChange('landlineNumber', value)}
      />
      <FormInput
        label={"Fax :"}
        placeholder={"Enter Fax :"}
        editable={true}
        keyboardType="numeric"
        validate={errors.fax}
        onValueChange={(value) => handleFieldChange('fax', value)}
      />
      {renderBottomSheet()}
      <LoadingButton
        loading={isSubmitting}
        title={'Submit'}
        onPress={submit}
      />
    </RoundedScrollContainer>
  );
};

export default Details;

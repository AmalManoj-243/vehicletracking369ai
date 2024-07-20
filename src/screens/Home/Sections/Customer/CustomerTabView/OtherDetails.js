import React, { useState, useEffect } from 'react';
import { Keyboard } from 'react-native';
import { RoundedScrollContainer } from '@components/containers';
import { TextInput as FormInput } from '@components/common/TextInput';
import { CheckBox } from '@components/common/CheckBox';
import { fetchCustomerBehaviourDropdown, fetchLanguageDropdown, fetchCurrencyDropdown } from '@api/dropdowns/dropdownApi';
import { DropdownSheet } from '@components/common/BottomSheets';
import { LoadingButton } from '@components/common/Button';

const OtherDetails = ({ formData, setFormData }) => {
  const [errors, setErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);

  const [dropdown, setDropdown] = useState({
    customerBehaviour: [],
    customerAttitude: [],
    language: [],
    currency: [],
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const customerBehaviourData = await fetchCustomerBehaviourDropdown();
        setDropdown(prevDropdown => ({
          ...prevDropdown,
          customerBehaviour: customerBehaviourData.map(data => ({
            id: data._id,
            label: data.xxx, // xxx
          })),
        }));
      } catch (error) {
        console.error('Error fetching customer behaviour dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const languageData = await fetchLanguageDropdown();
        setDropdown(prevDropdown => ({
          ...prevDropdown,
          language: languageData.map(data => ({
            id: data._id,
            label: data.language_name,
          })),
        }));
      } catch (error) {
        console.error('Error fetching language dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const currencyData = await fetchCurrencyDropdown();
        setDropdown(prevDropdown => ({
          ...prevDropdown,
          currency: currencyData.map(data => ({
            id: data._id,
            label: data.currency_name,
          })),
        }));
      } catch (error) {
        console.error('Error fetching currency dropdown data:', error);
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
      case 'Customer Behaviour':
        items = dropdown.customerBehaviour;
        fieldName = 'customerBehaviour';
        break;
      case 'Customer Attitude':
        items = dropdown.customerAttitude;
        fieldName = 'customerAttitude';
        break;
      case 'Language':
        items = dropdown.language;
        fieldName = 'language';
        break;
      case 'Currency':
        items = dropdown.currency;
        fieldName = 'currency';
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
      trn: 'Please enter TRN Number',
      customerBehaviour: 'Please select Customer Behaviour',
      customerAttitude: 'Please select Customer Attitude',
      language: 'Please select Language',
      currency: 'Please select Currency',
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
        label={"TRN :"}
        placeholder={"Enter TRN"}
        editable={true}
        validate={errors.trn}
        onValueChange={(value) => handleFieldChange('TRN', value)}
      />
      <FormInput
        label={"Customer Behaviour"}
        placeholder={"Select Customer Behaviour"}
        dropIcon={"menu-down"}
        editable={false}
        validate={errors.customerBehaviour}
        value={formData.customerBehaviour?.label}
        onPress={() => toggleBottomSheet('Customer Behaviour')}
      />
      <CheckBox
        label="Is Active"
        checked={isActive}
        onPress={() => setIsActive(!isActive)}
      />
      <FormInput
        label={"Customer Attitude :"}
        placeholder={"Enter Customer Attitude"}
        dropIcon={"menu-down"}
        editable={false}
        validate={errors.customerAttitude}
        value={formData.customerAttitude?.label}
        onPress={() => toggleBottomSheet('Customer Attitude')}
      />
      <FormInput
        label={"Language :"}
        placeholder={"Select Language"}
        dropIcon={"menu-down"}
        editable={false}
        validate={errors.language}
        value={formData.language?.label}
        onPress={() => toggleBottomSheet('Language')}
      />
      <FormInput
        label={"Currency :"}
        placeholder={"Select Currency"}
        dropIcon={"menu-down"}
        editable={false}
        validate={errors.currency}
        value={formData.currency?.label}
        onPress={() => toggleBottomSheet('Currency')}
      />
      <CheckBox
        label="Is Supplier"
        checked={isSupplier}
        onPress={() => setIsSupplier(!isSupplier)}
      />
      {renderBottomSheet()}
      <LoadingButton
          loading={isSubmitting}
          title={'Submit'}
          onPress={submit}
        />
    </RoundedScrollContainer>
  )
}

export default OtherDetails;

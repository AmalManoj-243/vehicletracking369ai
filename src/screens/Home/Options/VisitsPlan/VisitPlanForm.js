import {  Keyboard } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, RoundedScrollContainer } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { LoadingButton } from '@components/common/Button';
import { TextInput as FormInput } from '@components/common/TextInput';
import { fetchInvoiceDropdown } from '@api/dropdowns/dropdownApi';
import { DropdownSheet } from '@components/common/BottomSheets';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { formatDate } from '@utils/common/date';
import { useAuthStore } from '@stores/auth';

const VisitPlanForm = ({ navigation }) => {

  const currentUser = useAuthStore(state=> state.user)

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [isDateTimePickerVisible, setIsDateTimePickerVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    customer: '',
    assignedTo: '',
    brand: '',
    selectDuration: '',
    dateAndTime: '',
    visitPurpose: '',
    remarks: '',
  });

  const [dropdown, setDropdown] = useState({
    customer: [],
    assignedTo: [],
    brand: [],
    selectDuration: [
      { id: 'tomorrow', label: 'Tomorrow' },
      { id: 'custom', label: 'Custom Date' }
    ],
    visitPurpose: [],
    remarks: [],
  });

  const handleFieldChange = (field, value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: null,
      }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invoiceDropdown = await fetchInvoiceDropdown();
        setDropdown((prevDropdown) => ({
          ...prevDropdown,
          customer: invoiceDropdown.map((data) => ({
            id: data._id,
            label: data.sequence_no,
          })),
        }));
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (formData.selectDuration?.id === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      handleFieldChange('dateAndTime', tomorrow);
      setIsTimePickerVisible(true);
    } else if (formData.selectDuration?.id === 'custom') {
      setIsDateTimePickerVisible(true);
    }
  }, [formData.selectDuration]);

  const handleTimeChange = (time) => {
    if (time) {
      const selectedDate = formData.dateAndTime ? new Date(formData.dateAndTime) : new Date();
      selectedDate.setHours(time.getHours());
      selectedDate.setMinutes(time.getMinutes());
      handleFieldChange('dateAndTime', selectedDate);
    }
    setIsTimePickerVisible(false);
  };

  const handleDateChange = (date) => {
    if (date) {
      handleFieldChange('dateAndTime', date);
    }
    setIsDateTimePickerVisible(false);
  };

  const toggleBottomSheet = (type) => {
    setSelectedType(type);
    setIsVisible(!isVisible);
  };

  const renderBottomSheet = () => {
    let items = [];
    let fieldName = '';

    switch (selectedType) {
      case 'Customers':
        items = dropdown.customer;
        fieldName = 'customer';
        break;
      // case 'Employees':
      //   items = dropdown.assignedTo;
      //   fieldName = 'assignedTo';
      //   break;
      case 'Select Duration':
        items = dropdown.selectDuration;
        fieldName = 'selectDuration';
        break;
      case 'Visit Purpose':
        items = dropdown.visitPurpose;
        fieldName = 'visitPurpose';
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

  // Validation functions before submission
  const validate = () => {
    Keyboard.dismiss();
    let isValid = true;
    let errors = {};

    const requiredFields = {
      customer: 'Please select a customer',
      brand: 'Please select a brand',
      dateAndTime: 'Please select a date and time',
      visitPurpose: 'Please select a purpose of visit',
      remarks: 'Please enter remarks'
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
    <SafeAreaView>
      <NavigationHeader
        title="New Customer Visit Plan"
        onBackPress={() => navigation.goBack()}
      />
      <RoundedScrollContainer>
        <FormInput
          label={"Customer Name"}
          placeholder={"Select Customer"}
          dropIcon={"menu-down"}
          editable={false}
          validate={errors.customer}
          onPress={() => toggleBottomSheet('Customers')}
        />
        <FormInput
          label={"Assigned To"}
          // placeholder={"Select Assignee"}
          dropIcon={"menu-down"}
          value={currentUser?.related_profile?.name}
          editable={false}
          // onPress={() => toggleBottomSheet('Employees')}
        />
        <FormInput
          label={"Date & Time"}
          placeholder={"Select visit time"}
          dropIcon={"menu-down"}
          editable={false}
          value={formData.dateAndTime ? formatDate(formData.dateAndTime, 'dd-MM-yyyy HH:mm:ss') : "Select visit time"}
          validate={errors.dateAndTime}
          onPress={() => toggleBottomSheet('Select Duration')}
        />
        <FormInput
          label={"Visit Purpose"}
          placeholder={"Select purpose of visit"}
          dropIcon={"menu-down"}
          editable={false}
          validate={errors.visitPurpose}
          onPress={() => toggleBottomSheet('Visit Purpose')}
        />
        <FormInput
          label={"Remarks"}
          placeholder={"Enter remarks"}
          multiline={true}
          numberOfLines={5}
          validate={errors.remarks}
          onChangeText={(value) => handleFieldChange('remarks', value)}
        />
        {renderBottomSheet()}
        <LoadingButton
          loading={isSubmitting}
          title={'SAVE'}
          onPress={submit}
        />
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode='time'
          display="default"
          accentColor='green'
          onConfirm={handleTimeChange}
          onCancel={() => setIsTimePickerVisible(false)}
        />
        <DateTimePickerModal
          isVisible={isDateTimePickerVisible}
          mode='datetime'
          display="default"
          accentColor='green'
          onConfirm={handleDateChange}
          onCancel={() => setIsDateTimePickerVisible(false)}
        />
      </RoundedScrollContainer>
    </SafeAreaView>
  );
};

export default VisitPlanForm;

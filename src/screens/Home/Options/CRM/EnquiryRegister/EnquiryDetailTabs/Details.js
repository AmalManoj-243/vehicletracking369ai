import React, { useState, useEffect } from 'react';
import { RoundedScrollContainer } from '@components/containers';
import { TextInput as FormInput } from '@components/common/TextInput';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { formatDateTime } from '@utils/common/date';

const Details = ({ formData, onFieldChange, errors }) => {

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const handleFieldChange = (field, value) => {
    onFieldChange(field, value);
  };

  const handleDateConfirm = (date) => {
    handleFieldChange('dateTime', date);
    setIsDatePickerVisible(false);
  };

  return (
    <RoundedScrollContainer>
      <FormInput
        label="Date Time"
        dropIcon="calendar"
        editable={false}
        value={formatDateTime(formData.dateTime)}
        onPress={() => setIsDatePickerVisible(true)}
      />
      <FormInput
        label="Source"
        placeholder="Enter Source"
        editable={true}
        validate={errors.source}
        onChangeText={(value) => handleFieldChange('name', value)}
      />
      <FormInput
        label="Name"
        placeholder="Enter Name"
        editable={true}
        validate={errors.name}
        onChangeText={(value) => handleFieldChange('name', value)}
      />
      <FormInput
        label="Company Name"
        placeholder="Enter Company Name"
        editable={true}
        validate={errors.companyName}
        onChangeText={(value) => handleFieldChange('companyName', value)}
      />
      <FormInput
        label="Phone"
        placeholder="Enter Phone Number"
        editable={true}
        keyboardType="numeric"
        validate={errors.phoneNumber}
        onChangeText={(value) => handleFieldChange('phoneNumber', value)}
      />
      <FormInput
        label="Email"
        placeholder="Enter Email"
        editable={true}
        validate={errors.emailAddress}
        onChangeText={(value) => handleFieldChange('emailAddress', value)}
      />
      <FormInput
        label="Address"
        placeholder="Enter Address"
        editable={true}
        validate={errors.address}
        onChangeText={(value) => handleFieldChange('address', value)}
      />
      <FormInput
        label="Enquiry Details"
        placeholder="Enter Enquiry Details"
        editable={true}
        multiline={true}
        numberOfLines={5}
        textAlignVertical="top"
        marginTop={10}
        onChangeText={(value) => handleFieldChange('enquiryDetails', value)}
      />
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setIsDatePickerVisible(false)}
      />
    </RoundedScrollContainer>
  );
};

export default Details;

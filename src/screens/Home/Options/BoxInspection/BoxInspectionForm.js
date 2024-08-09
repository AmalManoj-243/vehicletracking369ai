import React, { useState, useEffect } from 'react';
import { Keyboard, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { LoadingButton } from '@components/common/Button';
import { showToast } from '@utils/common';
import { post } from '@api/services/utils';
import { RoundedScrollContainer } from '@components/containers';
import { TextInput as FormInput } from '@components/common/TextInput';
import { DropdownSheet } from '@components/common/BottomSheets';
import { fetchboxNameDropdown, fetchsalesPersonDropdown } from '@api/dropdowns/dropdownApi';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAuthStore } from '@stores/auth';
import { formatDateTime } from '@utils/common/date';
import { validateFields } from '@utils/validation';

const BoxInspectionForm = ({ navigation }) => {
  const currentUser = useAuthStore(state => state.user?.related_profile?._id || '');
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDropdownType, setSelectedDropdownType] = useState(null);
  const [isDropdownSheetVisible, setIsDropdownSheetVisible] = useState(false);

  const [formData, setFormData] = useState({
    dateTime: new Date(),
    boxName: '',
    inspectedItems: '',
    salesPerson: { id: currentUser?.related_profile?._id || '', label: currentUser?.related_profile?.name },
    warehouseName: { id: currentUser?.related_profile?._id || '', label: currentUser?.related_profile?.warehouse_name },
  });
  
  const [errors, setErrors] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({
    boxName: [],
    salesPerson: [],
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [boxNameData, salesPersonData] = await Promise.all([
          fetchboxNameDropdown(),
          fetchsalesPersonDropdown(),
        ]);

        setDropdownOptions({
          boxName: boxNameData.map(data => ({
            id: data._id,
            label: data.box_name,
          })),
          salesPerson: salesPersonData.map(data => ({
            id: data._id,
            label: data.name,
          })),
        });
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to fetch dropdown data. Please try again later.',
        });
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

  const toggleDropdownSheet = (type) => {
    setSelectedDropdownType(type);
    setIsDropdownSheetVisible(prevState => !prevState);
  };

  const handleDateConfirm = (date) => {
    handleFieldChange('dateTime', date);
    setIsDatePickerVisible(false);
  };

  const renderDropdownSheet = () => {
    if (selectedDropdownType === 'Box Name') {
      return (
        <DropdownSheet
          isVisible={isDropdownSheetVisible}
          items={dropdownOptions.boxName}
          title={selectedDropdownType}
          onClose={() => setIsDropdownSheetVisible(false)}
          onValueChange={(value) => handleFieldChange('boxName', value)}
        />
      );
    }
    if (selectedDropdownType === 'Sales Person') {
      return (
        <DropdownSheet
          isVisible={isDropdownSheetVisible}
          items={dropdownOptions.salesPerson}
          title={selectedDropdownType}
          onClose={() => setIsDropdownSheetVisible(false)}
          onValueChange={(value) => handleFieldChange('salesPerson', value)}
        />
      );
    }
    return null;
  };

  const validateForm = (fieldsToValidate) => {
    Keyboard.dismiss();
    const { isValid, errors } = validateFields(formData, fieldsToValidate);
    setErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    const fieldsToValidate = ['boxName', 'salesPerson'];
    if (validateForm(fieldsToValidate)) {
      setIsSubmitting(true);
      const boxInspectionData = {
        date: formData.dateTime || null,
        boxName_id: formData.boxName?.id ?? null,
        sales_person_id: formData.salesPerson?.id || null,
        inspectedItems: formData.inspectedItems || null,
      };

      try {
        const response = await post("/createBoxInspection", boxInspectionData);
        if (response.success) {
          showToast({
            type: 'success',
            title: 'Success',
            message: response.message || 'Box Inspection created successfully',
          });
          navigation.navigate("BoxInspectionScreen");
        } else {
          showToast({
            type: 'error',
            title: 'Error',
            message: response.message || 'Box Inspection failed',
          });
        }
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'An unexpected error occurred. Please try again later.',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAddItemsPress = () => {
    navigation.navigate("AddInspectionItems");
  };

  return (
    <SafeAreaView>
      <NavigationHeader
        title="Add Box Inspection"
        onBackPress={() => navigation.goBack()}
      />
      <RoundedScrollContainer>
        <FormInput
          label="Date Time"
          dropIcon="calendar"
          editable={false}
          value={formatDateTime(formData.dateTime)}
          onPress={() => setIsDatePickerVisible(true)}
        />
        <FormInput
          label="Box Name"
          required
          placeholder="Select Box Name"
          dropIcon="menu-down"
          editable={false}
          validate={errors.boxName}
          value={formData.boxName?.label || ''}
          onPress={() => toggleDropdownSheet('Box Name')}
        />
        <FormInput
          label="Inspected Items"
          placeholder="Enter Inspected Items"
          editable
          keyboardType="numeric"
          validate={errors.inspectedItems}
          onChangeText={(value) => handleFieldChange('inspectedItems', value)}
        />
        <FormInput
          label="Sales Person"
          placeholder="Select Sales Person"
          dropIcon="menu-down"
          editable={false}
          required
          validate={errors.salesPerson}
          value={formData.salesPerson?.label || ''}
          onPress={() => toggleDropdownSheet('Sales Person')}
        />
        {renderDropdownSheet()}

        <View style={styles.inspectionItemsContainer}>
          <Text style={styles.inspectionItemsLabel}>Inspection Items</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddItemsPress}>
            <Text style={styles.addButtonText}>Add Items</Text>
          </TouchableOpacity>
        </View>

        <LoadingButton title="SAVE" onPress={handleSubmit} loading={isSubmitting} marginTop={10} />
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={() => setIsDatePickerVisible(false)}
        />
      </RoundedScrollContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  inspectionItemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  inspectionItemsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BoxInspectionForm;

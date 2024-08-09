import React, { useState, useEffect } from 'react';
import { Keyboard, View } from 'react-native';
import { SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { LoadingButton } from '@components/common/Button';
import { showToast } from '@utils/common';
import { post } from '@api/services/utils';
import { RoundedScrollContainer } from '@components/containers';
import { TextInput as FormInput } from '@components/common/TextInput';
import { DropdownSheet } from '@components/common/BottomSheets';
import { fetchProductsDropdown, fetchUomDropdown } from '@api/dropdowns/dropdownApi';
import { useAuthStore } from '@stores/auth';
import { validateFields } from '@utils/validation';

const AddInspectionItems = ({ navigation, route }) => {

  const { addInspectedItems } = route?.params
  const currentUser = useAuthStore(state => state.user);
  console.log("🚀 ~ file: AddInspectionItems.js:17 ~ AddInspectionItems ~ currentUser:", currentUser)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDropdownType, setSelectedDropdownType] = useState(null);
  const [isDropdownSheetVisible, setIsDropdownSheetVisible] = useState(false);

  const [formData, setFormData] = useState({
    productName: { id: currentUser?.related_profile?._id || '', label: currentUser?.related_profile?.product_name || '' },
    boxQuantity: '',
    inspectedQuantity: '',
    uomName: '',
  });

  const [errors, setErrors] = useState({});
  const [dropdowns, setDropdowns] = useState({
    productName: [],
    uomName: [],
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const productsData = await fetchProductsDropdown();
        const uomData = await fetchUomDropdown();
        setDropdowns({
          productName: productsData.map(data => ({
            id: data._id,
            label: data.product_name,
          })),
            uomName: uomData.map(data => ({
              id: data._id,
              label: data.uom_name,
            })),  
        });
      } catch (error) {
        console.error('Error fetching dropdown data:', error.message || error);
        showToast({
          type: 'error',
          title: 'Error',
          message: `Failed to fetch dropdown data: ${error.message || 'Please try again later.'}`,
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

  const renderBottomSheet = () => {
    let items = [];
    let fieldName = '';

    switch (selectedDropdownType) {
      case 'Product Name':
        items = dropdowns.productName;
        fieldName = 'productName';
        break;
      case 'Unit Of Measure':
        items = dropdowns.uomName;
        fieldName = 'uomName';
        break;
      default:
        return null;
    }

    return (
      <DropdownSheet
        isVisible={isDropdownSheetVisible}
        items={items}
        title={selectedDropdownType}
        onClose={() => setIsDropdownSheetVisible(false)}
        onValueChange={(value) => handleFieldChange(fieldName, value)}
      />
    );
  };

  const validateForm = (fieldsToValidate) => {
    Keyboard.dismiss();
    const { isValid, errors } = validateFields(formData, fieldsToValidate);
    setErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    const fieldsToValidate = ['productName', 'uomName'];
    if (validateForm(fieldsToValidate)) {
      setIsSubmitting(true);
      const boxInspectionData = {
        product_name_id: formData.productName?.id || null,
        boxQuantity: formData.boxQuantity || null,
        inspectedItems: parseInt(formData.inspectedQuantity, 10) || null,
        uom_name_id: formData.uomName?.id || null,
      };
      addInspectedItems(boxInspectionData)
    }
  };

  return (
    <SafeAreaView>
      <NavigationHeader
        title="Add Inspection Items"
        onBackPress={() => navigation.goBack()}
      />
      <RoundedScrollContainer>
        <FormInput
          label="Product Name"
          placeholder="Select Product Name"
          required
          dropIcon="menu-down"
          editable={false}
          validate={errors.productName}
          value={formData.productName?.label || ''}
          onPress={() => toggleDropdownSheet('Product Name')}
        />
        <FormInput
          label="Box Quantity"
          placeholder="Enter Box Quantity"
          editable
          keyboardType="numeric"
          validate={errors.boxQuantity}
          onChangeText={(value) => handleFieldChange('boxQuantity', value)}
        />
        <FormInput
          label="Inspected Quantity"
          placeholder="Enter Inspected Quantity"
          editable
          keyboardType="numeric"
          validate={errors.inspectedQuantity}
          onChangeText={(value) => handleFieldChange('inspectedQuantity', value)}
        />
        <FormInput
          label="Unit Of Measure"
          placeholder="Select Unit Of Measure"
          required
          dropIcon="menu-down"
          editable={false}
          validate={errors.uomName}
          value={formData.uomName?.label || ''}
          onPress={() => toggleDropdownSheet('Unit Of Measure')}
        />
        {renderBottomSheet()}
        <LoadingButton title="SAVE" onPress={handleSubmit} loading={isSubmitting} marginTop={10} />
      </RoundedScrollContainer>
    </SafeAreaView>
  );
};

export default AddInspectionItems;

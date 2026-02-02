import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { NavigationHeader } from '@components/Header';
import { SafeAreaView, RoundedScrollContainer } from '@components/containers';
import { TextInput as FormInput } from '@components/common/TextInput';
import { LoadingButton } from '@components/common/Button';
import Text from '@components/Text';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import { formatDate } from '@utils/common/date';
import { showToastMessage } from '@components/Toast';
import { post } from '@api/services/utils';
import { OverlayLoader } from '@components/Loader';

const CashCollectionForm = ({ navigation, route }) => {
  const { date, collectionData } = route?.params || {};
  const isEditMode = !!collectionData;

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    amount: '',
    payment_method: 'Cash',
    date: date || formatDate(new Date()),
    invoice_number: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (collectionData) {
      setFormData({
        customer_name: collectionData.customer_name || '',
        amount: String(collectionData.amount || ''),
        payment_method: collectionData.payment_method || 'Cash',
        date: collectionData.date || formatDate(new Date()),
        invoice_number: collectionData.invoice_number || '',
        notes: collectionData.notes || '',
      });
    }
  }, [collectionData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToastMessage('Please fill all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API endpoint
      // const response = await post('/cashCollection', {
      //   ...formData,
      //   amount: parseFloat(formData.amount),
      // });

      // Placeholder success
      console.log('[CashCollection] Submitting:', formData);

      showToastMessage(
        isEditMode ? 'Cash collection updated successfully' : 'Cash collection saved successfully',
        'success'
      );

      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Error saving cash collection:', error);
      showToastMessage('Failed to save cash collection', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDateConfirm = (selectedDate) => {
    setShowDatePicker(false);
    handleInputChange('date', formatDate(selectedDate));
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavigationHeader
        title={isEditMode ? 'Edit Cash Collection' : 'New Cash Collection'}
        navigation={navigation}
      />

      <RoundedScrollContainer>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Customer Name */}
          <FormInput
            label="Customer Name *"
            placeholder="Enter customer name"
            value={formData.customer_name}
            onChangeText={(value) => handleInputChange('customer_name', value)}
            error={errors.customer_name}
          />

          {/* Amount */}
          <FormInput
            label="Amount (AED) *"
            placeholder="Enter amount"
            value={formData.amount}
            onChangeText={(value) => handleInputChange('amount', value)}
            keyboardType="decimal-pad"
            error={errors.amount}
          />

          {/* Payment Method */}
          <FormInput
            label="Payment Method"
            placeholder="Cash, Card, Bank Transfer, etc."
            value={formData.payment_method}
            onChangeText={(value) => handleInputChange('payment_method', value)}
          />

          {/* Invoice Number */}
          <FormInput
            label="Invoice Number"
            placeholder="Enter invoice number (optional)"
            value={formData.invoice_number}
            onChangeText={(value) => handleInputChange('invoice_number', value)}
          />

          {/* Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date *</Text>
            <FormInput
              placeholder="Select date"
              value={formData.date}
              editable={false}
              onPress={() => setShowDatePicker(true)}
              error={errors.date}
            />
          </View>

          {/* Notes */}
          <FormInput
            label="Notes"
            placeholder="Enter any additional notes"
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          {/* Submit Button */}
          <LoadingButton
            title={isEditMode ? 'Update Collection' : 'Save Collection'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </RoundedScrollContainer>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
        date={formData.date ? new Date(formData.date) : new Date()}
      />

      <OverlayLoader visible={loading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.urbanistSemiBold,
    color: COLORS.black,
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 20,
  },
});

export default CashCollectionForm;

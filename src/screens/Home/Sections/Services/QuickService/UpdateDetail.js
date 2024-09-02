import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from '@components/containers';
import NavigationHeader from '@components/Header/NavigationHeader';
import { RoundedScrollContainer } from '@components/containers';
import { DetailField } from '@components/common/Detail';
import { OverlayLoader } from '@components/Loader';
import { Button } from '@components/common/Button';
import SparePartsList from './SparePartsList';
import { formatDateTime } from '@utils/common/date';
import { showToastMessage } from '@components/Toast';
import { fetchServiceDetails } from '@api/details/detailApi';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import { post, put } from '@api/services/utils';
import { useAuthStore } from '@stores/auth';
import { showToast } from '@utils/common';
import { TextInput as FormInput } from '@components/common/TextInput';


const UpdateDetails = ({ route, navigation }) => {
  const { id } = route.params || {};
  const currentUser = useAuthStore((state) => state.user);
  const [details, setDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [sparePartsItems, setSparePartsItems] = useState([]);
  const [formData, setFormData] = useState({
    subTotal: null,
    serviceCharge: null,
  })

  const addSpareParts = (addedItems) => {
    setSparePartsItems(prevItems => [...prevItems, addedItems]);
  };

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const updatedDetails = await fetchServiceDetails(id);
      setDetails(updatedDetails[0] || {});
    } catch (error) {
      console.error('Error fetching service details:', error);
      showToastMessage('Failed to fetch service details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchDetails(id);
      }
    }, [id])
  );

  const handleJobApproveQuate = async (approveJobs) => {
    const requestPayload = {
      job_registration_id: id,
      date: new Date(),
      status: 'waiting for parts',
      created_by: currentUser?.related_profile?._id,
      created_by_name: currentUser?.related_profile?.name ?? '',
      assigned_to: details?.assignee_id ?? '',
      assigned_to_name: details?.assignee_name ?? null,
      warehouse_id: currentUser?.warehouse?.warehouse_id,
      warehouse_name: currentUser?.warehouse?.warehouse_name,
      job_diagnosis_ids: [{
        job_diagnosis_id: approveJobs.job_diagnosis_parts_result?.[0]?.job_diagnosis_id,
        job_diagnosis_parts: approveJobs.job_diagnosis_parts_result
      }],
      sales_person_id: currentUser?.related_profile?._id,
      sales_person_name: currentUser?.related_profile?.name,
    }
    console.log("🚀 ~ file: UpdateDetail.js:78 ~ handleJobApproveQuate ~ requestPayload:", JSON.stringify(requestPayload, null, 2))
    try {
      const response = await post("/createJobApproveQuote", requestPayload);
      console.log("🚀 ~ submit ~ response:", JSON.stringify(response, null, 2));
      if (response.success === 'true') {
        showToast({
          type: "success",
          title: "Success",
          message: response.message,
        });
        navigation.navigate("QuickServiceScreen");
      } else {
        showToast({
          type: "error",
          title: "ERROR",
          message: response.message,
        });
      }
    } catch (error) {
      console.error("Error job approvilng is failed:", error);
      showToast({
        type: "error",
        title: "ERROR",
        message: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }

  }

  // sub total = unitprice * quantity 
  // spareitems.map(items => items.unitprice items.quant)
  // sub total + service charge + tax 0.05 = total amount


  const handleSubmit = async () => {

    setIsSubmitting(true);
    const requestPayload = {
      _id: id,
      job_stage: 'Waiting for spare',
      create_job_diagnosis: [
        {
          job_registration_id: id,
          proposed_action_id: null,
          proposed_action_name: null,
          done_by_id: currentUser?.related_profile?._id || null,
          untaxed_total_amount: 120,
          done_by_name: currentUser?.related_profile?.name || '',
          parts_or_service_required: null,
          service_type: null,
          service_charge: parseInt(formData.serviceCharge, 0),
          total_amount: 100,
          parts: sparePartsItems.map((items) => ({
            product_id: items?.product.id,
            product_name: items?.product.label,
            description: items?.description,
            quantity: items?.quantity,
            uom_id: items?.uom?.id,
            uom: items?.uom.label,
            unit_price: items.unitPrice,
            unit_cost: '',
            tax_type_name: "vat 5%",
            tax_type_id: "648d9b54ef9cd868dfbfa37b"
          }))
        }
      ]
    }
    try {
      const response = await put("/updateJobRegistration", requestPayload);
      if (response.success === 'true') {
        handleJobApproveQuate(response);
        showToast({
          type: "success",
          title: "Success",
          message: response.message || "Spare Parts Request updated successfully",
        });
        navigation.navigate("QuickServiceScreen");
      } else {
        console.error("Submit Failed:", response.message);
        showToast({
          type: "error",
          title: "ERROR",
          message: response.message || "Spare Parts Request update failed",
        });
      }
    } catch (error) {
      console.error("Error Submitting Spare Parts Request:", error);
      showToast({
        type: "error",
        title: "ERROR",
        message: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NavigationHeader
        title="Update Details"
        onBackPress={() => navigation.goBack()}
      />
      <RoundedScrollContainer>
        <DetailField
          label="Customer"
          value={details?.customer_name?.trim() || '-'}
          multiline
          numberOfLines={3}
          textAlignVertical={'top'}
        />
        <DetailField label="Mobile Number" value={details?.customer_mobile || '-'} />
        <DetailField label="Email" value={details?.customer_email || '-'} />
        <DetailField label="Warehouse Name" value={details?.warehouse_name || '-'} />
        <DetailField label="Created On" value={formatDateTime(details.date)} />
        <DetailField label="Created By" value={details?.assignee_name || '-'} />
        <DetailField label="Brand Name" value={details?.brand_name || '-'} />
        <DetailField label="Device Name" value={details?.device_name || '-'} />
        <DetailField label="Consumer Model" value={details?.consumer_model_name || '-'} />
        <FormInput
          label="Service Charge"
          placeholder="Enter Service Charge"
          keyboardType="numeric"
          value={formData.serviceCharge}
          onChangeText={(value) => setFormData({ ...formData, serviceCharge: value })}
        />
        <View style={{ justifyContent: 'space-between', flexDirection: 'row', marginVertical: 10 }}>
          <Text style={styles.label}>Add an Item</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('AddSpareParts', { id, addSpareParts })}>
            <AntDesign name="pluscircle" size={26} color={COLORS.orange} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={sparePartsItems}
          renderItem={({ item }) => (
            <SparePartsList item={item} />
          )}
          keyExtractor={(item, index) => index.toString()}
        />
        <Button
          title={'SUBMIT'}
          width={'50%'}
          alignSelf={'center'}
          backgroundColor={COLORS.orange}
          onPress={handleSubmit}
        />

      </RoundedScrollContainer>
      {isLoading && <OverlayLoader />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  label: {
    marginVertical: 5,
    fontSize: 16,
    color: COLORS.primaryThemeColor,
    fontFamily: FONT_FAMILY.urbanistSemiBold,
  },
});

export default UpdateDetails;

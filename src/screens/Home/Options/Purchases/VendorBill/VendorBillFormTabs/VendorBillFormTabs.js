import * as React from 'react';
import { useWindowDimensions, KeyboardAvoidingView, Platform, Keyboard, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TabView } from 'react-native-tab-view';
import { useState, useCallback } from 'react';
import { useAuthStore } from "@stores/auth";
import { SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { LoadingButton } from '@components/common/Button';
import { showToast } from '@utils/common';
import { fetchPurchaseOrderDetails } from '@api/details/detailApi';
import { post } from '@api/services/utils';
import { validateFields } from '@utils/validation';
import { CustomTabBar } from '@components/TabBar';
import VendorDetails from './VendorDetails';
import DateDetails from './DateDetails';
import OtherDetails from './OtherDetails';

const VendorBillFormTabs = ({ navigation, route }) => {

  const layout = useWindowDimensions();
  const { id: vendorBillId } = route?.params || {};
  const [details, setDetails] = useState({});
  console.log(details)
  const currentUser = useAuthStore((state) => state.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Vendor Details' },
    { key: 'second', title: 'Date & Details' },
    { key: 'third', title: 'Other Details' },
  ]);

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const updatedDetails = await fetchPurchaseOrderDetails(vendorBillId);
        if (updatedDetails && updatedDetails[0]) {
          setDetails(updatedDetails[0]);
          setDeliveryNotes(updatedDetails[0]?.products_lines || []);
        }
      } catch (error) {
        console.error('Error fetching purchase order details:', error);
        showToastMessage('Failed to fetch purchase order details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    useFocusEffect(
      useCallback(() => {
        if (vendorBillId) {
          fetchDetails();
        }
      }, [vendorBillId])
    );

  const [formData, setFormData] = useState({
    vendorName: "",
    purchaseType: "",
    countryOfOrigin: "",
    currency: "",
    amountPaid: "",
    paymentMode: "",
    date: new Date(), 
    trnnumber: "",
    orderDate: new Date(),
    billDate: new Date(),
    salesPerson: "",
    warehouse: { id: currentUser?.warehouse?.warehouse_id || '', label: currentUser?.warehouse?.warehouse_name },
    reference: "",
  });
  // console.log("🚀 ~ VendorBillFormTabs ~ formData:", JSON.stringify(formData, null, 2));

  const handleFieldChange = (field, value) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [field]: null
      }));
    }
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'first':
        return <VendorDetails formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
      case 'second':
        return <DateDetails formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
      case 'third':
        return <OtherDetails formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
      default:
        return null;
    }
  };

  const validateForm = (fieldsToValidate) => {
    Keyboard.dismiss();
    const { isValid, errors } = validateFields(formData, fieldsToValidate);
    console.log("Validation errors:", errors);
    setErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    const fieldsToValidate = ['vendor', 'purchaseType', 'countryOfOrigin', 'currency', 'amountPaid', 'paymentMode', 'salesPerson', 'warehouse'];
    if (validateForm(fieldsToValidate)) {
      setIsSubmitting(true);
      const vendorData = {
          supplier :  "670675464e15450d26ba8eb8",
          supplier_name :  "MEC TECHNOLOGY",
          Trn_number : "null",
          vendor_reference :   "",
          currency :  "6540b68c05fb79149c3eb7d8" ,
          purchase_type :  "Local Purchase" ,
          country :  "6540b68405fb79149c3eb5c2" ,
          bill_date :  "2024-12-26T15:48" ,
          ordered_date :  "2024-12-26T15:48" ,
          warehouse :  "66307fc0ceb8eb834bb25509" ,
          untaxed_total_amount : "200",
          total_amount : "210",
          date :  "2024-12-26T15:48" ,
          remarks :  "",
          due_date : "",
          due_amount : 210,
          paid_amount : 0,
          payment_status :  un_paid ,
          vendor_bill_status :  un_paid ,
          products_lines : [
            {
              product :  "66c59e94607e1e2b7e3cbd41" ,
              product_name :  "\t[31320691661271] LAPTOP HARD DISC DRIVE NEW SSD SAMSUNG 1TB" ,
              description : null,
              quantity : 1,
              unit_price : 200,
              sub_total : 200,
              tax_value : 10,
              scheduled_date :  2024-12-26 ,
              recieved_quantity : 0,
              billed_quantity : 0,
              product_unit_of_measure :  Kilo ,
              taxes :  "648d9b54ef9cd868dfbfa37b" ,
              return_quantity : 0,
              processed : false
            }
          ],
          payment_date : "",
          amount : 210,
          type :  expense ,
          chq_no : null,
          chq_date : "",
          chq_type : null,
          chart_of_accounts_id : null,
          chart_of_accounts_name : null,
          status :  paid ,
          transaction_no : null,
          transaction : null,
          payment_method_id :  "643ea581407e36e9962b9d2c" ,
          payment_method_name :  credit ,
          journal_id : null,
          chq_bank_id : null,
          issued_cheque : false,
          is_cheque_cleared : true,
          in_amount : 0,
          out_amount : 210,
          outstanding : 210,
          due_balance : 210,
          credit_balance : null,
          reference : null,
          time_zone :  Asia/Dubai ,
          warehouse_name : "",
          warehouse_id :  "66307fc0ceb8eb834bb25509" ,
          total_tax_amount : 10,
          company : null,
          sales_person_id :  "663097d0ceb8eb834bb2558c" ,
          sales_person_name : "",
          purchase_order_id : null,
          cheque_transaction_type : "",
          chq_book_id : null,
          chq_book_line_id : null,
          chq_bank_name : "",
          is_asset : false,
          image_url : [],
          ledger_name : "",
          ledger_type : "",
          ledger_id : null,
          ledger_display_name : "",
          online_transaction_type :  done ,
          card_transaction_type :  done ,
          is_estimation : false,
          partner_id :  "670675464e15450d26ba8eba" ,
          partner_name :  "MEC TECHNOLOGY" 
       }
      console.log("🚀 ~ submit ~ vendorData:", JSON.stringify(vendorData, null, 2));
      try {
        const response = await post("/createCombinedVendorBillPaymentMade", vendorData);
        if (response.success === 'true') {
          showToast({
            type: "success",
            title: "Success",
            message: response.message || "Vendor Bill created successfully",
          });

          navigation.navigate("VendorBillScreen");
        } else {
          console.error("Vendor Bill Failed:", response.message);
          showToast({
            type: "error",
            title: "ERROR",
            message: response.message || "Vendor Bill creation failed",
          });
        }
      } catch (error) {
        console.error("Error Creating Vendor Bill Failed:", error);
        showToast({
          type: "error",
          title: "ERROR",
          message: "An unexpected error occurred. Please try again later.",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <SafeAreaView>
      <NavigationHeader
        title="Vendor Bill Creation"
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          renderTabBar={props => <CustomTabBar {...props} />} onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
        />
      </KeyboardAvoidingView>
      <View style={{ backgroundColor: 'white', paddingHorizontal: 50, paddingBottom: 12 }}>
        <LoadingButton onPress={handleSubmit} title={'Submit'} loading={isSubmitting} />
      </View>
    </SafeAreaView>
  );
};

export default VendorBillFormTabs;
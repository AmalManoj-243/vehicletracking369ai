import * as React from 'react';
import { useWindowDimensions, KeyboardAvoidingView, Platform, Keyboard, View } from 'react-native';
import { TabView } from 'react-native-tab-view';
import { useState } from 'react';
import { SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { LoadingButton } from '@components/common/Button';
import { showToast } from '@utils/common';
import { post } from '@api/services/utils';
import { validateFields } from '@utils/validation';
import { CustomTabBar } from '@components/TabBar';
import CustomerDetails from './CustomerDetails';
import Product from './Product';
import Assignee from './Assignee';
import Accessories from './Accessories';
import Complaints from './Complaints';

const ServiceFormTabs = ({ navigation }) => {

  const layout = useWindowDimensions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Customer Details' },
    { key: 'second', title: 'Product' },
    { key: 'third', title: 'Assignee' },
    { key: 'fourth', title: 'Accessories' },
    { key: 'fifth', title: 'Complaints' },
  ]);

    const [formData, setFormData] = useState({
        customerName: "",
        phoneNumber: "",
        emailAddress: "",
        address: "",
        trn: null,
        warehouse: "",
        device: "",
        brand: "",
        consumerModel: "",
        serialNumber: "",
        imeiNumber: "",
        assignedTo: "",
        preCondition: "",
        estimation: "",
        remarks: "",
        accessories: "",
        complaints: "",
        subComplaints: "",
    });

    const [errors, setErrors] = useState({});

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

    console.log("🚀 ~ ServiceFormTabs ~ formData:", JSON.stringify(formData, null, 2));

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'first':
        return <CustomerDetails formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
      case 'second':
        return <Product formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
      case 'third':
        return <Assignee formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
      case 'fourth':
        return <Accessories formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
      case 'fifth':
        return <Complaints formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
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
  const fieldsToValidate = ['customerName', 'phoneNumber', 'device', 'brand', 'consumerModel', 'serialNumber', 'assignedTo'];
    if (validateForm(fieldsToValidate)) {
      setIsSubmitting(true);
      const serviceData = {
        customer_name: formData.customerName?.label ?? null,
        phone_no: formData.phoneNumber || null,
        email: formData.emailAddress || null,
        address: formData.address || null,
        trn_no: parseInt(formData.trn, 10) || null,
        warehouse_name: formData.warehouse?.label ?? null,
        device_name: formData.device?.label ?? null,
        brand_name: formData.brand?.label ?? null,
        consumer_model_name: formData.consumerModel?.label ?? null,
        serial_no: formData.serialNumber || null,
        imei_no: formData.imeiNumber || null,
        job_stage: "new",
        job_registration_type: "quick",
        assignee_name: formData.assignedTo?.label ?? null,
        pre_condition: formData.preCondition || null,
        estimation: formData.estimation || null,
        remarks: formData.remarks || null,
        accessories: formData.accessories?.label ?? null,
        complaints: formData.complaints?.label ?? null,
        sub_complaints: formData.subComplaints?.label ?? null,
      };
      console.log("🚀 ~ submit ~ serviceData:", JSON.stringify(serviceData, null, 2));

      try {
        const response = await post("/createJobRegistration", serviceData);
        console.log("🚀 ~ submit ~ response:", response);
        if (response.success === 'true') {
          showToast({
            type: "success",
            title: "Success",
            message: response.message || "Quick Service created successfully",
          });

          navigation.navigate("ServiceScreen");
        } else {
          console.error("Quick Service Failed:", response.message);
          showToast({
            type: "error",
            title: "ERROR",
            message: response.message || "Quick Service creation failed",
          });
        }
      } catch (error) {
        console.error("Error Creating Quick Service Failed:", error);
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
      title="Job Quick Registration "
      onBackPress={() => navigation.goBack()}
      // logo={false}
      // iconOneName='edit'
      // iconOnePress={() => navigation.navigate('EditService', { serviceId: id })}
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

export default ServiceFormTabs;

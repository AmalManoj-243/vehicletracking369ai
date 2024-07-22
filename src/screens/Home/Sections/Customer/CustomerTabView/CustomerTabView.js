import * as React from 'react';
import { useWindowDimensions, KeyboardAvoidingView, Platform, Keyboard, View } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { useState } from 'react';
import Details from './Details';
import OtherDetails from './OtherDetails';
import Address from './Address';
import ContactPerson from './ContactPerson';
import { SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import { LoadingButton } from '@components/common/Button';
import { showToast } from '@utils/common';
import { post } from '@api/services/utils';

const CustomTabBar = (props) => {
  return (
    <TabBar
      scrollEnabled={true}
      {...props}
      style={{
        backgroundColor: COLORS.orange,
        justifyContent: 'center',
      }}
      indicatorStyle={{ backgroundColor: COLORS.primaryThemeColor, height: 3 }}
      labelStyle={{ color: COLORS.white, fontFamily: FONT_FAMILY.urbanistBold, fontSize: 13, textTransform: 'capitalize' }}
      pressColor='#2e294e'
      pressOpacity={0.5}
    />
  );
};

const CustomerTabView = ({ navigation }) => {

  const layout = useWindowDimensions();
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    customerTypes: "",
    customerName: "",
    customerTitles: "",
    emailAddress: "",
    salesPerson: "",
    collectionAgent: "",
    modeOfPayment: "",
    mobileNumber: "",
    whatsappNumber: "",
    landlineNumber: "",
    fax: "",
    trn: "",
    customerBehaviour: "",
    customerAttitude: "",
    language: "",
    currency: "",
    isActive: false,
    isSupplier: false,
    address: "",
    country: "",
    state: "",
    area: "",
    poBox: "",
  });

  const [errors, setErrors] = useState({});

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

  console.log("🚀 ~ CustomerTabView ~ formData:", formData)

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'first':
        return <Details formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
      case 'second':
        return <OtherDetails formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
      case 'third':
        return <Address formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
      // case 'fourth':
      //   return <ContactPerson formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
      default:
        return null;
    }
  };

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Details' },
    { key: 'second', title: 'Other Details' },
    { key: 'third', title: 'Address' },
    // { key: 'fourth', title: 'Contact Person' },
  ]);

  const validate = () => {
    Keyboard.dismiss();
    let isValid = true;
    let errors = {};

    const requiredFields = {
      customerTypes: 'Please select Customer Type',
      customerName: 'Please enter Customer Name',
      customerTitles: 'Please select Customer Title',
      modeOfPayment: 'Please select Mode Of Payment',
      mobileNumber: "Please enter Mobile Number",
      address: 'Please enter the Address',
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


  const submit = async () => {
    if (validate()) {
      setIsSubmitting(true);

      const customerData = {
        customer_type: formData.customerTypes.label,
        name: formData.customerName,
        customer_title: formData.customerTitles.label,
        customer_email: formData.emailAddress,
        sales_person_id: formData.salesPerson.id,
        collection_agent_id: null,
        mode_of_payment: formData.modeOfPayment?.value,
        customer_mobile: formData.mobileNumber,
        whatsapp_no: formData.whatsappNumber,
        land_phone_no: formData.landlineNumber,
        fax: formData.fax,
        is_active: formData.isActive,
        is_supplier: formData.isSupplier,
        trn_no: formData.trn,
        customer_behaviour: formData.customerBehaviour,
        customer_atitude: formData.customerAttitude,
        language_id: formData.language.id,
        currency_id: formData.currency.id,
        address: formData.address,
        country_id: formData.country.id,
        state_id: formData.state.id,
        area_id: formData.area.id,
        po_box: formData.poBox,
      }
      console.log("🚀 ~ submit ~ customerData:", JSON.stringify(customerData, null, 2))
      try {
        const response = await post("/createCustomer", customerData);
        console.log("🚀 ~ submit ~ response:", response)
        if (response.success === 'true') {
          showToast({
            type: "success",
            title: "Success",
            message: response.message || "Customer created successfully",
          });
          navigation.navigate("CustomerScreen");
        } else {
          console.error("Customer Failed:", response.message);
          showToast({
            type: "error",
            title: "ERROR",
            message: response.message || "Customer creation failed",
          });
        }
      } catch (error) {
        console.error("Error Creating Customer Failed:", error);
        showToast({
          type: "error",
          title: "ERROR",
          message: "An unexpected error occurred. Please try again later.",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

  }
  return (
    <SafeAreaView>
      <NavigationHeader
        title="Add Customer"
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          renderTabBar={CustomTabBar}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
        />
      </KeyboardAvoidingView>

      <View style={{ backgroundColor: 'white', paddingHorizontal: 50 }}>
        <LoadingButton onPress={submit} title={'Submit'} loading={isSubmitting} />
      </View>
    </SafeAreaView>
  );
};

export default CustomerTabView;

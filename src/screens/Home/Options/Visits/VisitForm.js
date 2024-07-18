import { Keyboard } from 'react-native'
import React, { useState, useEffect } from 'react'
import { NavigationHeader } from '@components/Header'
import { RoundedScrollContainer, SafeAreaView } from '@components/containers'
import { TextInput as FormInput } from '@components/common/TextInput'
import { formatDate } from '@utils/common/date'
import { LoadingButton } from '@components/common/Button'
import { DropdownSheet } from '@components/common/BottomSheets'
import * as Location from 'expo-location';
import { fetchCustomersDropdown, fetchPurposeofVisitDropdown, fetchSiteLocationDropdown } from '@api/dropdowns/dropdownApi'
import { fetchCustomerDetails } from '@api/details/detailApi'
import { showToastMessage } from '@components/Toast'
import { useAuthStore } from '@stores/auth'
import { showToast } from '@utils/common'
import { post } from '@api/services/utils'

const VisitForm = ({ navigation }) => {

  const currentUser = useAuthStore((state) => state.user);
  const [selectedType, setSelectedType] = useState(null);
  const [errors, setErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customer: '',
    siteLocation: '',
    dateAndTime: new Date(),
    contactPerson: '',
    visitPurpose: '',
    remarks: '',
    longitude: null,
    latitude: null
  })

  const [isCustomerSelected, setIsCustomerSelected] = useState(false);

  useEffect(() => {
    setIsCustomerSelected(!!formData.customer);
  }, [formData.customer]);

  const [dropdowns, setDropdowns] = useState({
    customers: [],
    siteLocation: [],
    visitPurpose: [],
    contactPerson: []
  })

  useEffect(() => {
    (async () => {
      // Request permission to access location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      setFormData({
        ...formData,
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
      });
    })();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customersDropdown = await fetchCustomersDropdown();
        const visitPurposeDropdown = await fetchPurposeofVisitDropdown();
        setDropdowns(prevDropdown => ({
          ...prevDropdown,
          customers: customersDropdown.map((data) => ({
            id: data._id,
            label: data.name?.trim(),
          })),
          visitPurpose: visitPurposeDropdown.map((data) => ({
            id: data._id,
            label: data.name,
          })),
        }));
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (formData.customer) {
      const fetchSiteLocationData = async () => {
        try {
          const siteLocationDropdown = await fetchSiteLocationDropdown(formData.customer.id);
          setDropdowns(prevDropdown => ({
            ...prevDropdown,
            siteLocation: siteLocationDropdown.map(data => ({
              id: data._id,
              label: data.site_location_name,
            })),
          }));
        } catch (error) {
          console.error('Error fetching site dropdown data:', error);
        }
      };

      fetchSiteLocationData();
    }
  }, [formData.customer]);

  useEffect(() => {
    if (formData.customer) {
      const fetchContactDetails = async () => {
        try {
          const contactDetailsDropdown = await fetchCustomerDetails(formData.customer.id);
          setDropdowns(prevDropdown => ({
            ...prevDropdown,
            contactPerson: contactDetailsDropdown?.[0]?.customer_contact?.map(data => ({
              id: data._id,
              label: data.contact_name,
              contactNo: data.contact_number.toString()
            })),
          }));
        } catch (error) {
          console.error('Error fetching contacts dropdown data:', error);
        }
      };

      fetchContactDetails();
    }
  }, [formData.customer]);

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

  const toggleBottomSheet = (type) => {
    setSelectedType(type);
    setIsVisible(!isVisible);
  };

  const renderBottomSheet = () => {
    let items = [];
    let fieldName = '';

    switch (selectedType) {
      case 'Customers':
        items = dropdowns.customers;
        fieldName = 'customer';
        break;
      case 'Visit Purpose':
        items = dropdowns.visitPurpose;
        fieldName = 'visitPurpose';
        break;
      case 'Site Location':
        items = dropdowns.siteLocation;
        fieldName = 'siteLocation';
        break;
      case 'Contact Person':
        items = dropdowns.contactPerson;
        fieldName = 'contactPerson';
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
      siteLocation: 'Please select a brand',
      dateAndTime: 'Please select a date and time',
      contactPerson: 'Please select a purpose of visit',
      remarks: 'Please enter remarks',
      visitPurpose: 'Please enter a purpose of visit',
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
    const visitData = {
      employee_id: currentUser?.related_profile?._id,
      date_time: formData?.dateAndTime || null,
      customer_id: formData?.customer?.id,
      contact_no: formData?.contactPerson?.contactNo || null,
      // images: imageUrl || null,
      purpose_of_visit_id: formData?.visitPurpose?.id || null,
      remarks: formData?.remarks || null,
      site_location_id: formData?.siteLocation?.id || null,
      contact_person_id: formData?.contactPerson?.id || null,
      longitude: formData?.longitude || null,
      latitude: formData?.latitude || null,
    };
    console.log("🚀 ~ submit ~ visitData:", JSON.stringify(visitData, null, 5))
    try {
      const response = await post("/createCustomerVisitList", visitData);
      if (response.success) {
        showToast({
          type: "success",
          title: "Success",
          message: response.message || "Inventory Box Request created successfully",
        });
        navigation.navigate("InventoryScreen");
      } else {
        console.error("Inventory Box Request:", response.message);
        showToast({
          type: "error",
          title: "ERROR",
          message: response.message || "Inventory Box Request creation failed",
        });
      }
    } catch (error) {
      console.error("Error creating Inventory Box Request:", error);
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
        title="New Customer Visit"
        onBackPress={() => navigation.goBack()}
      />
      <RoundedScrollContainer>
        <FormInput
          label={"Date & Time"}
          dropIcon={"calendar"}
          editable={false}
          value={formatDate(formData.dateAndTime, 'dd-MM-yyyy hh:mm:ss')}
        />
        <FormInput
          label={"Customer Name"}
          placeholder={"Select Customer"}
          dropIcon={"menu-down"}
          editable={false}
          multiline={true}
          value={formData.customer?.label}
          validate={errors.customer}
          onPress={() => toggleBottomSheet('Customers')}
        />
        <FormInput
          label={"Site/Location"}
          placeholder={"Select Site / Location"}
          dropIcon={"menu-down"}
          editable={false}
          value={formData.siteLocation?.label}
          validate={errors.siteLocation}
          onPress={() => isCustomerSelected ? toggleBottomSheet('Site Location') : showToastMessage('Select Customer !')}
        />
        <FormInput
          label={"Contact Person"}
          placeholder={"Contact person"}
          dropIcon={"menu-down"}
          validate={errors.cotactPerson}
          value={formData.contactPerson?.label}
          editable={false}
          onPress={() => isCustomerSelected ? toggleBottomSheet('Contact Person') : showToastMessage('Select Customer !')}
        />
        <FormInput
          label={"Cotact No"}
          placeholder={"Contact person"}
          dropIcon={"menu-down"}
          editable={false}
          value={formData.contactPerson?.contactNo}
          onPress={() => isCustomerSelected ? null : showToastMessage('Select Customer !')}

        />
        <FormInput
          label={"Visit Purpose"}
          placeholder={"Select purpose of visit"}
          dropIcon={"menu-down"}
          editable={false}
          value={formData.visitPurpose?.label}
          validate={errors.visitPurpose}
          onPress={() => toggleBottomSheet('Visit Purpose')}
        />
        <FormInput
          label={"Remarks"}
          placeholder={"Enter Remarks"}
          multiline={true}
          numberOfLines={5}
          value={formData.remarks}
          validate={errors.remarks}
          onChangeText={(value) => handleFieldChange('remarks', value)}
        />
        {renderBottomSheet()}

        <LoadingButton title='SUBMIT' onPress={submit} loading={isSubmitting} />
      </RoundedScrollContainer>
    </SafeAreaView>
  )
}

export default VisitForm

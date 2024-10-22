import { View, Text, StyleSheet, TouchableOpacity, Keyboard, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { RoundedScrollContainer, SafeAreaView } from "@components/containers";
import { NavigationHeader } from "@components/Header";
import {
  fetchEmployeesDropdown,
  fetchWarehouseDropdown,
} from "@api/dropdowns/dropdownApi";
import { DropdownSheet } from "@components/common/BottomSheets";
import { TextInput as FormInput } from "@components/common/TextInput";
import { LoadingButton } from "@components/common/Button";
import DateTimePicker from "react-native-modal-datetime-picker";
import { COLORS, FONT_FAMILY } from "@constants/theme";
import AntDesign from "@expo/vector-icons/AntDesign";
import { DatePicker } from "@components/common/DatePicker";
import { formatDate } from "@utils/common/date";
import ProductLineList from "./ProductLineList";
import { useAuthStore } from "@stores/auth";
import { post } from "@api/services/utils";
import { OverlayLoader } from "@components/Loader";

const PurchaseRequisitionForm = ({ route,navigation }) => {
  const [dropdown, setDropdown] = useState({
    requestedByName: [],
    warehouse: [],
  });
  const { id } = route.params || {};
  const currentUser = useAuthStore((state) => state.user);
  const [isVisible, setIsVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [productLines, setProductLines] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    requestDate: new Date().toISOString().slice(0, 10) ,
    requestedBy: "",
    requireBy: "",
    warehouseId: "",
    productLines: [], 
    quantity: "",
    remarks: "",
    employeeName: "",
    requestDetails: [],
    alternateProducts: [],
  });
  console.log("formData is",formData);
  console.log('====================================');
  console.log("Data is",id);
  console.log('====================================');

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const requestedByNameData = await fetchEmployeesDropdown();
        setDropdown((prevDropdown) => ({
          ...prevDropdown,
          requestedByName: requestedByNameData.map((employee) => ({
            id: employee._id,
            label: employee.name,
          })),
        }));
      } catch (error) {
        console.log("error fetching requested by data:", error);
      }
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const warehouseData = await fetchWarehouseDropdown();
        setDropdown((prevDropdown) => ({
          ...prevDropdown,
          warehouse: warehouseData.map((data) => ({
            id: data._id,
            label: data.warehouse_name,
          })),
        }));
      } catch (error) {
        console.error("Error warehouse dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  const toggleBottomSheet = (type) => {
    setSelectedType(type);
    setIsVisible(!isVisible);
  };
  const handleDateConfirm = (date) => {
    const formattedDate = date.toISOString().slice(0, 10);
    handleFieldChange("requireBy", formattedDate);
    setIsDatePickerVisible(false);
  };

  const handleAddProductLine = (newProductLine) => {
    // Update the product lines state with the new product line
    setProductLines((prevLines) => [...prevLines, newProductLine]);
    setFormData((prevData) => ({
      ...prevData,
      productLines: [...prevData.productLines, newProductLine],
    }));
  };
  useEffect(() => {
    // Console log the product_lines data
    console.log("Received Product Lines:", productLines);
  }, [productLines]); // This will log the data whenever product_lines changes




  const renderBottomSheet = () => {
    let items = [];
    let fieldName = "";

    switch (selectedType) {
      case "RequestedBy Name":
        items = dropdown.requestedByName;
        fieldName: "requestedBy";
        break;
      case "Warehouse":
        items = dropdown.warehouse;
        fieldName = "warehouse";
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

  const handleSubmit = async () => {
      setIsSubmitting = true;
      const requestPayload = {
        request_date: formData.requestDate,
        requested_by: formData.requestedBy,
        require_by: formData.requestedBy,
        warehouse_id: formData.warehouseId,
        product_lines: productLines.map((items)=>({
          product_name: items?.product_name,
          product_id: items?.product_id,
          suppliers: items?.suppliers,
          quantity: items?.quantity,
          remarks: items?.remarks
        }))

      }
      try{
        const response = await post("/createPurchaseRequest",requestPayload);
        console.log("Submitting Purchase Requisition : ", requestPayload);
        if (response.success === 'true'){
          showToast({
            type: "success",
            title: "Success",
            message: response.message || "Purchase Requisition created successfully",
          });
          navigation.navigate("PurchaseRequisitionScreen");
        }
      } catch(error){
        console.error("Error Submitting Purchase Requisition:", error);
      showToast({
        type: "error",
        title: "ERROR",
        message: "An unexpected error occurred. Please try again later.",
      });
      } finally{
        setIsSubmitting(false);
      }
  }
  const validateForm = (fieldsToValidate) => {
    Keyboard.dismiss();
    const { isValid, errors } = validateFields(formData, fieldsToValidate);
    setErrors(errors);
    return isValid;
  };

  return (
    <SafeAreaView>
      <NavigationHeader
        title="Purchase Requisition Creation"
        onBackPress={() => navigation.goBack()}
        logo={false}
      />
      <RoundedScrollContainer>
        <FormInput
          label={"Requested By"}
          placeholder={"Select Employee Name"}
          dropIcon={"menu-down"}
          items={dropdown.requestedByName}
          editable={false}
          required
          onPress={() => toggleBottomSheet("RequestedBy Name")}
        />

        <FormInput
          label={"Warehouse"}
          placeholder={"Select Warehouse"}
          dropIcon={"menu-down"}
          items={dropdown.warehouse}
          editable={false}
          required
          onPress={() => toggleBottomSheet("Warehouse")}
        />

        <FormInput
         label={"Requested Date"} 
         editable={false} 
         value={formatDate(formData.requestDate)}
         />

        <FormInput
          label={"Require By"}
          dropIcon={"calendar"}
          placeholder={"dd-mm-yyyy"}
          editable={false}
          value={formatDate(formData.requireBy)}
          onPress={() => setIsDatePickerVisible(true)}
        />

        <View
          style={{
            justifyContent: "space-between",
            flexDirection: "row",
            marginVertical: 10,
          }}
        >
          <Text style={styles.label}>Add an Item</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("AddProductLines")}
          >
            <AntDesign name="pluscircle" size={26} color={COLORS.orange} />
          </TouchableOpacity>
        </View>
        <FlatList 
        data={productLines}
        renderItem={({item}) => (
          <ProductLineList item={item}/>
        )}
        keyExtractor={(item, index) => index.toString()}
        />

        {renderBottomSheet()}
        <LoadingButton
          title="SAVE"
          onPress={handleSubmit}
          // loading={isSubmitting}
          marginTop={10}
        />
        <DateTimePicker
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={() => setIsDatePickerVisible(false)}
        />
      </RoundedScrollContainer>
      <OverlayLoader visible={isLoading || isSubmitting} />
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
  totalSection: {
    flexDirection: "row",
    marginVertical: 5,
    margin: 10,
    alignSelf: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.urbanistBold,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.urbanistBold,
    color: "#666666",
  },
});

export default PurchaseRequisitionForm;

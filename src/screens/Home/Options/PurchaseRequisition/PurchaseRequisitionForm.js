import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { RoundedScrollContainer, SafeAreaView } from "@components/containers";
import { NavigationHeader } from "@components/Header";
import { fetchEmployeesDropdown } from "@api/dropdowns/dropdownApi";
import { DropdownSheet } from "@components/common/BottomSheets";
import { TextInput as FormInput } from "@components/common/TextInput";
import { LoadingButton } from "@components/common/Button";
import DateTimePicker from "react-native-modal-datetime-picker";
import { COLORS, FONT_FAMILY } from "@constants/theme";
import AntDesign from "@expo/vector-icons/AntDesign";

const PurchaseRequisitionForm = ({ navigation }) => {
  const [dropdown, setDropdown] = useState({
    requestedByName: [],
    warehouse: [],
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

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
    handleFieldChange("dateTime", date);
    setIsDatePickerVisible(false);
  };

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
        onValueChange={(value) => onFieldChange(fieldName, value)}
      />
    );
  };

  return (
    <SafeAreaView>
      <NavigationHeader
        title="Purchase Requisition Creation"
        onBackPress={() => navigation.goBack()}
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

        <FormInput label={"Requested Date"} editable={false} />

        <FormInput
          label={"Require By"}
          dropIcon={"calendar"}
          placeholder={"dd-mm-yyyy"}
          editable={false}
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

        {renderBottomSheet()}
        <LoadingButton
          title="SAVE"
          // onPress={handleSubmit}
          // loading={isSubmitting}
          marginTop={10}
        />
        <DateTimePicker
          isVisible={isDatePickerVisible}
          mode="datetime"
          onConfirm={handleDateConfirm}
          onCancel={() => setIsDatePickerVisible(false)}
        />
      </RoundedScrollContainer>
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

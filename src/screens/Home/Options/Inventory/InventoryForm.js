import React, { useState, useEffect } from "react";
import { FlatList, View } from "react-native";
import { RoundedScrollContainer, SafeAreaView } from "@components/containers";
import { NavigationHeader } from "@components/Header";
import { TextInput as FormInput } from "@components/common/TextInput";
import { DropdownSheet } from "@components/common/BottomSheets";
import {
  fetchInvoiceDropdown,
  fetchPurchaseReturnDropdown,
  fetchSalesReturnDropdown,
  fetchServiceDropdown,
  fetchServiceReturnDropdown,
  fetchStockTransferDropdown,
  fetchVendorBillDropdown,
} from "@api/dropdowns/dropdownApi";
import InventoryRequestItem from "./InventoryRequestItem";
import Text from "@components/Text";
import { styles } from "./styles";
import { Button } from "@components/common/Button";
import { COLORS } from "@constants/theme";
import { showToastMessage } from "@components/Toast";
import { post, put } from "@api/services/utils";
import useAuthStore from "@stores/auth/authStore";
import Toast from "react-native-toast-message";
import { OverlayLoader } from "@components/Loader";

const InventoryForm = ({ navigation, route }) => {
  const { inventoryDetails = {}, reason = {} } = route?.params || {};

  const [itemsList, setItemsList] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [chosenItem, setChosenItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const currentUser = useAuthStore((state) => state.user);
  const [showButton, setShowButton] = useState(false);
  const isResponsible = (userId) =>
    currentUser && userId === currentUser.related_profile._id;

  const hasPermission = () =>
    currentUser &&
    (isResponsible(inventoryDetails?.responsible_person?._id) ||
      inventoryDetails?.employees?.some((employee) =>
        isResponsible(employee._id)
      ));

  const tempPermission = () =>
    currentUser &&
    inventoryDetails?.temp_assignee?.some((temp) => isResponsible(temp._id));

  const showSubmitButton =
    (hasPermission() || (tempPermission() && showButton)) && !loading;

  // One-time assignee related state and effect
  useEffect(() => {
    const type = inventoryDetails?.type_of_assign;
    if (type === "one_time" && tempPermission()) {
      setShowButton(true);
    }
  }, [inventoryDetails, currentUser]);

  // Check if the button should be shown or hidden based on time
  useEffect(() => {
    if (
      inventoryDetails?.from_date &&
      inventoryDetails?.type_of_assign === "one_hour"
    ) {
      const fromDate = new Date(inventoryDetails?.from_date);
      const currentTime = new Date();
      const oneHourLater = new Date(fromDate.getTime() + 60 * 60 * 1000);
      setShowButton(currentTime <= oneHourLater && currentTime >= fromDate);
    }
  }, [inventoryDetails]);

  const [formData, setFormData] = useState({
    reason: reason,
    sales: "",
    service: "",
    purchase: "",
    serviceReturn: "",
    purchaseReturn: "",
    salesReturn: "",
    stockTransfer: "",
    remarks: "",
  });

  const [dropdown, setDropdown] = useState({
    invoice: [],
    service: [],
    serviceReturn: [],
    purchaseReturn: [],
    salesReturn: [],
    stockTransfer: [],
    vendorBill: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invoiceDropdown = await fetchInvoiceDropdown();
        const purchaseReturnDropdown = await fetchPurchaseReturnDropdown();
        const salesReturnDropdown = await fetchSalesReturnDropdown();
        const serviceDropdown = await fetchServiceDropdown();
        const serviceReturnDropdown = await fetchServiceReturnDropdown();
        const stockTransferDropdown = await fetchStockTransferDropdown();
        const vendorBillDropdown = await fetchVendorBillDropdown();

        setDropdown({
          invoice: invoiceDropdown.map((data) => ({
            id: data._id,
            label: data.sequence_no,
          })),
          purchaseReturn: purchaseReturnDropdown.map((data) => ({
            id: data._id,
            label: data.sequence_no,
          })),
          salesReturn: salesReturnDropdown.map((data) => ({
            id: data._id,
            label: data.sequence_no,
          })),
          service: serviceDropdown.map((data) => ({
            id: data._id,
            label: data.sequence_no,
          })),
          serviceReturn: serviceReturnDropdown.map((data) => ({
            id: data._id,
            label: data.sequence_no,
          })),
          stockTransfer: stockTransferDropdown.map((data) => ({
            id: data._id,
            label: data.sequence_no,
          })),
          vendorBill: vendorBillDropdown.map((data) => ({
            id: data._id,
            label: data.sequence_no,
          })),
        });
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setItemsList(
      inventoryDetails?.items.map((item) => ({
        ...item,
        quantity: reason.id === "viewing" ? 0 : item.quantity === 0 ? 0 : 1,
        initialQuantity: item?.quantity
      }))
    );
  }, [inventoryDetails?.items, reason.id]);

  useEffect(() => {
    if (itemsList.length === 1) {
      handleChooseItem(itemsList[0]);
    }
  }, [itemsList]);

  const handleFieldChange = (field, value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [field]: value,
    }));
  };

  // Filter items to display only the chosen item or all items
  const displayItems = chosenItem ? [chosenItem] : itemsList;
  const handleChooseItem = (item) => {
    // Toggle chosen state
    if (chosenItem === item) {
      setChosenItem(null);
      // Unchoose the same item
    } else {
      setChosenItem({ ...item, chosen: true });
    }
  };

  const handleQuantityChange = (id, text) => {
    if (!formData.reason) {
      showToastMessage("Please select a reason first.");
      return;
    }
    const newQuantity = parseInt(text) || 0;
    // Extract the maximum quantity from inventoryData
    const maxQuantity = inventoryDetails?.items.find(
      (dataItem) => dataItem._id === id
    )?.quantity;
    // Check if the reason requires quantity validation
    const reasonRequiresQuantityCheck = ![
      "purchase",
      "salesreturn",
      "servicereturn",
      "stocktransferreceive",
      "viewingreturn",
    ].includes(formData.reason.id);
    if (reasonRequiresQuantityCheck && newQuantity > maxQuantity) {
      showToastMessage(
        `Please enter a quantity less than or equal to ${maxQuantity}`
      );
      return;
    }
    if (chosenItem) {
      setChosenItem({ ...chosenItem, quantity: newQuantity });
    }
    const updatedItems = itemsList.map((oldItem) => {
      if (oldItem._id === id) {
        return { ...oldItem, quantity: newQuantity };
      }
      return oldItem;
    });
    setItemsList(updatedItems);
  };

  const handleInventoryBoxRequest = async () => {
    if (!formData.reason) {
      showToastMessage("Please select a reason.");
      return;
    }

    if (!chosenItem) {
      showToastMessage("Please choose an item.");
      return;
    }
    setLoading(true);

    let itemsToSubmit = displayItems.length > 0 ? displayItems : [];
    // Remove the 'chosen' key from the items
    itemsToSubmit = itemsToSubmit.map(({ chosen, ...rest }) => rest);

    const getReferenceId = () =>
      formData.sales?.id ||
      formData.service?.id ||
      formData.purchase?.id ||
      formData.stockTransfer?.id ||
      formData.purchaseReturn?.id ||
      formData.salesReturn?.id ||
      formData.serviceReturn?.id ||
      "";

    const getReferenceLabel = () =>
      formData.sales?.label ||
      formData.service?.label ||
      formData.purchase?.label ||
      formData.stockTransfer?.label ||
      formData.salesReturn?.label ||
      formData.purchaseReturn?.label ||
      formData.serviceReturn?.label ||
      "";
    const inventoryRequestData = {
      items: itemsToSubmit,
      quantity: itemsToSubmit.reduce((total, item) => total + item.quantity, 0),
      reason: formData.reason?.id || "",
      reference_id: getReferenceId(),
      reference: getReferenceLabel(),
      remarks: formData.remarks,
      box_id: inventoryDetails?._id,
      sales_person_id: currentUser?.related_profile?._id || null,
      box_status: "pending",
      request_status: "requested",
      approver_id: null,
      approver_name: "",
      warehouse_name: currentUser?.warehouse?.warehouse_name || "",
      warehouse_id: currentUser?.warehouse?.warehouse_id,
    };
    if (inventoryDetails?.type_of_assign === "one_hour") {
      try {
        const data = {
          box_id: inventoryDetails?._id,
          type_of_assign: null,
        };
        const response = await put("/updateInventoryBox", data);
        if (response.success === true) {
          showToastMessage("One-time request successfully processed.");
        } else {
          showToastMessage("Failed to update");
        }
      } catch (error) {
        console.error("Error updating one-time request:", error);
        showToastMessage("An error occurred");
      }
    }
    try {
      const response = await post(
        "/createInventoryBoxRequest",
        inventoryRequestData
      );
      if (response.success === true) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2:
            response.message || "Inventory Box Request created successfully",
          position: "bottom",
        });
        navigation.navigate("InventoryScreen");
      } else {
        console.error("Inventory Box Request:", response.message);
        Toast.show({
          type: "error",
          text1: "ERROR",
          text2: response.message || "Inventory Box Request creation failed",
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Error submitting request:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBottomSheet = (type) => {
    setSelectedType(type);
    setIsVisible(!isVisible);
  };

  const renderBottomSheet = () => {
    let items = [];
    let fieldName = "";

    switch (selectedType) {
      case "Sales":
        items = dropdown.invoice;
        fieldName = "sales";
        break;
      case "Service":
        items = dropdown.service;
        fieldName = "service";
        break;
      case "Service Return":
        items = dropdown.serviceReturn;
        fieldName = "serviceReturn";
        break;
      case "Sales Return":
        items = dropdown.salesReturn;
        fieldName = "salesReturn";
        break;
      case "Purchase":
        items = dropdown.vendorBill; //purchase return
        fieldName = "purchaseReturn";
        break;
      case "Purchase Return":
        items = dropdown.purchaseReturn;
        fieldName = "purchase";
        break;
      case "Stock Transfer":
        items = dropdown.stockTransfer;
        fieldName = "stockTransfer";
        break;
      case "Vendor Bill":
        items = dropdown.vendorBill;
        fieldName = "vendorBill";
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

  const renderDynamicField = () => {
    switch (formData.reason?.label?.toLowerCase()) {
      case "sales":
        return (
          <FormInput
            labelColor={COLORS.boxTheme}
            label={"Select Sales"}
            placeholder={"Select Sales"}
            dropIcon={"menu-down"}
            editable={false}
            value={formData.sales?.label} //invoice
            multiline={true}
            onPress={() => toggleBottomSheet("Sales")}
          />
        );
      case "service":
        return (
          <FormInput
            labelColor={COLORS.boxTheme}
            label={"Select Service"}
            placeholder={"Select Service"}
            dropIcon={"menu-down"}
            editable={false}
            value={formData.service?.label} //service
            multiline={true}
            onPress={() => toggleBottomSheet("Service")}
          />
        );
      case "purchase":
        return (
          <FormInput
            labelColor={COLORS.boxTheme}
            label={"Select Purchase"}
            placeholder={"Select Purchase"}
            dropIcon={"menu-down"}
            editable={false}
            value={formData.purchase?.label}
            multiline={true}
            onPress={() => toggleBottomSheet("Purchase")}
          />
        );
      case "purchase return":
        return (
          <FormInput
            labelColor={COLORS.boxTheme}
            label={"Select Purchase Return"}
            placeholder={"Select Purchase Return"}
            dropIcon={"menu-down"}
            editable={false}
            value={formData.purchaseReturn?.label}
            multiline={true}
            onPress={() => toggleBottomSheet("Purchase Return")}
          />
        );
      case "sales return":
        return (
          <FormInput
            labelColor={COLORS.boxTheme}
            label={"Select Sales Return"}
            placeholder={"Select Sales Return"}
            dropIcon={"menu-down"}
            editable={false}
            value={formData.salesReturn?.label}
            multiline={true}
            onPress={() => toggleBottomSheet("Sales Return")}
          />
        );
      case "service return":
        return (
          <FormInput
            labelColor={COLORS.boxTheme}
            label={"Select Service Return"}
            placeholder={"Select Service Return"}
            dropIcon={"menu-down"}
            editable={false}
            value={formData.serviceReturn?.label}
            multiline={true}
            onPress={() => toggleBottomSheet("Service Return")}
          />
        );
      case "stock transfer":
        return (
          <FormInput
            labelColor={COLORS.boxTheme}
            label={"Select Stock Transfer"}
            placeholder={"Select Stock Transfer"}
            dropIcon={"menu-down"}
            editable={false}
            value={formData.stockTransfer?.label}
            multiline={true}
            onPress={() => toggleBottomSheet("Stock Transfer")}
          />
        );
      default:
        break;
    }
  };

  return (
    <SafeAreaView backgroundColor={COLORS.boxTheme}>
      <NavigationHeader
        backgroundColor={COLORS.boxTheme}
        logo={false}
        title={"Box Opening Request"}
        onBackPress={() => navigation.goBack()}
      />
      <RoundedScrollContainer>
        <OverlayLoader visible={loading} backgroundColor={true} />
        <FormInput
          label={"Inventory Box"}
          labelColor={COLORS.boxTheme}
          editable={false}
          placeholder={"Box no"}
          value={inventoryDetails?.name || "-"}
        />
        <FormInput
          label={"Reason"}
          dropIcon="menu-down"
          labelColor={COLORS.boxTheme}
          editable={false}
          placeholder={"reason"}
          value={formData?.reason ? formData.reason.label : ""}
        />
        {renderDynamicField()}
        <Text style={styles.label}>Box Items</Text>
        <View>
          <FlatList
            data={displayItems}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ marginBottom: 0 }}
            numColumns={1}
            renderItem={({ item }) => (
              <InventoryRequestItem
                item={item}
                onChoose={() => handleChooseItem(item)}
                onQuantityChange={(id, text) => handleQuantityChange(id, text)}
              />
            )}
            keyExtractor={(item) => item._id}
          />
        </View>
        <FormInput
          label={"Remarks"}
          labelColor={COLORS.boxTheme}
          multiline={true}
          numberOfLines={5}
          placeholder={"Enter remarks"}
          onChangeText={(text) => handleFieldChange("remarks", text)}
        />
        {/* {showSubmitButton ? ( */}
          <Button
            backgroundColor={loading ? COLORS.lightenBoxTheme : COLORS.boxTheme}
            title={"Submit"}
            disabled={loading}
            onPress={handleInventoryBoxRequest}
            style={styles.submitButton}
          />
        {/* ) : null} */}
        <View style={{ flex: 1, marginBottom: "20%" }} />
      </RoundedScrollContainer>
      {renderBottomSheet()}
    </SafeAreaView>
  );
};

export default InventoryForm;

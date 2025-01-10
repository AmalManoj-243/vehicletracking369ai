import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from '@components/containers';
import { TitleWithButton, NavigationHeader } from "@components/Header";
import { RoundedScrollContainer } from '@components/containers';
import { DropdownSheet } from "@components/common/BottomSheets";
import { TextInput as FormInput } from '@components/common/TextInput';
import { formatDate } from '@utils/common/date';
import { showToastMessage } from '@components/Toast';
import { fetchSupplierDropdown, fetchCurrencyDropdown, fetchCountryDropdown, fetchWarehouseDropdown } from "@api/dropdowns/dropdownApi";
import { purchaseType } from "@constants/dropdownConst";
import { fetchPurchaseOrderDetails } from '@api/details/detailApi';
import EditPurchaseOrderList from './EditPurchaseOrderList';
import { OverlayLoader } from '@components/Loader';
import { Button } from '@components/common/Button';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import { ConfirmationModal } from '@components/Modal';
import { put } from '@api/services/utils';

const EditPoDetails = ({ navigation, route }) => {
  const { id: purchaseOrderId } = route?.params || {};
  const [detail, setDetail] = useState({});
  // console.log("🚀 ~ Details ~ detail:", JSON.stringify(detail, null, 2));
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseOrderLines, setPurchaseOrderLines] = useState([]);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({});
  const [productLines, setProductLines] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [dropdown, setDropdown] = useState({
    vendorName: [],
    currency: [],
    purchaseType: [],
    countryOfOrigin: [],
    warehouse: [],
  });

  const fetchDetails = async (purchaseOrderId) => {
    setIsLoading(true);
    try {
      const [detail] = await fetchPurchaseOrderDetails(purchaseOrderId);
      console.log("🚀 ~ fetchDetails ~ detail:", JSON.stringify(detail, null, 2));
      if (detail) {
        setFormData((prevFormData) => ({
          ...prevFormData,
          vendorName: { id: detail?.supplier?.supplier_id || '', label: detail?.supplier?.supplier_name?.trim() || '' },
          trnNumber: detail?.Trn_number.toString() || '',
          currency: { id: detail?.currency?.currency_id || '', label: detail?.currency?.currency_name || '' },
          orderDate: detail?.order_date || new Date(),
          purchaseType: detail?.purchase_type || '',
          countryOfOrigin: { id: detail?.country?.country_id || '', label: detail?.country?.country_name || '' },
          billDate: detail?.bill_date || null,
          warehouse: { id: detail?.warehouse_id || '', label: detail?.warehouse_name || '' },
        }));
        setDetail(detail);
        setPurchaseOrderLines(detail?.products_lines || []);
      } else {
        console.warn('No valid data received for purchase order details.');
        setFormData(null);
        setPurchaseOrderLines([]);
        showToastMessage({
          type: 'warning',
          title: 'Warning',
          message: 'No details found for the specified purchase order.',
        });
      }
    } catch (error) {
      console.error('Error fetching purchase order details:', error);
      setFormData(null);
      setPurchaseOrderLines([]);
      showToastMessage({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch purchase order details. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };  

  useFocusEffect(
    useCallback(() => {
      if (purchaseOrderId) {
        fetchDetails(purchaseOrderId);
      }
    }, [purchaseOrderId])
  );

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (selectedType === "Vendor Name") {
        try {
          const vendorData = await fetchSupplierDropdown(searchText);
          setDropdown((prevDropdown) => ({
            ...prevDropdown,
            vendorName: vendorData?.map((data) => ({
              id: data._id,
              label: data.name?.trim(),
            })),
          }));
        } catch (error) {
          console.error("Error fetching Supplier dropdown data:", error);
        }
      }
    };
    fetchSuppliers();
  }, [searchText, selectedType]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [currencyData, countryData, warehouseData] = await Promise.all([
          fetchCurrencyDropdown(),
          fetchCountryDropdown(),
          fetchWarehouseDropdown(),
        ]);
        setDropdown({
          currency: currencyData.map(data => ({
            id: data._id,
            label: data.currency_name,
          })),
          countryOfOrigin: countryData.map(data => ({
            id: data._id,
            label: data.country_name,
          })),
          warehouse: warehouseData.map(data => ({
            id: data._id,
            label: data.warehouse_name,
          })),
        });
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData((prevFormData) => ({ ...prevFormData, [field]: value }));
    if (errors[field]) {
      setErrors((prevErrors) => ({ ...prevErrors, [field]: null }));
    }
  };

  const toggleBottomSheet = (type) => {
    setSelectedType(type);
    setIsVisible(!isVisible);
  };

  const addProducts = (addedItem) => {
    const structuredProduct = {
      product_id: addedItem.product_id,
      product_name: addedItem.product_name, 
      description: addedItem.description || "",
      quantity: addedItem.quantity,
      uom_id: addedItem.uom.id,
      uom: addedItem.uom.label,
      product_unit_of_measure: addedItem.uom.label,
      unit_price: addedItem.unitPrice, 
      scheduled_date: addedItem.scheduledDate, 
      tax_type_id: addedItem.taxes.id, 
      tax_type_name: addedItem.taxes.label,
      sub_total: addedItem.subTotal, 
      untaxed_amount: addedItem.untaxedAmount, 
      tax: parseFloat(addedItem.tax),
      total: parseFloat(addedItem.totalAmount),
    };
    setPurchaseOrderLines((prevItems) => [...prevItems, structuredProduct]);
  };  

  useEffect(() => {
    if (route.params?.newProductLine) {
      addProducts(route.params.newProductLine);
    }
  }, [route.params?.newProductLine]);  

  const handleUpdatePurchaseOrder = async () => {
    setIsSubmitting(true);
    const updatedPurchaseOrder = {
      _id: "677bcd7d3d5403cc4d080057",
      supplier: "670675464e15450d26ba8eb8",
      Trn_number: 1222,
      status: "Pending",
      currency: "6540b68c05fb79149c3eb7d8",
      purchase_type: "International Purchase",
      country: "6540b68405fb79149c3eb5c2",
      bill_date: "2025-01-30",
      order_date: "2025-01-06",
      untaxed_total_amount: 2240,
      total_amount: 2352,
      payment_status: "Pending",
      due_amount: 0,
      paid_amount: 0,
      due_date: 0,
      remarks: "test",
      date: "2025-01-30",
      warehouse_id: "66307fc0ceb8eb834bb25509",
      warehouse_name: "Danat Hub",
      update_purchase_line_ids: updatedPurchaseOrder.map((item) => ({
        purchase_line_ids: item.purchase_line_ids,
        product: item.product_id,
        taxes: item.tax_type_id,
        quantity: item.quantity,
        recieved_quantity: item.recieved_quantity,
        unit_price: item.unit_price,
        sub_total: item.unit_price * item.quantity,
        description: item.description,
        billed_quantity: item.billed_quantity,
        product_unit_of_measure: item.uom,
        scheduled_date: item.scheduled_date,
      })),
      create_purchase_line_ids: [
        {
          product: "6549fbbc170e1456c861c9ad",
          taxes: "648d9b54ef9cd868dfbfa37b",
          quantity: 2,
          recieved_quantity: 0,
          unit_price: 120,
          sub_total: 240,
          description: "",
          billed_quantity: 0,
          product_unit_of_measure: "",
          scheduled_date: "2025-01-07",
        },
      ],
      delete_purchase_line_ids: [],
    };
  console.log("Updated Purchase Order:", updatedPurchaseOrder);
    try {
      const response = await put("/updatePurchaseOrder", updatedPurchaseOrder);
      console.log("Submitting Updated Purchase Order:", updatedPurchaseOrder);
      if (response.success === 'true') {
        showToast({
          type: "success",
          title: "Success",
          message: response.message || "Purchase Order Updated Successfully",
        });
        navigation.navigate("PurchaseOrderDetails");
      } else {
        console.error("Submit Failed:", response.message);
        showToast({
          type: "error",
          title: "ERROR",
          message: response.message || "Purchase Order update failed",
        });
      }
    } catch (error) {
      console.error("Error Submitting Purchase Order Update:", error);
      showToast({
        type: "error",
        title: "ERROR",
        message: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };  

  const renderBottomSheet = () => {
    let items = [];
    let fieldName = "";

    switch (selectedType) {
      case "Vendor Name":
        items = dropdown.vendorName;
        fieldName = "vendorName";
        break;
      case "Currency":
        items = dropdown.currency;
        fieldName = "currency";
        break;
      case "Purchase Type":
        items = purchaseType;
        fieldName = "purchaseType";
        break;
      case "Country Of Origin":
        items = dropdown.countryOfOrigin;
        fieldName = "countryOfOrigin";
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
        search={selectedType === "Vendor Name"}
        onSearchText={(value) => setSearchText(value)}
        onValueChange={(value) => {
          setSearchText("");
          handleFieldChange(fieldName, value);
          setIsVisible(false);
        }}
      />
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (purchaseOrderId) {
        fetchDetails(purchaseOrderId);
      }
    }, [purchaseOrderId])
  );

  const { untaxedTotal, taxTotal, grandTotal } = useMemo(() => {
    let taxes = 0;
    let untaxed = 0;
    purchaseOrderLines.forEach((item) => {
      untaxed += item.sub_total || 0;
      taxes += item.tax_value || 0;
    });
    return {
      untaxedTotal: untaxed.toFixed(2),
      taxTotal: taxes.toFixed(2),
      grandTotal: (untaxed + taxes).toFixed(2),
    };
  }, [purchaseOrderLines]);

  return (
    <SafeAreaView>
      <NavigationHeader
        title={'Edit Purchase Order Details'}
        onBackPress={() => navigation.goBack()}
        logo={false}
      />
      <RoundedScrollContainer>
        <FormInput
          label="Vendor Name"
          placeholder="Select Vendor Name"
          dropIcon="menu-down"
          editable={false}
          validate={errors.vendorName}
          value={formData.vendorName?.label}
          required
          multiline={true}
          onPress={() => toggleBottomSheet("Vendor Name")}
        />
        <FormInput
          label="TRN Number"
          placeholder="Enter Transaction Number"
          editable
          keyboardType="numeric"
          validate={errors.trnNumber}
          value={formData.trnNumber}
          required
          onChangeText={(value) => handleFieldChange('trnNumber', value)}
        />
        <FormInput
          label="Currency"
          placeholder="Select Currency"
          dropIcon="menu-down"
          editable={false}
          validate={errors.currency}
          value={formData.currency?.label}
          required
          onPress={() => toggleBottomSheet("Currency")}
        />
        <FormInput
          label="Order Date"
          editable={false}
          value={formatDate(formData.orderDate)}
        />
        <FormInput
          label="Purchase Type"
          placeholder="Select Purchase Type"
          dropIcon="menu-down"
          items={purchaseType}
          editable={false}
          validate={errors.purchaseType}
          value={formData.purchaseType}
          required
          onPress={() => toggleBottomSheet("Purchase Type")}
        />
        <FormInput
          label="Country Of Origin"
          placeholder="Select Country"
          dropIcon="menu-down"
          editable={false}
          validate={errors.countryOfOrigin}
          value={formData.countryOfOrigin?.label}
          required
          onPress={() => toggleBottomSheet("Country Of Origin")}
        />
        <FormInput
          label="Bill Date"
          dropIcon="calendar"
          placeholder="dd-mm-yyyy"
          editable={false}
          required
          validate={errors.billDate}
          value={formatDate(formData.billDate)}
          onPress={() => setIsDatePickerVisible(true)}
        />
        <FormInput
          label="Warehouse"
          placeholder="Select Warehouse"
          dropIcon="menu-down"
          editable={false}
          validate={errors.warehouse}
          value={formData.warehouse?.label}
          required
          onPress={() => toggleBottomSheet("Warehouse")}
        />
        <TitleWithButton
          label="Add an item"
          onPress={() => navigation.navigate('AddEditPurchaseLines', { purchaseOrderId })}
        />
        <FlatList
          data={purchaseOrderLines}
          renderItem={({ item }) => <EditPurchaseOrderList item={item}
            onPress={() => navigation.navigate('EditPurchaseLines', { id: item._id })} />}
          keyExtractor={(item) => item._id}
        />

        <View style={{ marginVertical: 2 }}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Untaxed Amount : </Text>
            <Text style={styles.totalValue}>{untaxedTotal}</Text>
          </View>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Taxes : </Text>
            <Text style={styles.totalValue}>{taxTotal}</Text>
          </View>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total : </Text>
            <Text style={styles.totalValue}>{grandTotal}</Text>
          </View>
        </View>
        {renderBottomSheet()}
        <Button
          backgroundColor={COLORS.primaryThemeColor}
          title="UPDATE"
          onPress={() => {
            setIsConfirmationModalVisible(true);
          }}
        />

        <ConfirmationModal
          isVisible={isConfirmationModalVisible}
          onCancel={() => setIsConfirmationModalVisible(false)}
          headerMessage="Are you sure you want to update this?"
          onConfirm={() => {
            handleUpdatePurchaseOrder();
            setIsConfirmationModalVisible(false);
          }}
        />
        <OverlayLoader visible={isLoading || isSubmitting} />
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
    flexDirection: 'row',
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
    color: '#666666',
  },
});

export default EditPoDetails;
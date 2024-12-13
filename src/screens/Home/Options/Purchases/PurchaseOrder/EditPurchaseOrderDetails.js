import React, { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from '@components/containers';
import { TitleWithButton, NavigationHeader } from "@components/Header";
import { RoundedScrollContainer } from '@components/containers';
import { DetailField } from '@components/common/Detail';
import { formatDate } from '@utils/common/date';
import { showToastMessage } from '@components/Toast';
import { fetchPurchaseOrderDetails } from '@api/details/detailApi';
import EditPurchaseOrderList from './EditPurchaseOrderList';
import { OverlayLoader } from '@components/Loader';
import { Button } from '@components/common/Button';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import { ConfirmationModal } from '@components/Modal';

const EditPurchaseOrderDetails = ({ navigation, route }) => {
  const { id: purchaseOrderId } = route?.params || {};
  const [details, setDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseOrderLines, setPurchaseOrderLines] = useState([]);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const updatedDetails = await fetchPurchaseOrderDetails(purchaseOrderId);
      if (updatedDetails && updatedDetails[0]) {
        setDetails(updatedDetails[0]);
        setPurchaseOrderLines(updatedDetails[0]?.products_lines || []);
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
      if (purchaseOrderId) {
        fetchDetails(purchaseOrderId);
      }
    }, [purchaseOrderId])
  );

  const { taxTotal } = useMemo(() => {
    let taxes = 0;
    purchaseOrderLines.forEach((item) => {
      taxes += item.tax_value || 0;
    });
    return {
      taxTotal: taxes.toFixed(2),
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
        <DetailField label="Vendor" value={details?.supplier?.supplier_name || '-'} />
        <DetailField label="TRN Number" value={details?.Trn_number?.toString() || '-'} />
        <DetailField label="Currency" value={details?.currency?.currency_name || '-'} />
        <DetailField label="Order Date" value={formatDate(details?.order_date)} />
        <DetailField label="Purchase Type" value={details?.purchase_type || '-'} />
        <DetailField label="Country Of Origin" value={details?.country?.country_name || '-'} />
        <DetailField label="Bill Date" value={formatDate(details?.bill_date)} />
        <DetailField label="Warehouse" value={details?.warehouse_name} />
        <TitleWithButton
          label="Add an item"
          onPress={() => navigation.navigate('AddPurchaseLines')}
        />
        <FlatList
          data={purchaseOrderLines}
          renderItem={({ item }) => <EditPurchaseOrderList item={item} />}
          keyExtractor={(item) => item._id}
        />

        <View style={{ marginVertical: 2 }}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Untaxed Amount : </Text>
            <Text style={styles.totalValue}>{details.untaxed_total_amount}</Text>
          </View>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Taxes : </Text>
            <Text style={styles.totalValue}>{taxTotal}</Text>
          </View>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total : </Text>
            <Text style={styles.totalValue}>{details.total_amount}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginVertical: 20 }}>
          <Button
            backgroundColor={COLORS.primaryThemeColor}
            title="UPDATE"
            onPress={() => {
              setIsConfirmationModalVisible(true);
            }}
          />
        </View>

        <ConfirmationModal
          isVisible={isConfirmationModalVisible}
          onCancel={() => setIsConfirmationModalVisible(false)}
          headerMessage="Are you sure you want to delete this?"
          onConfirm={() => {
            handleDeletePrice();
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

export default EditPurchaseOrderDetails;

// import React, { useState, useCallback, useMemo } from 'react';
// import { useFocusEffect } from '@react-navigation/native';
// import { View, FlatList, Text, StyleSheet } from 'react-native';
// import { SafeAreaView } from '@components/containers';
// import { TitleWithButton, NavigationHeader } from "@components/Header";
// import { RoundedScrollContainer } from '@components/containers';
// import { DetailField } from '@components/common/Detail';
// import { formatDate } from '@utils/common/date';
// import { showToastMessage } from '@components/Toast';
// import { fetchPurchaseOrderDetails } from '@api/details/detailApi';
// import EditPurchaseOrderList from './EditPurchaseOrderList';
// import { OverlayLoader } from '@components/Loader';
// import { Button } from '@components/common/Button';
// import { COLORS, FONT_FAMILY } from '@constants/theme';

// const EditPurchaseOrderDetails = ({ navigation, route }) => {
//   const { id: purchaseOrderId } = route?.params || {};
//   const [details, setDetails] = useState({});
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [purchaseOrderLines, setPurchaseOrderLines] = useState([]);
//   const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);

//   const fetchDetails = async () => {
//     setIsLoading(true);
//     try {
//       const updatedDetails = await fetchPurchaseOrderDetails(purchaseOrderId);
//       if (updatedDetails && updatedDetails[0]) {
//         setDetails(updatedDetails[0]);
//         setPurchaseOrderLines(updatedDetails[0]?.products_lines || []);
//       }
//     } catch (error) {
//       console.error('Error fetching purchase order details:', error);
//       showToastMessage('Failed to fetch purchase order details. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       if (purchaseOrderId) {
//         fetchDetails(purchaseOrderId);
//       }
//     }, [purchaseOrderId])
//   );

//   const { taxTotal } = useMemo(() => {
//     let taxes = 0;
//     purchaseOrderLines.forEach((item) => {
//       taxes += item.tax_value || 0;
//     });
//     return {
//       taxTotal: taxes.toFixed(2),
//     };
//   }, [purchaseOrderLines]);

//   const renderBottomSheet = () => {
//     let items = [];
//     let fieldName = "";

//     switch (selectedType) {
//       case "Vendor Name":
//         items = dropdown.vendorName;
//         fieldName = "vendorName";
//         break;
//       case "Currency":
//         items = dropdown.currency;
//         fieldName = "currency";
//         break;
//       case "Purchase Type":
//         items = purchaseType;
//         fieldName = "purchaseType";
//         break;
//       case "Country Of Origin":
//         items = dropdown.countryOfOrigin;
//         fieldName = "countryOfOrigin";
//         break;
//       case "Warehouse":
//         items = dropdown.warehouse;
//         fieldName = "warehouse";
//         break;
//       default:
//         return null;
//     }
//     return (
//       <DropdownSheet
//         isVisible={isVisible}
//         items={items}
//         title={selectedType}
//         onClose={() => setIsVisible(false)}
//         search={selectedType === "Vendor Name"}
//         onSearchText={(value) => setSearchText(value)}
//         onValueChange={(value) => {
//           setSearchText("");
//           handleFieldChange(fieldName, value);
//           setIsVisible(false);
//         }}
//       />
//     );
//   };

//   return (
//     <SafeAreaView>
//       <NavigationHeader
//         title={'Edit Purchase Order Details'}
//         onBackPress={() => navigation.goBack()}
//         logo={false}
//       />
//       <RoundedScrollContainer>
//         <FormInput
//           label="Vendor Name"
//           placeholder="Select Vendor Name"
//           dropIcon="menu-down"
//           editable={false}
//           validate={errors.vendorName}
//           value={details?.supplier?.supplier_name || '-'}
//           required
//           multiline={true}
//           onPress={() => toggleBottomSheet("Vendor Name")}
//         />
//         <FormInput
//           label="TRN Number"
//           placeholder="Enter Transaction Number"
//           editable
//           keyboardType="numeric"
//           validate={errors.trnNumber}
//           value={details?.Trn_number?.toString() || '-'}
//           required
//           onChangeText={(value) => handleFieldChange('trnNumber', value)}
//         />
//         <FormInput
//           label="Currency"
//           placeholder="Select Currency"
//           dropIcon="menu-down"
//           editable={false}
//           validate={errors.currency}
//           value={details?.currency?.currency_name || '-'}
//           required
//           onPress={() => toggleBottomSheet("Currency")}
//         />
//         <FormInput
//           label="Order Date"
//           editable={false}
//           value={formatDate(formData.orderDate)}
//         />
//         <FormInput
//           label="Purchase Type"
//           placeholder="Select Purchase Type"
//           dropIcon="menu-down"
//           items={purchaseType}
//           editable={false}
//           validate={errors.purchaseType}
//           value={details?.purchase_type || '-'}
//           required
//           onPress={() => toggleBottomSheet("Purchase Type")}
//         />
//         <FormInput
//           label="Country Of Origin"
//           placeholder="Select Country"
//           dropIcon="menu-down"
//           editable={false}
//           validate={errors.countryOfOrigin}
//           value={details?.country?.country_name || '-'}
//           required
//           onPress={() => toggleBottomSheet("Country Of Origin")}
//         />
//         <FormInput
//           label="Bill Date"
//           dropIcon="calendar"
//           placeholder="dd-mm-yyyy"
//           editable={false}
//           required
//           validate={errors.billDate}
//           value={formatDate(details?.bill_date)}
//           onPress={() => setIsDatePickerVisible(true)}
//         />
//         <FormInput
//           label="Warehouse"
//           placeholder="Select Warehouse"
//           dropIcon="menu-down"
//           editable={false}
//           validate={errors.warehouse}
//           value={details?.warehouse_name}
//           required
//           onPress={() => toggleBottomSheet("Warehouse")}
//         />
//         <TitleWithButton
//           label="Add an item"
//           onPress={() => navigation.navigate('AddPurchaseLines')}
//         />
//                 <FlatList
//           data={purchaseOrderLines}
//           renderItem={({ item }) => <EditPurchaseOrderList item={item} />}
//           keyExtractor={(item) => item._id}
//         />
//         <FlatList
//           data={productLines}
//           renderItem={({ item }) => (
//             <ProductLineList item={item} />
//           )}
//           keyExtractor={(item, index) => index.toString()}
//         />

//         {productLines.length > 0 && <>
//           <View style={styles.totalSection}>
//             <Text style={styles.totalLabel}>Untaxed Amount : </Text>
//             <Text style={styles.totalValue}>{formData.untaxedAmount}</Text>
//           </View>
//           <View style={styles.totalSection}>
//             <Text style={styles.totalLabel}>Taxes : </Text>
//             <Text style={styles.totalValue}>{formData.taxTotal}</Text>
//           </View>
//           <View style={styles.totalSection}>
//             <Text style={styles.totalLabel}>Total : </Text>
//             <Text style={styles.totalValue}>{formData.totalAmount}</Text>
//           </View>
//         </>
//         }
//         {renderBottomSheet()}
//         <Button
//           title="SAVE"
//           onPress={handleSubmit}
//           marginTop={10}
//           loading={isSubmitting}
//           backgroundColor={COLORS.tabIndicator}
//           disabled={isSubmitDisabled}
//         />
//         <DateTimePickerModal
//           isVisible={isDatePickerVisible}
//           mode="date"
//           minimumDate={new Date()}
//           onConfirm={(date) => {
//             setIsDatePickerVisible(false);
//             handleFieldChange("billDate", date);
//           }}
//           onCancel={() => setIsDatePickerVisible(false)}
//         />
//       </RoundedScrollContainer>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   label: {
//     marginVertical: 5,
//     fontSize: 16,
//     color: COLORS.primaryThemeColor,
//     fontFamily: FONT_FAMILY.urbanistSemiBold,
//   },
//   totalSection: {
//     flexDirection: 'row',
//     marginVertical: 5,
//     margin: 10,
//     alignSelf: "center",
//   },
//   totalLabel: {
//     fontSize: 16,
//     fontFamily: FONT_FAMILY.urbanistBold,
//   },
//   totalValue: {
//     fontSize: 16,
//     fontFamily: FONT_FAMILY.urbanistBold,
//     color: '#666666',
//   },
// });

// export default EditPurchaseOrderDetails;
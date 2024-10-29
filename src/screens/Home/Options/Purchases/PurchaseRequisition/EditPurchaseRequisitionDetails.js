import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from '@components/containers';
import NavigationHeader from '@components/Header/NavigationHeader';
import { RoundedScrollContainer } from '@components/containers';
import { DetailField } from '@components/common/Detail';
import { formatDate } from '@utils/common/date';
import { showToastMessage } from '@components/Toast';
import { TextInput as FormInput } from "@components/common/TextInput";
import { fetchPurchaseRequisitionDetails } from '@api/details/detailApi';
import { fetchSupplierDropDown } from "@api/dropdowns/dropdownApi";
import PurchaseDetailList from './PurchaseDetailList';
import { OverlayLoader } from '@components/Loader';
import { Button } from '@components/common/Button';
import { COLORS } from '@constants/theme';
import { put } from '@api/services/utils';
import { MultiSelectDropdownSheet } from "@components/common/BottomSheets"; // Use MultiSelect

const EditPurchaseRequisitionDetails = ({ navigation, route }) => {
    const { id: purchaseId } = route?.params || {};
    const [details, setDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [productLines, setProductLines] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const [errors, setErrors] = useState({});
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [dropdown, setDropdown] = useState({ suppliers: [] });
    const [searchText, setSearchText] = useState('');

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const updatedDetails = await fetchPurchaseRequisitionDetails(purchaseId);
            const requestDetails = updatedDetails[0]?.request_details?.[0];
            setDetails(updatedDetails[0] || {});
            setProductLines(requestDetails?.products_lines || []);
            setSelectedSuppliers([{ id: requestDetails?.supplier?._id, label: requestDetails?.supplier?.name }]);
        } catch (error) {
            console.error('Error fetching service details:', error);
            showToastMessage('Failed to fetch service details. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const supplierData = await fetchSupplierDropDown(searchText);
            setDropdown((prevDropdown) => ({
                ...prevDropdown,
                suppliers: supplierData?.map((data) => ({
                    id: data._id,
                    label: data.name?.trim(),
                })),
            }));
        } catch (error) {
            console.error("Error fetching Supplier dropdown data:", error);
        }
    };

    useEffect(() => {
        if (selectedType === "Supplier") {
            fetchSuppliers();
        }
    }, [searchText, selectedType]);

    useFocusEffect(
        useCallback(() => {
            if (purchaseId) {
                fetchDetails(purchaseId);
            }
        }, [purchaseId])
    );

    const toggleBottomSheet = (type) => {
        setSelectedType(type);
        setIsVisible((prev) => !prev);
    };

    const handleSupplierSelection = (selectedValues) => {
        const currentSuppliers = details?.request_details?.[0]?.products_lines?.[0]?.suppliers || [];
    
        const currentSupplierMap = new Map(currentSuppliers.map(supplier => [supplier.supplier_id, supplier]));
    
        const selectedSupplierIds = new Set(selectedValues.map(supplier => supplier.id));
    
        const remainingSuppliers = currentSuppliers.filter(supplier => selectedSupplierIds.has(supplier.supplier_id));
    
        const newSuppliers = selectedValues
            .filter(supplier => !currentSupplierMap.has(supplier.id)) 
            .map(supplier => ({
                supplier_id: supplier.id,
                status: "submitted",
                supplier: {
                    suplier_id: supplier.id,
                    suplier_name: supplier.label,
                },
            }));
    
        // Combine remaining suppliers and new ones
        const updatedSuppliers = [...remainingSuppliers, ...newSuppliers];
    
        // **Ensure unique suppliers are updated** (this part makes sure duplicates don't happen)
        const uniqueSuppliers = Array.from(new Map(updatedSuppliers.map(item => [item.supplier_id, item])).values());
    
        // Update the selected suppliers state
        setSelectedSuppliers(uniqueSuppliers);
    
        // Update the details with the new supplier list
        setDetails((prevDetails) => {
            const updatedDetails = { ...prevDetails };
            updatedDetails.request_details[0].products_lines[0].suppliers = uniqueSuppliers;
            return updatedDetails;
        });
    };
    
    const handleEditPurchase = async () => {
        setIsSubmitting(true);
        try {
            const updateData = {
                _id: details._id,
                supplier_id: selectedSuppliers.map(supplier => supplier.id), 
                product_lines: productLines, 
            };
            console.log("Haii hello : ",updateData)
            const response = await put('/updatePurchaseRequest', updateData);
            if (response.success === "true") {
                showToastMessage('Successfully Added Suppliers');
                navigation.navigate('PurchaseRequisitionDetails', { id: purchaseId });
            } else {
                showToastMessage('Failed to update purchase. Please try again.');
            }
        } catch (error) {
            showToastMessage('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderBottomSheet = () => {
        if (!selectedType)
        return null;
        let items = dropdown.suppliers;
        let isMultiSelect = true;

        return (
          <MultiSelectDropdownSheet
            isVisible={isVisible}
            items={items}
            title="Supplier"
            search
            refreshIcon={false}
            previousSelections={selectedSuppliers}
            onSearchText={(value) => setSearchText(value)}
            onValueChange={handleSupplierSelection}
            onClose={() => setIsVisible(false)}
          />
        );
    };

    return (
      <SafeAreaView>
        <NavigationHeader
            title={details?.sequence_no || 'Purchase Requisition Details'}
            onBackPress={() => navigation.goBack()}
            logo={false}
        />
        <RoundedScrollContainer>
            <DetailField label="Requested By" value={details?.request_details?.[0]?.requested_by?.employee_name || '-'} />
            <DetailField label="Request Date" value={formatDate(details?.request_details?.[0]?.request_date)} />
            <DetailField label="Warehouse" value={details?.request_details?.[0]?.warehouse?.warehouse_name || '-'} />
            <DetailField label="Require By" value={formatDate(details?.request_details?.[0]?.require_by)} />
            <FormInput
                label={"Supplier"}
                placeholder={"Add Suppliers"}
                dropIcon={"menu-down"}
                multiline={true}
                editable={false}
                value={selectedSuppliers.map(supplier => supplier.supplier?.suplier_name).join(", ")}
                onPress={() => toggleBottomSheet("Supplier")}
            />

            <FlatList
                data={productLines}
                renderItem={({ item }) => <PurchaseDetailList item={item} />}
                keyExtractor={(item) => item._id}
            />

            <View style={{ flexDirection: 'row', marginVertical: 20 }}>
                <Button
                    width={'50%'}
                    backgroundColor={COLORS.tabIndicator}
                    title="VIEW"
                    onPress={() => navigation.navigate('PurchaseRequisitionDetails', { id: purchaseId })}
                />
                <View style={{ width: 5 }} />
                <Button
                    width={'50%'}
                    backgroundColor={COLORS.green}
                    title="SAVE"
                    onPress={handleEditPurchase}
                />
            </View>

            <OverlayLoader visible={isLoading || isSubmitting} />
            {renderBottomSheet()}
        </RoundedScrollContainer>
      </SafeAreaView>
    );
};

export default EditPurchaseRequisitionDetails;
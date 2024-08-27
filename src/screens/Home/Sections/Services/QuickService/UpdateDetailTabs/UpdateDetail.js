import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { RoundedScrollContainer } from '@components/containers';
import { TextInput as FormInput } from '@components/common/TextInput';
import { DropdownSheet } from '@components/common/BottomSheets';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { DetailField } from '@components/common/Detail';
import { formatDateTime } from '@utils/common/date';
import { showToastMessage } from '@components/Toast';
import { fetchServiceDetails } from '@api/details/detailApi';
import { OverlayLoader } from '@components/Loader';
import { COLORS, FONT_FAMILY } from "@constants/theme";
import { fetchProductsDropdown, fetchUnitOfMeasureDropdown } from '@api/dropdowns/dropdownApi';

const UpdateDetail = ({ serviceId }) => {
    const [details, setDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [spareName, setSpareName] = useState(null);
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [uom, setUom] = useState(null);
    const [tax, setTax] = useState('');
    const [subTotal, setSubTotal] = useState('');
    const [savedItems, setSavedItems] = useState([]);

    const [dropdown, setDropdown] = useState({
        products: [],
        unitofmeasure: [],
    });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const ProductsData = await fetchProductsDropdown();
                setDropdown(prevDropdown => ({
                    ...prevDropdown,
                    products: ProductsData.map(data => ({
                        id: data._id,
                        label: data.product_name,
                        unit_price: data.sale_price,
                    })),
                }));
            } catch (error) {
                console.error('Error fetching Products dropdown data:', error);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchUnitOfMeasure = async () => {
            try {
                const UnitOfMeasureData = await fetchUnitOfMeasureDropdown();
                setDropdown(prevDropdown => ({
                    ...prevDropdown,
                    unitofmeasure: UnitOfMeasureData.map(data => ({
                        id: data._id,
                        label: data.uom_name,
                    })),
                }));
            } catch (error) {
                console.error('Error fetching Unit Of Measure dropdown data:', error);
            }
        };

        fetchUnitOfMeasure();
    }, []);

    const [selectedType, setSelectedType] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const navigation = useNavigation();

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const updatedDetails = await fetchServiceDetails(serviceId);
            setDetails(updatedDetails[0] || {});
        } catch (error) {
            console.error('Error fetching service details:', error);
            showToastMessage('Failed to fetch service details. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (serviceId) {
                fetchDetails(serviceId);
            }
        }, [serviceId])
    );

    const toggleBottomSheet = (type) => {
        setSelectedType(type);
        setIsVisible(!isVisible);
    };

    const handleSave = () => {
        if (!spareName || !description || !quantity || !uom || !unitPrice || !tax || !subTotal) {
            showToastMessage('Please fill out all fields.');
            return;
        }
        const newItem = {
            spareName: spareName.label,
            description,
            quantity,
            uom: uom.label,
            unitPrice,
            tax,
            subTotal,
        };
        setSavedItems([...savedItems, newItem]);
        setSpareName(null);
        setDescription('');
        setQuantity('');
        setUom(null);
        setUnitPrice('');
        setTax('');
        setSubTotal('');
        setShowForm(false);
    };

    const calculateSubTotal = (unitPrice, quantity) => {
        return unitPrice && quantity ? (parseFloat(unitPrice) * parseFloat(quantity)).toFixed(2) : '';
    };

    const handleProductSelection = (selectedProduct) => {
        setSpareName(selectedProduct);
        const unitPrice = selectedProduct.unit_price ? selectedProduct.unit_price.toString() : '0';
        setUnitPrice(unitPrice);
        const calculatedSubTotal = calculateSubTotal(unitPrice, quantity);
        setSubTotal(calculatedSubTotal);
    };

    const handleQuantityChange = (value) => {
        setQuantity(value);
        const calculatedSubTotal = calculateSubTotal(unitPrice, value);
        setSubTotal(calculatedSubTotal);
    };

    const renderBottomSheet = () => {
        let items = [];
        let fieldName = '';

        switch (selectedType) {
            case 'SpareName':
                items = dropdown.products;
                fieldName = 'spareName';
                break;
            case 'UOM':
                items = dropdown.unitofmeasure;
                fieldName = 'uom';
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
                onValueChange={(value) => {
                    if (fieldName === 'spareName') handleProductSelection(value);
                    else if (fieldName === 'uom') setUom(value);
                }}
            />
        );
    };

    const renderSavedItem = ({ item }) => (
        <View style={styles.savedItem}>
            <Text style={styles.savedItemText}>Spare Name: {item.spareName}</Text>
            <Text style={styles.savedItemText}>Description: {item.description}</Text>
            <Text style={styles.savedItemText}>Quantity: {item.quantity}</Text>
            <Text style={styles.savedItemText}>UOM: {item.uom}</Text>
            <Text style={styles.savedItemText}>Unit Price: {item.unitPrice}</Text>
            <Text style={styles.savedItemText}>Taxes: {item.tax}</Text>
            <Text style={styles.savedItemText}>Sub Total: {item.subTotal}</Text>
        </View>
    );

    return (
        <RoundedScrollContainer>
            <DetailField label="Customer" value={details?.customer_name || '-'} multiline numberOfLines={3} textAlignVertical={'top'} />
            <DetailField label="Mobile Number" value={details?.customer_mobile || '-'} />
            <DetailField label="Email" value={details?.customer_email || '-'} />
            <DetailField label="Warehouse Name" value={details?.warehouse_name || '-'} />
            <DetailField label="Created On" value={formatDateTime(details.date)} />
            <DetailField label="Created By" value={details?.assignee_name || '-'} />
            <DetailField label="Brand Name" value={details?.brand_name || '-'} />
            <DetailField label="Device Name" value={details?.device_name || '-'} />
            <DetailField label="Consumer Model" value={details?.consumer_model_name || '-'} />

            <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(!showForm)}>
                <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>

            {showForm && (
                <View style={styles.formContainer}>
                    <FormInput
                        label="Spare Name"
                        placeholder="Select Product Name"
                        dropIcon="menu-down"
                        editable={false}
                        items={dropdown.products}
                        value={spareName?.label}
                        onPress={() => toggleBottomSheet('SpareName')}
                    />
                    <FormInput
                        label="Description"
                        placeholder="Enter Description"
                        editable={true}
                        value={description}
                        onChangeText={setDescription}
                    />
                    <FormInput
                        label="Quantity"
                        placeholder="Enter Quantity"
                        editable={true}
                        keyboardType="numeric"
                        value={quantity}
                        onChangeText={handleQuantityChange}
                    />
                    <FormInput
                        label="UOM"
                        placeholder="Select Unit Of Measure"
                        dropIcon="menu-down"
                        editable={false}
                        items={dropdown.unitofmeasure}
                        value={uom?.label}
                        onPress={() => toggleBottomSheet('UOM')}
                    />
                    <FormInput
                        label="Unit Price"
                        placeholder="Enter Unit Price"
                        editable={true}
                        keyboardType="numeric"
                        value={unitPrice}
                        onChangeText={setUnitPrice}
                    />
                    <FormInput
                        label="Taxes"
                        placeholder="Enter Tax"
                        editable={true}
                        keyboardType="numeric"
                        value={tax}
                        onChangeText={setTax}
                    />
                    <FormInput
                        label="Sub Total"
                        placeholder="Enter Sub Total"
                        editable={true}
                        keyboardType="numeric"
                        value={subTotal}
                        onChangeText={setSubTotal}
                    />
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={savedItems}
                renderItem={renderSavedItem}
                keyExtractor={(item, index) => index.toString()}
                ListHeaderComponent={() => savedItems.length > 0 && <Text style={styles.savedItemTitle}>Saved Items</Text>}
            />

            {renderBottomSheet()}

            {isLoading && <OverlayLoader />}
        </RoundedScrollContainer>
    );
};

const styles = StyleSheet.create({
    addButton: {
        backgroundColor: '#2e2a4f',
        padding: 10,
        marginVertical: 10,
        borderRadius: 5,
    },
    addButtonText: {
        color: COLORS.white,
        fontFamily: FONT_FAMILY.urbanistBold,
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: COLORS.white,
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    saveButton: {
        backgroundColor: '#2e2a4f',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    saveButtonText: {
        fontFamily: FONT_FAMILY.urbanistBold,
        color: COLORS.white,
        textAlign: 'center',
    },
    savedItem: {
        backgroundColor: COLORS.lightGrey,
        padding: 10,
        marginVertical: 5,
        borderRadius: 5,
    },
    savedItemText: {
        fontFamily: FONT_FAMILY.urbanistRegular,
        color: COLORS.darkGrey,
    },
    savedItemTitle: {
        fontFamily: FONT_FAMILY.urbanistRegular,
        color: COLORS.primary,
        marginBottom: 5,
    },
});

export default UpdateDetail;

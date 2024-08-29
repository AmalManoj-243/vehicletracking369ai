import React, { useEffect, useState, useCallback } from 'react';
import { RoundedScrollContainer, SafeAreaView } from '@components/containers';
import { TextInput as FormInput } from '@components/common/TextInput';
import { fetchProductsDropdown, fetchUnitOfMeasureDropdown, fetchTaxDropdown } from '@api/dropdowns/dropdownApi';
import { DropdownSheet } from '@components/common/BottomSheets';
import { NavigationHeader } from '@components/Header';
import { Button } from '@components/common/Button';
import { COLORS } from '@constants/theme';
import { Keyboard } from 'react-native';
import { validateFields } from '@utils/validation';
import { put } from '@api/services/utils';

const AddSpareParts = ({ navigation, route }) => {

    const { id, addSpareParts } = route?.params || {};

    const [selectedType, setSelectedType] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const [dropdown, setDropdown] = useState({
        products: [],
        unitofmeasure: [],
        taxes: [],
    });

    const [formData, setFormData] = useState({
        spareParts: '',
        description: '',
        quantity: '1',
        uom: '',
        unitPrice: '',
        serviceCharge: '100',
        tax: 'VAT 5%',
        subTotal: '',
    });

    const [errors, setErrors] = useState({});

    const calculateSubTotal = (unitPrice, quantity) => {
        return unitPrice && quantity ? (parseFloat(unitPrice) * parseFloat(quantity)).toFixed(2) : '';
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

    const handleProductSelection = (selectedProduct) => {
        const unitPrice = selectedProduct.unitPrice ? selectedProduct.unitPrice.toString() : '0';
        const description = selectedProduct.productDescription || '';
        const defaultQuantity = '1';
        const calculatedSubTotal = calculateSubTotal(unitPrice, defaultQuantity);

        setFormData(prevFormData => ({
            ...prevFormData,
            spareParts: selectedProduct,
            description,
            unitPrice,
            quantity: defaultQuantity,
            subTotal: calculatedSubTotal,
        }));
    };

    const handleQuantityChange = (value) => {
        const unitPrice = formData.unitPrice;
        const calculatedSubTotal = calculateSubTotal(unitPrice, value);

        setFormData(prevFormData => ({
            ...prevFormData,
            quantity: value,
            subTotal: calculatedSubTotal,
        }));
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const ProductsData = await fetchProductsDropdown();
                setDropdown(prevDropdown => ({
                    ...prevDropdown,
                    products: ProductsData.map(data => ({
                        id: data._id,
                        label: data.product_name?.trim(),
                        unitPrice: data.sale_price,
                        productDescription: data.product_description,
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

    useEffect(() => {
        const fetchTaxes = async () => {
            try {
                const TaxData = await fetchTaxDropdown();
                setDropdown(prevDropdown => ({
                    ...prevDropdown,
                    taxes: TaxData.map(data => ({
                        id: data._id,
                        label: data.tax_type_name,
                    })),
                }));
            } catch (error) {
                console.error('Error fetching Unit Of Measure dropdown data:', error);
            }
        };

        fetchTaxes();
    }, []);


    const toggleBottomSheet = (type) => {
        setSelectedType(isVisible ? null : type);
        setIsVisible(!isVisible);
    };

    const validateForm = (fieldsToValidate) => {
        Keyboard.dismiss();
        const { isValid, errors } = validateFields(formData, fieldsToValidate);
        setErrors(errors);
        return isValid;
    };

    const handleSubmit = async () => {
        const fieldsToValidate = ['spareParts', 'tax'];
        if (validateForm(fieldsToValidate)) {
            const requestBody =
            {
                _id: id,
                job_stage: 'Waiting for spare',
                create_job_diagnosis: [
                    {
                        job_registration_id: id,
                        proposed_action_id: null,
                        proposed_action_name: null,
                        untaxed_total_amount: "",
                        done_by_id: currentUser?.related_profile?._id ?? null,
                        done_by_name: currentUser.related_profile.name ?? null,
                        parts_or_service_required: null,
                        service_type: null,
                        service_charge: null,
                        total_amount: null,
                        parts: sparePartsItems?.map(items => ({
                            product_id: items.formData?.spareParts.id ?? null,
                            product_name: items.formData?.spareParts.label ?? null,
                            description: items.formData.description || null,
                            uom_id: items.formData?.uom.id ?? null,
                            uom: items.formData?.uom.label ?? null,
                            quantity: items.formData.quantity || null,
                            unit_price: items.formData.unitPrice || null,
                            sub_total: items.formData.subTotal || null,
                            unit_cost: null,
                            tax_type_name: items.formData?.tax.id ?? null,
                            tax_type_id: items.formData?.tax.label ?? null,

                        }))
                    }
                ]
            }

            try {
                const response = await put("/updateJobRegistration", requestBody);
                if (response.message === 'Succesfully updated Spare Part Request') {
                    showToast({
                        type: "success",
                        title: "Success",
                        message: response.message || "Spare Part Request updated successfully",
                    });
                    addSpareParts(spareItem);
                    navigation.navigate('UpdateDetail', { updatedItem: spareItem });
                } else {
                    showToast({
                        type: "error",
                        title: "ERROR",
                        message: response.message || "Spare Part Request updation failed",
                    });
                }
            } catch (error) {
                showToast({
                    type: "error",
                    title: "ERROR",
                    message: "An unexpected error occurred. Please try again later.",
                });
            } finally {
                setIsSubmitting(false);
            }
            addSpareParts(spareItem);
            navigation.navigate('UpdateDetail', { updatedItem: spareItem });
        }
    };

    const renderBottomSheet = () => {
        let items = [];
        let fieldName = '';

        switch (selectedType) {
            case 'Spare Name':
                items = dropdown.products;
                fieldName = 'spareParts';
                break;
            case 'UOM':
                items = dropdown.unitofmeasure;
                fieldName = 'uom';
                break;
            case 'Tax':
                items = dropdown.taxes;
                fieldName = 'tax';
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
                    if (selectedType === 'Spare Name') {
                        handleProductSelection(value);
                    } else {
                        handleFieldChange(fieldName, value);
                    }
                }}
            />
        );
    };

    return (
        <SafeAreaView>
            <NavigationHeader
                title="Add Spare Parts"
                onBackPress={() => navigation.goBack()}
            />
            <RoundedScrollContainer>
                <FormInput
                    label="Spare Name"
                    placeholder="Select Product Name"
                    dropIcon="menu-down"
                    multiline
                    required
                    editable={false}
                    validate={errors.spareParts}
                    value={formData.spareParts?.label?.trim()}
                    onPress={() => toggleBottomSheet('Spare Name')}
                />
                <FormInput
                    label="Description"
                    placeholder="Enter Description"
                    editable={true}
                    value={formData.description}
                    onChangeText={(value) => handleFieldChange('description', value)}
                />
                <FormInput
                    label="Quantity"
                    placeholder="Enter Quantity"
                    editable={true}
                    keyboardType="numeric"
                    value={formData.quantity}
                    onChangeText={(value) => handleQuantityChange(value)}
                />
                <FormInput
                    label="UOM"
                    placeholder="Select Unit Of Measure"
                    dropIcon="menu-down"
                    editable={false}
                    value={formData.uom?.label}
                    onPress={() => toggleBottomSheet('UOM')}
                />
                <FormInput
                    label="Unit Price"
                    placeholder="Enter Unit Price"
                    editable={false}
                    keyboardType="numeric"
                    value={formData.unitPrice}
                />
                <FormInput
                    label="Taxes"
                    placeholder="Enter Tax"
                    editable={false}
                    required
                    keyboardType="numeric"
                    value={formData.tax}
                    onChangeText={(value) => handleFieldChange('tax', value)}
                />
                <FormInput
                    label="Service Charge"
                    placeholder="Enter Service Charge"
                    editable={true}
                    keyboardType="numeric"
                    value={formData.serviceCharge}
                    onChangeText={(value) => handleFieldChange('serviceCharge', value)}
                />
                <FormInput
                    label="Sub Total"
                    placeholder="Enter Sub Total"
                    editable={false}
                    keyboardType="numeric"
                    value={formData.subTotal}
                />
                {renderBottomSheet()}
                <Button
                    title={'ADD ITEM'}
                    width={'50%'}
                    alignSelf={'center'}
                    backgroundColor={COLORS.primaryThemeColor}
                    onPress={handleSubmit}
                />
            </RoundedScrollContainer>
        </SafeAreaView>
    );
};

export default AddSpareParts
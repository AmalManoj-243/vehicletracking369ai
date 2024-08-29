import React, { useEffect, useState, useCallback } from 'react';
import { RoundedScrollContainer, SafeAreaView } from '@components/containers';
import { TextInput as FormInput } from '@components/common/TextInput';
import { fetchProductsDropdown, fetchUnitOfMeasureDropdown } from '@api/dropdowns/dropdownApi';
import { useFocusEffect } from '@react-navigation/native';
import { DropdownSheet } from '@components/common/BottomSheets';
import { NavigationHeader } from '@components/Header';
import { Button } from '@components/common/Button';
import { COLORS } from '@constants/theme';
import { Keyboard } from 'react-native';
import { validateFields } from '@utils/validation';

const AddSpareParts = ({ navigation, route }) => {

    const { id, addSpareParts } = route?.params || {};

    const [selectedType, setSelectedType] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const [dropdown, setDropdown] = useState({
        products: [],
        unitofmeasure: []
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

    const handleSubmit = () => {
        const fieldsToValidate = ['spareParts', 'tax'];
        if (validateForm(fieldsToValidate)) {
            const spareItem = {
                spareParts: formData.spareParts?.label || '',
                description: formData.description || '',
                quantity: formData.quantity || '',
                uom: formData.uom?.label || '',
                unitPrice: formData.unitPrice || '',
                tax: formData.tax || '',
                subTotal: formData.subTotal || '',
            };
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

// import axios from 'axios';
// import React, { useState, useEffect } from 'react';
// import { RoundedScrollContainer, SafeAreaView } from '@components/containers';
// import { TextInput as FormInput } from '@components/common/TextInput';
// import { fetchProductsDropdown, fetchUnitOfMeasureDropdown } from '@api/dropdowns/dropdownApi';
// import { useFocusEffect } from '@react-navigation/native';
// import { DropdownSheet } from '@components/common/BottomSheets';
// import { NavigationHeader } from '@components/Header';
// import { Button } from '@components/common/Button';
// import { COLORS } from '@constants/theme';
// import { Keyboard, Alert } from 'react-native';
// import { validateFields } from '@utils/validation';

// const AddSpareParts = ({ navigation, route }) => {

//     const { id, addSpareParts } = route?.params || {};

//     const [selectedType, setSelectedType] = useState(null);
//     const [isVisible, setIsVisible] = useState(false);

//     const [dropdown, setDropdown] = useState({
//         products: [],
//         unitofmeasure: []
//     });

//     const [formData, setFormData] = useState({
//         spareParts: '',
//         description: '',
//         quantity: '1',
//         uom: '',
//         unitPrice: '',
//         serviceCharge: '100',
//         tax: 'VAT 5%',
//         subTotal: '',
//     });

//     const [errors, setErrors] = useState({});

//     const calculateSubTotal = (unitPrice, quantity) => {
//         return unitPrice && quantity ? (parseFloat(unitPrice) * parseFloat(quantity)).toFixed(2) : '';
//     };

//     const handleFieldChange = (field, value) => {
//         setFormData((prevFormData) => ({
//             ...prevFormData,
//             [field]: value,
//         }));
//         if (errors[field]) {
//             setErrors((prevErrors) => ({
//                 ...prevErrors,
//                 [field]: null,
//             }));
//         }
//     };

//     const handleProductSelection = (selectedProduct) => {
//         const unitPrice = selectedProduct.unitPrice ? selectedProduct.unitPrice.toString() : '0';
//         const description = selectedProduct.productDescription || '';
//         const defaultQuantity = '1';
//         const calculatedSubTotal = calculateSubTotal(unitPrice, defaultQuantity);

//         setFormData(prevFormData => ({
//             ...prevFormData,
//             spareParts: selectedProduct,
//             description,
//             unitPrice,
//             quantity: defaultQuantity,
//             subTotal: calculatedSubTotal,
//         }));
//     };

//     const handleQuantityChange = (value) => {
//         const unitPrice = formData.unitPrice;
//         const calculatedSubTotal = calculateSubTotal(unitPrice, value);

//         setFormData(prevFormData => ({
//             ...prevFormData,
//             quantity: value,
//             subTotal: calculatedSubTotal,
//         }));
//     };

//     useEffect(() => {
//         const fetchProducts = async () => {
//             try {
//                 const ProductsData = await fetchProductsDropdown();
//                 setDropdown(prevDropdown => ({
//                     ...prevDropdown,
//                     products: ProductsData.map(data => ({
//                         id: data._id,
//                         label: data.product_name?.trim(),
//                         unitPrice: data.sale_price,
//                         productDescription: data.product_description,
//                     })),
//                 }));
//             } catch (error) {
//                 console.error('Error fetching Products dropdown data:', error);
//             }
//         };

//         fetchProducts();
//     }, []);

//     useEffect(() => {
//         const fetchUnitOfMeasure = async () => {
//             try {
//                 const UnitOfMeasureData = await fetchUnitOfMeasureDropdown();
//                 setDropdown(prevDropdown => ({
//                     ...prevDropdown,
//                     unitofmeasure: UnitOfMeasureData.map(data => ({
//                         id: data._id,
//                         label: data.uom_name,
//                     })),
//                 }));
//             } catch (error) {
//                 console.error('Error fetching Unit Of Measure dropdown data:', error);
//             }
//         };

//         fetchUnitOfMeasure();
//     }, []);


//     const toggleBottomSheet = (type) => {
//         setSelectedType(isVisible ? null : type);
//         setIsVisible(!isVisible);
//     };

//     const validateForm = (fieldsToValidate) => {
//         Keyboard.dismiss();
//         const { isValid, errors } = validateFields(formData, fieldsToValidate);
//         setErrors(errors);
//         return isValid;
//     };

//     const handleSubmit = async () => {
//         const fieldsToValidate = ['spareParts', 'tax'];
//         if (validateForm(fieldsToValidate)) {
//     const requestBody = {
//         job_registration_id: "66cc681fbf21f17a3e23c6ba",
//         date: "2024-08-26T11:33:53.718Z",
//         status: "waiting for parts",
//         created_by: null,
//         created_by_name: "",
//         assigned_to: "66aca087b8b0f7479320d8c3",
//         assigned_to_name: "Akhil",
//         warehouse_id: formData?.warehouse.id ?? null,
//         warehouse_name: formData.warehouse?.label ?? null,
//         job_diagnosis_ids: [
//             {
//                 job_diagnosis_id: "66cc6838bf21f17a3e23c6e2",
//                 job_diagnosis_parts: [
//                     {
//                         product_id: formData.spareParts.id,
//                         product_name: formData.spareParts.label ?? null,
//                         description: formData.description,
//                         uom_id: formData.uom,
//                         uom: dropdown.unitofmeasure.find(uom => uom.id === formData.uom)?.label || '',
//                         quantity: parseFloat(formData.quantity),
//                         unit_price: parseFloat(formData.unitPrice),
//                         unit_cost: parseFloat(formData.serviceCharge),
//                         tax_type_id: "648d9b54ef9cd868dfbfa37b",
//                         tax_type_name: formData.tax,
//                         job_diagnosis_id: "66cc6838bf21f17a3e23c6e2",
//                         status: "out_of_stock",
//                         id: "66cc6838bf21f17a3e23c6e6",
//                         _v: 0
//                     }
//                 ]
//             }
//         ],
//         sales_person_id: formData?.assignedTo.id ?? null,
//         sales_person_name: formData.assignedTo?.label ?? null,
//     };

//     try {
//         const response = await post("/createJobApproveQuote", requestBody);
//         // console.log("🚀 ~ submit ~ response:", response);
// if (response.success === 'true') {
//     showToast({
//       type: "success",
//       title: "Success",
//       message: response.message || "Spare Parts created successfully",
//     });

//     navigation.goBack()
//   } else {
//     console.error("Spare Parts request Failed:", response.message);
//     showToast({
//       type: "error",
//       title: "ERROR",
//       message: response.message || "Spare Parts Service creation failed",
//     });
//   }
// } catch (error) {
//   console.error("Error Creating Spare Parts request Failed:", error);
//   showToast({
//     type: "error",
//     title: "ERROR",
//     message: "An unexpected error occurred. Please try again later.",
//   });
// } finally {
//   setIsSubmitting(false);
// }
//         navigation.goBack();
//     } catch (error) {
//         console.error('Error submitting spare parts data:', error);
//         Alert.alert('Error', 'There was an error submitting the spare parts data.');
//     }
// }
// };

// return (
// <SafeAreaView>
//     <NavigationHeader title="Add Spare Parts" onBackPress={() => navigation.goBack()} />
//     <RoundedScrollContainer>
//         <FormInput
//             label="Spare Parts"
//             value={formData.spareParts?.label || ''}
//             onPress={() => toggleBottomSheet('products')}
//             errorMessage={errors.spareParts}
//         />
//         <FormInput
//             label="Description"
//             value={formData.description}
//             onChangeText={(text) => handleFieldChange('description', text)}
//         />
//         <FormInput
//             label="Quantity"
//             value={formData.quantity}
//             keyboardType="numeric"
//             onChangeText={handleQuantityChange}
//             errorMessage={errors.quantity}
//         />
//         <FormInput
//             label="Unit Price"
//             value={formData.unitPrice}
//             keyboardType="numeric"
//             onChangeText={(text) => handleFieldChange('unitPrice', text)}
//             errorMessage={errors.unitPrice}
//         />
//         <FormInput
//             label="Service Charge"
//             value={formData.serviceCharge}
//             editable={false}
//         />
//         <FormInput
//             label="Tax"
//             value={formData.tax}
//             onPress={() => toggleBottomSheet('tax')}
//             errorMessage={errors.tax}
//         />
//         <FormInput
//             label="Subtotal"
//             value={formData.subTotal}
//             editable={false}
//         />
//         <Button
//             title="Submit"
//             onPress={handleSubmit}
//             backgroundColor={COLORS.primary}
//             color={COLORS.white}
//         />
//     </RoundedScrollContainer>

//     {/* Bottom Sheet for selecting products, UOM, etc. */}
//     <DropdownSheet
//         visible={isVisible}
//         onClose={() => setIsVisible(false)}
//         items={dropdown[selectedType]}
//         onSelect={(item) => {
//             selectedType === 'products' ? handleProductSelection(item) : handleFieldChange('uom', item.id);
//             setIsVisible(false);
//         }}
//     />
// </SafeAreaView>
// );
// };

// export default AddSpareParts;


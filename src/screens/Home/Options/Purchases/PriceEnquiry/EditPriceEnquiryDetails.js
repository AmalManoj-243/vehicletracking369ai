import React, { useState, useCallback } from 'react';
import { View, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from '@components/containers';
import NavigationHeader from '@components/Header/NavigationHeader';
import { RoundedScrollContainer } from '@components/containers';
import { DetailField } from '@components/common/Detail';
import { formatDate } from '@utils/common/date';
import { showToastMessage } from '@components/Toast';
import { TextInput as FormInput } from "@components/common/TextInput";
import { fetchPriceEnquiryDetails } from '@api/details/detailApi';
import PriceDetailList from './PriceDetailList';
import { OverlayLoader } from '@components/Loader';
import { Button } from '@components/common/Button';
import { COLORS } from '@constants/theme';
import { put, get } from '@api/services/utils';

const EditPriceEnquiryDetails = ({ navigation, route }) => {
    const { id: priceId } = route?.params || {};
    const [details, setDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [priceLines, setPriceLines] = useState([]);
    const [inputPrice, setInputPrice] = useState('');

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const updatedDetails = await fetchPriceEnquiryDetails(priceId);
            const requestDetails = updatedDetails[0]?.request_details?.[0];
            setDetails(updatedDetails[0] || {});
            setPriceLines(requestDetails?.supplier_prices || []);
        } catch (error) {
            console.error('Error fetching service details:', error);
            showToastMessage('Failed to fetch service details. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (priceId) {
                fetchDetails(priceId);
            }
        }, [priceId])
    );

    const handlePriceChange = (value) => {
        setInputPrice(value);
        const updatedPriceLines = priceLines.map((line) => ({
            ...line,
            price: parseFloat(value) || line.price,
        }));
        setPriceLines(updatedPriceLines);
    };

    // const handleViewPrice = async () => {
    //     setIsLoading(true);
    //     try {
    //         const response = await get(`/viewPriceEnquiry/${priceId}`);
    //         if (response.success) {
    //             navigation.navigate('PriceEnquiryDetails', { details: response.data[0] });
    //         } else {
    //             showToastMessage('Failed to view purchase details. Please try again.');
    //         }
    //     } catch (error) {
    //         console.error('Error in handleViewPurchase:', error.message || 'Unknown error');
    //         showToastMessage('An error occurred. Please try again.');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleViewPrice = async () => {
        setIsLoading(true);
        try {
            const response = await get(`/viewPriceEnquiry/${priceId}`);
            if (response.success) {
                navigation.navigate('PriceEnquiryDetails', { id: priceId });
            } else {
                showToastMessage('Failed to retrieve price enquiry details. Please try again.');
            }
        } catch (error) {
            console.error('Error in handleViewPrice:', error.message || 'Unknown error');
            showToastMessage('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditPrice = async () => {
        setIsSubmitting(true);
        try {
            const validPriceLines = priceLines
                .filter(({ _id, price, status }) => _id && price != null && status)
                .map(({ _id, price, status }) => ({
                    _id,
                    price: parseFloat(price),
                    status: status || "submitted",
                }));
    
            const updateData = {
                _id: details._id,
                supplier_price_array: validPriceLines,
            };
            const response = await put('/updateSupplierPriceArray', updateData);
            if (response && (response.status === "true" || response.status === true)) {
                showToastMessage('Successfully Added Price');
            } else {
                showToastMessage('Failed to update purchase. Please try again.');
            }
        } catch (error) {
            console.error('Error in handleEditPrice:', error.message || 'Unknown error');
            showToastMessage('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };       
    
    return (
      <SafeAreaView>
        <NavigationHeader
            title={details?.sequence_no || 'Edit Purchase Details'}
            onBackPress={() => navigation.goBack()}
            logo={false}
        />
        <RoundedScrollContainer>
            <DetailField label="Requested By" value={details?.request_details?.[0]?.requested_by?.employee_name || '-'} />
            <DetailField label="Request Date" value={formatDate(details?.request_details?.[0]?.request_date)} />
            <DetailField label="Warehouse" value={details?.request_details?.[0]?.warehouse?.warehouse_name || '-'} />
            <DetailField label="Require By" value={formatDate(details?.request_details?.[0]?.require_by)} />
            <FormInput
                label={"Price"}
                placeholder={"Enter Price"}
                editable={true}
                keyboardType="numeric"
                value={inputPrice}
                onChangeText={handlePriceChange}
            />

            <FlatList
                data={priceLines}
                renderItem={({ item }) => <PriceDetailList item={item} />}
                keyExtractor={(item) => item._id}
            />

            <View style={{ flexDirection: 'row', marginVertical: 20 }}>
                <Button
                    width={'50%'}
                    backgroundColor={COLORS.tabIndicator}
                    title="VIEW"
                    onPress={handleViewPrice}
                />
                <View style={{ width: 5 }} />
                <Button
                    width={'50%'}
                    backgroundColor={COLORS.green}
                    title="SUBMIT"
                    onPress={handleEditPrice}
                />
            </View>

            <OverlayLoader visible={isLoading || isSubmitting} />
        </RoundedScrollContainer>
      </SafeAreaView>
    );
};

export default EditPriceEnquiryDetails;
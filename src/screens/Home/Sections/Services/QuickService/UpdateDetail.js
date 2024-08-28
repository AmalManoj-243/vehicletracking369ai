import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from '@components/containers';
import NavigationHeader from '@components/Header/NavigationHeader';
import { RoundedScrollContainer } from '@components/containers';
import { DetailField } from '@components/common/Detail';
import { OverlayLoader } from '@components/Loader';
import SparePartsList from './SparePartsList';
import { formatDateTime } from '@utils/common/date';
import { showToastMessage } from '@components/Toast';
import { fetchServiceDetails } from '@api/details/detailApi';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';

const UpdateDetails = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { id, updatedItem } = route.params || {};

    const [details, setDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [savedItems, setSavedItems] = useState([]);

    useEffect(() => {
        if (updatedItem) {
            setSavedItems(prevItems => [...prevItems, updatedItem]);
        }
    }, [updatedItem]);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const updatedDetails = await fetchServiceDetails(id);
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
            if (id) {
                fetchDetails(id);
            }
        }, [id])
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <NavigationHeader
                title="Update Details"
                onBackPress={() => navigation.goBack()}
            />
            <RoundedScrollContainer>
                <DetailField
                    label="Customer"
                    value={details?.customer_name?.trim() || '-'}
                    multiline
                    numberOfLines={3}
                    textAlignVertical={'top'}
                />
                <DetailField label="Mobile Number" value={details?.customer_mobile || '-'} />
                <DetailField label="Email" value={details?.customer_email || '-'} />
                <DetailField label="Warehouse Name" value={details?.warehouse_name || '-'} />
                <DetailField label="Created On" value={formatDateTime(details.date)} />
                <DetailField label="Created By" value={details?.assignee_name || '-'} />
                <DetailField label="Brand Name" value={details?.brand_name || '-'} />
                <DetailField label="Device Name" value={details?.device_name || '-'} />
                <DetailField label="Consumer Model" value={details?.consumer_model_name || '-'} />
                <View style={{ justifyContent: 'space-between', flexDirection: 'row', marginVertical: 10 }}>
                    <Text style={styles.label}>Add spare parts</Text>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('AddSpareParts')}>
                        <AntDesign name="pluscircle" size={26} color={COLORS.orange} />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={savedItems}
                    renderItem={({ item }) => (
                        <SparePartsList item={item} />
                    )}
                    keyExtractor={(item, index) => index.toString()}
                />
            </RoundedScrollContainer>
            {isLoading && <OverlayLoader />}
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
});

export default UpdateDetails;

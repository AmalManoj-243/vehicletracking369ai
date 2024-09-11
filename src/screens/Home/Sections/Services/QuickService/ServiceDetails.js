import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View } from 'react-native';
import { SafeAreaView } from '@components/containers';
import NavigationHeader from '@components/Header/NavigationHeader';
import { RoundedScrollContainer } from '@components/containers';
import { DetailField } from '@components/common/Detail';
import { formatDateTime } from '@utils/common/date';
import { showToastMessage } from '@components/Toast';
import { fetchServiceDetails } from '@api/details/detailApi';
import { OverlayLoader } from '@components/Loader';
import { LoadingButton } from '@components/common/Button';
import { COLORS } from '@constants/theme';
import { post, put } from '@api/services/utils';
import { ConfirmationModal } from '@components/Modal';

const ServiceDetails = ({ navigation, route }) => {
    const { id: serviceId } = route?.params || {};
    const [details, setDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [closingReason, setClosingReason] = useState('');
    const [actionToPerform, setActionToPerform] = useState(null);

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

    const handleCloseJob = async () => {
        setIsSubmitting(true);
        try {
            const closeJobData = {
                _id: details._id,
                job_stage: "Closed",
                job_stage_close_reason: null,
            };
            console.log("Success", closeJobData)
            const response = await put('/updateJobRegistration', closeJobData);   
            console.log(response)
            if (response.success === "true") {
                showToastMessage('Job successfully closed!');
                navigation.navigate('QuickServiceScreen');
            } else {
                showToastMessage('Failed to close job. Please try again.');
            }
        } catch (error) {
            console.error('API error:', error);
            showToastMessage('An error occurred. Please try again.');
        } finally {
            fetchDetails();
            setIsSubmitting(false);
            setIsConfirmationModalVisible(false);
            setClosingReason('');
        }
    };

    const handleUpdateJob = async () => {
        setIsSubmitting(true);
        try {
            const updateJobData = {
                service_id: serviceId,
            };
            const response = await post('/createJobApproveQuote', updateJobData);
            if (response.success === "true") {
                navigation.navigate('UpdateDetail', {
                    id: serviceId,
                    details: {
                        customerName: details.customer_name,
                        mobile: details.customer_mobile,
                        email: details.customer_email,
                        warehouse: details.warehouse_name,
                        createdOn: details.date,
                        createdBy: details.assignee_name,
                        brandName: details.brand_name,
                        deviceName: details.device_name,
                        consumerModel: details.consumer_model_name,
                        serialNumber: details.serial_no,
                    }
                });
            } else {
                showToastMessage('Failed to update job. Please try again.');
            }
        } catch (error) {
            console.error('API error:', error);
            showToastMessage('An error occurred. Please try again.');
        } finally {
            fetchDetails();
            setIsSubmitting(false);
            setIsUpdateModalVisible(false);
        }
    };

    const accessoriesString = details?.accessories?.map(acc => acc.accessory_name).join(', ') || '-';

    return (
        <SafeAreaView>
            <NavigationHeader
                title= {details?.sequence_no || 'Quick Service Details'}
                onBackPress={() => navigation.goBack()}
                logo={false}
                iconTwoName="plus"
                iconTwoPress={() => { navigation.navigate('QuickServiceFormTabs', { serviceId: serviceId }) }}
            />
            <RoundedScrollContainer>
                <DetailField label="Customer"
                    value={details?.customer_name ? details.customer_name.trim() : '-'} 
                    multiline
                    numberOfLines={3}
                    textAlignVertical={'top'} />
                <DetailField label="Mobile Number" value={details?.customer_mobile || '-'} />
                <DetailField label="Email" value={details?.customer_email || '-'} />
                <DetailField label="Warehouse Name" value={details?.warehouse_name || '-'} />
                <DetailField label="Created On" value={formatDateTime(details.date)} />
                <DetailField label="Created By" value={details?.assignee_name || '-'} />
                <DetailField label="Brand Name" value={details?.brand_name || '-'} />
                <DetailField label="Device Name" value={details?.device_name || '-'} />
                <DetailField label="Consumer Model" value={details?.consumer_model_name || '-'} />
                <DetailField label="IMEI Number" value={details?.imei_no?.toString() || '-'} />
                <DetailField label="Serial Number" value={details?.serial_no || '-'} />
                <DetailField label="Assigned To" value={details?.assignee_name || '-'} />
                <DetailField label="Remarks"
                    value={details?.remarks || '-'}
                    multiline
                    numberOfLines={3}
                    textAlignVertical={'top'} />
                <DetailField label="Pre Condition" value={details?.pre_condition || '-'} />
                <DetailField label="Estimation" value={details?.estimation?.toString() || '-'} />
                <DetailField label="Accessories" value={accessoriesString} />

                <View style={{ flexDirection: 'row', marginVertical: 20 }}>
                    <LoadingButton
                        width={'50%'}
                        backgroundColor={COLORS.lightRed}
                        title="CLOSE JOB"
                        onPress={() => {
                            setActionToPerform('close');
                            setIsConfirmationModalVisible(true);
                        }}
                    />
                    <View style={{ width: 5 }} />
                    <LoadingButton
                        width={'50%'}
                        backgroundColor={COLORS.green}
                        title="UPDATE"
                        onPress={() => {
                            setActionToPerform('update');
                            setIsUpdateModalVisible(true);
                        }}
                    />
                </View>

                <ConfirmationModal
                    isVisible={isConfirmationModalVisible}
                    onCancel={() => setIsConfirmationModalVisible(false)}
                    onConfirm={() => {
                        if (actionToPerform === 'close') {
                            handleCloseJob();
                        }
                    }}
                    headerMessage='Are you sure you want to close this service job?'
                />

                <ConfirmationModal
                    isVisible={isUpdateModalVisible}
                    onCancel={() => setIsUpdateModalVisible(false)}
                    onConfirm={handleUpdateJob}
                    headerMessage='Are you sure you want to update this service job?'
                />

                <OverlayLoader visible={isLoading || isSubmitting} />
            </RoundedScrollContainer>
        </SafeAreaView>
    );
};

export default ServiceDetails;

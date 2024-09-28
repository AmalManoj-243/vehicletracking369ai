import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, FlatList, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from '@components/containers';
import NavigationHeader from '@components/Header/NavigationHeader';
import { RoundedScrollContainer } from '@components/containers';
import { DetailField } from '@components/common/Detail';
import { showToastMessage } from '@components/Toast';
import { fetchKPIDashboardDetails } from '@api/details/detailApi';
import { OverlayLoader } from '@components/Loader';
import { LoadingButton } from '@components/common/Button';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import { post, put } from '@api/services/utils';
import { ConfirmationModal } from '@components/Modal';

const KPIActionDetails = ({ navigation, route }) => {
    const { id } = route?.params || {};
    const [details, setDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
    const [isStartModalVisible, setIsStartModalVisible] = useState(false);
    const [actionToPerform, setActionToPerform] = useState(null);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const updatedDetails = await fetchKPIDashboardDetails(id); 
            setDetails(updatedDetails[0] || {});
        } catch (error) {
            console.error('Error fetching KPI details:', error);
            showToastMessage('Failed to fetch KPI details. Please try again.');
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

    const addParticipants = (addedItems) => {
        const structureParticipants = {
          product_id: addedItems?.product.id,
          product_name: addedItems?.product.label,
          description: addedItems?.description,
          
        }
        setSparePartsItems(prevItems => [...prevItems, structureParticipants]);
        console.log("Structure Spare Items", structureParticipants)
      };

    // const handleCloseJob = async () => {
    // };

    const handleStartTask = async () => {
        setIsSubmitting(true);
        try {
            const updateJobData = {
                service_id: kpiId,
            };
            const response = await post('/createJobApproveQuote', updateJobData);
            if (response.success === "true") {
                showToastMessage('KPI Started Successfully');
            } else {
                showToastMessage('Failed to start task. Please try again.');
            }
        } catch (error) {
            console.error('API error:', error);
            showToastMessage('An error occurred. Please try again.');
        } finally {
            fetchDetails();
            setIsSubmitting(false);
            setIsStartModalVisible(false);
        }
    };

    return (
        <SafeAreaView>
            <NavigationHeader
                title= {'KPI Action Details'}
                onBackPress={() => navigation.goBack()} />
            <RoundedScrollContainer>
                <DetailField label="Sequence No" value={details?.kpi_sequenceNo || '-' } />
                <DetailField label="Action Status" value={details?.status || '-'} />
                <DetailField label="KRA" value={details?.kra?.name || '-'} />
                <DetailField label="KPI Name" value={details?.kpi_name || '-'} />
                <DetailField label="Created By" value={details?.created_by?.name || '-'} />
                <DetailField label="User Group" value={details?.usergroup?.group_name || '-'} />
                <DetailField label="Person" value={details?.employee?.name || '-'} />
                <DetailField label="Action Screen Name" value={details?.action_screen_name || '-'} />
                <DetailField label="Next KPI Name" value={details?.next_kpi_name || '-'} />
                <DetailField label="KPI Description" value={details?.kpi_description || '-'} />
                <DetailField label="Is Mandatory" value={details?.is_mandatory || '-'} />
                <DetailField label="Priority" value={details?.priority || '-'} />
                <DetailField label="Checklists" value={details?.remarks || '-'} />
                <DetailField label="Reference Document" value={details?.pre_condition || '-'} />
                <DetailField label="Estimated Time (HR)" value={details?.totalEstimation?.[0]?.estimated_time?.toString() || '-'} />
                <DetailField label="Deadline" value={details?.deadline || '-'} />
                <DetailField label="KPI Points" value={details?.deadline || '-'} />
                <DetailField label="Warehouse" value={details?.warehouse?.[0]?.warehouse_name || '-'} />
                <DetailField label="Is Manager Review Needed" value={details?.is_manager_review_needed || '-'} />
                <DetailField label="Is Customer Review Needed" value={details?.is_customer_review_needed || '-'} />
                <DetailField label="Guidelines" value={details?.deadline || '-'} />
                <View style={{ justifyContent: 'space-between', flexDirection: 'row', marginVertical: 10 }}>
                <Text style={styles.label}>Add Participants</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('AddParticipants', { id, addParticipants })}>
                <AntDesign name="pluscircle" size={26} color={COLORS.orange} />
                </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', marginVertical: 5, padding: 1}}>
                    <LoadingButton
                        width={'25%'}
                        backgroundColor={COLORS.brightBlue}
                        title="Start"
                        onPress={() => {
                            setActionToPerform('start');
                            setIsStartModalVisible(true);
                        }}
                    />
                    <View style={{ width: 5 }} />
                    <LoadingButton
                        width={'25%'}
                        backgroundColor={COLORS.yellow}
                        title="Pause"
                        onPress={() => {
                            setActionToPerform('pause');
                            // setIsConfirmationModalVisible(true);
                        }}
                    />
                    <View style={{ width: 5 }} />
                    <LoadingButton
                        width={'25%'}
                        backgroundColor={COLORS.brightBlue}
                        title="Re-Assign"
                        onPress={() => {
                            setActionToPerform('');
                        }}
                    />
                    <View style={{ width: 5 }} />
                    <LoadingButton
                        width={'25%'}
                        backgroundColor={COLORS.green}
                        title="Complete"
                        onPress={() => {
                            setActionToPerform('complete');
                        }}
                    />
                </View>

                <ConfirmationModal
                    isVisible={isStartModalVisible}
                    onCancel={() => setIsStartModalVisible(false)}
                    onConfirm={handleStartTask}
                    headerMessage='Are you sure you want to Start this task?'
                />

                {/* <ConfirmationModal
                    isVisible={isConfirmationModalVisible}
                    onCancel={() => setIsConfirmationModalVisible(false)}
                    onConfirm={() => {
                        if (actionToPerform === 'close') {
                            handleCloseJob();
                        }
                    }}
                    headerMessage='Are you sure you want to close this service job?'
                /> */}

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
  });

export default KPIActionDetails;

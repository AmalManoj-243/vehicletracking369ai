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
import { put } from '@api/services/utils';
import { ConfirmationModal, PauseModal, ReAssignModal, UpdatesModal } from '@components/Modal';
import { formatDateTime } from '@utils/common/date';
import { StartList, PauseList, UpdateList } from '@components/CRM';
import { useAuthStore } from '@stores/auth';
import KPIUpdateList from '@components/KPI/KPIUpdateList';

const KPIActionDetails = ({ navigation, route }) => {

    const { id } = route?.params || {};
    const currentUser = useAuthStore((state) => state.user);
  
    const [details, setDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [actionToPerform, setActionToPerform] = useState(null);
    const [isStartModalVisible, setIsStartModalVisible] = useState(false);
    const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);
    const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
    const [kpiUpdates, setKpiUpdates] = useState([]);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
          const [updatedDetails] = await fetchKPIDashboardDetails(id);
          setDetails(updatedDetails || {});
          setKpiUpdates(updatedDetails?.kpiStatusUpdates || []);
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
            fetchDetails();
          }
        }, [id])
      );
    
      const handleTaskAction = async (actionData, successMessage, modalSetter) => {
        setIsSubmitting(true);
        try {
          const response = await put('/updateKpiTasks',actionData);
          if (response.status === true) {
            showToastMessage(successMessage);
          } else {
            showToastMessage('Failed to perform action. Please try again.');
          }
        } catch (error) {
          console.error('API error:', error);
          showToastMessage('An error occurred. Please try again.');
        } finally {
          fetchDetails();
          setIsSubmitting(false);
          modalSetter(false);
        }
      };
    
      const handleStartTask = () => {
        const data = {
          _id: details._id || id,
          status: 'In progress',
          assignee_id: currentUser._id,
          assignee_name: currentUser?.related_profile?.name,
          progress_status: 'Ongoing',
          estimatedTime: details.totalEstimation?.[0]?.estimated_time || 0,
          time: new Date(),
        };
        handleTaskAction(data, 'Task started successfully', setIsStartModalVisible);
      };
    
      const handlePauseTask = (pauseReason) => {
        const data = {
          _id: details._id || id,
          assignee_id: currentUser._id,
          assignee_name: currentUser?.related_profile?.name,
          progress_status: 'Pause',
          pause_reason: pauseReason,
        };
        handleTaskAction(data, 'Task paused successfully', setIsPauseModalVisible);
      };
    
      const handleReAssignTask = () => {
        const data = {
          _id: details._id || id,
          assignee_id: currentUser._id,
          assignee_name: currentUser?.related_profile?.name,
          estimatedTime: details.totalEstimation?.[0]?.estimated_time || 0,
        };
        handleTaskAction(data, 'Task reassigned successfully', setIsAssignModalVisible);
      };
    
      const handleCompleteTask = () => {
        const data = {
          _id: details._id || id,
          assignee_id: currentUser._id,
          assignee_name: currentUser?.related_profile?.name,
          progress_status: 'Completed',
          status: 'Completed',
        };
        handleTaskAction(data, 'Task completed successfully', setIsStartModalVisible);
      };
    
      const saveUpdates = async (updateText) => {
        const updateData = {
          _id: details._id || id,
          kpiStatusUpdates: [
            {
              isDeveloper: true,
              assignee_id: currentUser._id,
              assignee_name: currentUser?.related_profile?.name,
              updateText,
            },
          ],
        };
    
        handleTaskAction(updateData, 'Update saved successfully', setIsModalVisible);
      };

    return (
        <SafeAreaView>
            <NavigationHeader
                title={'KPI Action Details'}
                onBackPress={() => navigation.goBack()} />
            <RoundedScrollContainer>
                <DetailField label="Sequence No" value={details?.kpi_sequenceNo || '-'} />
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

                {/* Participants */}
                {/* <View style={{ justifyContent: 'space-between', flexDirection: 'row', marginVertical: 10 }}>
                    <Text style={styles.label}>Add Participants</Text>
                    <TouchableOpacity activeOpacity={0.7}
                        onPress={() => {
                            navigation.navigate('AddParticipants', { id });
                        }}>
                        <AntDesign name="pluscircle" size={26} color={COLORS.orange} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={participants}
                    renderItem={({ item }) => (
                        <Text>{item.assignee_name}</Text>
                    )} 
                    keyExtractor={(item, index) => item.assignee_id || index.toString()}
                /> */}

                <View style={{ justifyContent: 'space-between', flexDirection: 'row', marginVertical: 10 }}>
                    <Text style={styles.label}>Updates</Text>
                    <TouchableOpacity activeOpacity={0.7}
                        onPress={() => setIsModalVisible(true)} >
                        <AntDesign name="pluscircle" size={27} color={COLORS.orange} />
                    </TouchableOpacity>
                </View>
                {/* Rendering updates */}
                <FlatList
                    data={kpiUpdates}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <KPIUpdateList item={item} />
                    )}
                    showsVerticalScrollIndicator={false}
                />

                <View style={{ flexDirection: 'row', marginVertical: 5, padding: 1 }}>
                    <LoadingButton
                        width={'50%'}
                        backgroundColor={COLORS.brightBlue}
                        onPress={() => {
                            setActionToPerform('start');
                            setIsStartModalVisible(true);
                        }}
                        title={(
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <AntDesign name="rightcircle" size={20} color={COLORS.white} />
                                <Text style={{
                                    marginLeft: 8,
                                    fontSize: 16,
                                    color: COLORS.white,
                                    fontFamily: FONT_FAMILY.urbanistSemiBold,
                                }}>Start
                                </Text>
                            </View>
                        )}
                    />
                    <View style={{ width: 5 }} />
                    <LoadingButton
                        width={'50%'}
                        backgroundColor={COLORS.yellow}
                        onPress={() => {
                            setActionToPerform('pause');
                            setIsPauseModalVisible(true);
                        }}
                        title={(
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <AntDesign name="pausecircle" size={20} color={COLORS.white} />
                                <Text style={{
                                    marginLeft: 8,
                                    fontSize: 16,
                                    color: COLORS.white,
                                    fontFamily: FONT_FAMILY.urbanistSemiBold,
                                }}>Pause
                                </Text>
                            </View>
                        )}
                    />
                </View>

                <View style={{ flexDirection: 'row', marginVertical: 5, padding: 1 }}>
                    <LoadingButton
                        width={'50%'}
                        backgroundColor={COLORS.brightBlue}
                        onPress={() => {
                            setActionToPerform('reAssign');
                            setIsAssignModalVisible(true);
                        }}
                        title={(
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <AntDesign name="reload1" size={20} color={COLORS.white} />
                                <Text style={{
                                    marginLeft: 8,
                                    fontSize: 16,
                                    color: COLORS.white,
                                    fontFamily: FONT_FAMILY.urbanistSemiBold,
                                }}>Re-Assign
                                </Text>
                            </View>
                        )}
                    />
                    <View style={{ width: 5 }} />
                    <LoadingButton
                        width={'50%'}
                        backgroundColor={COLORS.green}
                        onPress={() => {
                            setActionToPerform('complete');
                            handleCompleteTask();
                        }}
                        title={(
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <AntDesign name="checkcircleo" size={20} color={COLORS.white} />
                                <Text style={{
                                    marginLeft: 8,
                                    fontSize: 16,
                                    color: COLORS.white,
                                    fontFamily: FONT_FAMILY.urbanistSemiBold,
                                }}>Complete
                                </Text>
                            </View>
                        )}
                    />
                </View>

                {/* Modals */}
                <UpdatesModal
                    isVisible={isModalVisible}
                    header='Add Update'
                    title={'Add Updates'}
                    multiline
                    numberOfLines={5}
                    onClose={() => setIsModalVisible(!isModalVisible)}
                    onSubmit={saveUpdates}
                />
                <PauseModal
                    isVisible={isPauseModalVisible}
                    header='Pausing'
                    title={'Reason'}
                    multiline
                    numberOfLines={2}
                    onClose={() => setIsPauseModalVisible(!isPauseModalVisible)}
                    onSubmit={handlePauseTask}
                />
                <ReAssignModal
                    isVisible={isAssignModalVisible}
                    header='Re-Assigning'
                    onClose={() => setIsAssignModalVisible(!isAssignModalVisible)}
                    onSubmit={handleReAssignTask}
                />
                <ConfirmationModal
                    isVisible={isStartModalVisible}
                    onCancel={() => setIsStartModalVisible(false)}
                    headerMessage='Are you sure you want to Start this task?'
                    onConfirm={handleStartTask}
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
    }
});

export default KPIActionDetails;

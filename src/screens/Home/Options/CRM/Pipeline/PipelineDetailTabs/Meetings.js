import React, { useState, useCallback } from 'react';
import { RoundedScrollContainer } from '@components/containers';
import { useFocusEffect } from '@react-navigation/native';
import { showToastMessage } from '@components/Toast';
import { fetchMeetingsDetails } from '@api/details/detailApi';
import { OverlayLoader } from '@components/Loader';
import { post } from '@api/services/utils';
import MeetingsScheduleModal from '@components/Modal/MeetingsScheduleModal';
import { FABButton } from '@components/common/Button';
import { useAuthStore } from '@stores/auth';
import { formatDateTime } from '@utils/common/date';
import { FlatList } from 'react-native';
import { FollowUpList } from '@components/CRM';

const Meetings = ({ pipelineId }) => {
    const [details, setDetails] = useState({});
    const currentUser = useAuthStore((state) => state.user);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [meetingsHistory, setMeetingsHistory] = useState([]);

    const fetchDetails = async (pipelineId) => {
        setIsLoading(true);
        try {
            const updatedDetails = await fetchMeetingsDetails(pipelineId);
            console.log("Fetched details:", updatedDetails);
            setDetails(updatedDetails[0]);
        } catch (error) {
            console.error('Error fetching meetings details:', error);
            showToastMessage('Failed to fetch meetings details. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (pipelineId) {
                fetchDetails(pipelineId);
            }
        }, [pipelineId])
    );

    const saveUpdates = async (updateData) => {
        try {
            const formattedDate = formatDateTime(new Date(), "Pp");
            const meetingsHistoryData = {
                title: updateData.title || null,
                date: formattedDate,
                employee_id: currentUser._id,
                pipeline_id: pipelineId,
            };
            console.log("Body:", meetingsHistoryData);
            const response = await post('/createCustomerSchedule', meetingsHistoryData);
            console.log("API Response:", response);
            if (response.success === 'true') {
                showToastMessage('Meeting history created successfully');
            } else {
                showToastMessage('Meeting history creation failed');
            }
        } catch (error) {
            console.log("API Error:", error);
        } finally {
            if (pipelineId) {
                fetchDetails(pipelineId);
            }
        }
    };

    return (
        <RoundedScrollContainer paddingHorizontal={0}>
            <FlatList
                data={details.customer_schedules}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <FollowUpList
                        item={item}
                    />
                )}
                showsVerticalScrollIndicator={false} // Custom component to display when the list is empty
            />
            <MeetingsScheduleModal
                isVisible={isModalVisible}
                header='Schedule Meeting'
                title={'Add Meeting'}
                placeholder='Enter meeting'
                onClose={() => setIsModalVisible(!isModalVisible)}
                onSave={saveUpdates}
            />
            <OverlayLoader visible={isLoading} />
            <FABButton onPress={() => setIsModalVisible(!isModalVisible)} />
        </RoundedScrollContainer>
    );
};


export default Meetings;

import React, { useState, useCallback } from 'react';
import { RoundedScrollContainer } from '@components/containers';
import { useFocusEffect } from '@react-navigation/native';
import { showToastMessage } from '@components/Toast';
import { fetchMeetingsDetails, fetchPipelineDetails } from '@api/details/detailApi';
import { OverlayLoader } from '@components/Loader';
import { post } from '@api/services/utils';
import { MeetingsScheduleModal } from '@components/Modal';
import { FABButton } from '@components/common/Button';
import { useAuthStore } from '@stores/auth';
import { formatDateTime } from '@utils/common/date';
import { FlatList } from 'react-native';
import { MeetingsList } from '@components/CRM';

const Meetings = ({ pipelineId }) => {
// console.log("🚀 ~ file: Meetings.js:16 ~ Meetings ~ pipelineId:", pipelineId)

    const currentUser = useAuthStore((state) => state.user);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [meetingsHistory, setMeetingsHistory] = useState([]);
    // console.log(meetingsHistory, "meets")
    // console.log(setMeetingsHistory, "meeting")

    const fetchDetails = async () => { 
        setIsLoading(true);
        try {
            const [updatedDetails] = await fetchPipelineDetails(pipelineId);
            const history = updatedDetails?.customer_schedules
            setMeetingsHistory(history)
        } catch (error) {
            console.error('Error fetching meetings details:', error);
            showToastMessage('Failed to fetch meetings details. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDetails();
        }, [pipelineId])
    );


    const saveUpdates = async (updateText) => {
        console.log("🚀 ~ file: Meetings.js:47 ~ saveUpdates ~ updateText:", updateText)
        try {
            const formattedDate = formatDateTime(new Date(), "Pp");
            const pipelineHistoryData = {
                date: formattedDate,
                title: updateText.title,
                pipeline_id: pipelineId,
            };
            console.log("🚀 ~ file: Meetings.js:55 ~ saveUpdates ~ pipelineHistoryData:", pipelineHistoryData)
            const response = await post('/createCustomerSchedule', pipelineHistoryData);
            console.log("🚀 ~ file: Meetings.js:57 ~ saveUpdates ~ response:", response)

            if (response.success === 'true') {
                showToastMessage('Meetings created successfully');
            } else {
                showToastMessage('Meetings creation failed');
            }
        } catch (error) {
            console.log("API Error:", error);
        } finally {
            fetchDetails();
        }
    };

    return (
        <RoundedScrollContainer>
            <FlatList
                data={meetingsHistory}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <MeetingsList
                        item={item}
                    />
                )}
                showsVerticalScrollIndicator={false}
            />
                <FABButton onPress={() => setIsModalVisible(!isModalVisible)} />
            <MeetingsScheduleModal
                isVisible={isModalVisible}
                title={'Schedule Meeting'}
                placeholder='Enter Meeting'
                onClose={() => setIsModalVisible(!isModalVisible)}
                onSave={saveUpdates}
            />
            <OverlayLoader visible={isLoading} />
        </RoundedScrollContainer>
    );
};

export default Meetings;

// import React, { useState, useEffect } from 'react';
// import { View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
// import apiInstance from '../../../../../api/apiUtils';
// import FABButton from '../../../../../components/Button/FABButton';
// import AddMeetingModal from './Modal/AddMeetingModal';
// import { useIsFocused, useFocusEffect } from '@react-navigation/native';
// import MeetingList from './MeetingList';
// import { fetchMeetingScheduleData } from '../../../../../api/apiService';
// import { showToastMessage } from '../../../../../components/Toast/ToastAndroid';

// const Meeting = ({ details }) => {
//     const pipelineId = details?._id
//     const isFocused = useIsFocused()
//     const [isModalVisible, setModalVisible] = useState(false);


//     const scheduleMeeting = () => {
//         if (showFabButton) {
//             setModalVisible(true);
//         } else {
//             showToastMessage("Please add follow up after customer visit");
//         }
//     };

//     const handleSaveMeeting = async (meetingDetails) => {
//         try {
//             const { title, date, isReminder, reminderMinutes } = meetingDetails;
//             const addMeetingData = {
//                 title: title,
//                 start: date,
//                 is_Remainder: isReminder,
//                 minutes: isReminder ? reminderMinutes : 0,
//                 pipeline_id: details._id,
//                 type: 'CRM'
//             };
//             //console.log('MeetingDate',addMeetingData)
//             const response = await apiInstance.post('/createCustomerSchedule', addMeetingData);
//             //console.log('API response data:', response.data);
//             // Handle successful API response, update UI or navigate to another screen
//         } catch (error) {
//             console.error('API Error:', error);
//             // Handle API error, show error message to the user, etc.
//         } finally {
//             setModalVisible(false);
//             fetchData()
//         }
//     };



//     const [meetingData, setMeetingData] = useState([]);
//     const [pipelineDetails, setPipelineDetails] = useState({});


//     // Conditionally destructure customer_visit and pipeline_histories
//     const customer_visit = pipelineDetails.customer_visit || [];
//     const pipeline_histories = pipelineDetails.pipeline_histories || [];
//     // console.log("🚀 ~ Meeting ~ customer_visit:", customer_visit)
//     // console.log("🚀 ~ Meeting ~ pipeline_histories:", pipeline_histories)


//     const lastCustomerVisit = customer_visit[customer_visit.length - 1];
//     // Get the last pipeline history object
//     const lastPipelineHistory = pipeline_histories[pipeline_histories.length - 1];

//     const customerVisitDateTime = new Date(lastCustomerVisit?.date_time);
//     // console.log("🚀 ~ Meeting ~ customerVisitDateTime:", customerVisitDateTime)
//     const pipelineHistoryDate = new Date(lastPipelineHistory?.date);
//     // console.log("🚀 ~ Meeting ~ pipelineHistoryDate:", pipelineHistoryDate)
//     // console.log("🚀 ~ Meeting ~ lastPipelineHistory:", lastPipelineHistory)
//     // console.log("🚀 ~ Meeting ~ lastCustomerVisit:", lastCustomerVisit)
//     // console.log("🚀 ~ Meeting ~ pipelineDetails:", pipelineDetails)


//     const showFabButton = pipelineHistoryDate > customerVisitDateTime || false
//     console.log("🚀 ~ Meeting ~ showFabButton:", showFabButton)


//     // const [loading, setLoading] = useState(false);
//     // const [offset, setOffset] = useState(0);
//     // const limit = 20;
//     // const isFocused = useIsFocused();

//     // const [length, setLength] = useState(false)

//     const fetchData = () => {
//         // setLoading(true);
//         fetchMeetingScheduleData({ pipelineId })
//             .then((newData) => {
//                 if (newData.length > 0) {
//                     // setLength(true)
//                     setMeetingData(newData);
//                     // setOffset(offset + 1)
//                 }
//             })
//             .catch((error) => {
//                 console.error("Error fetching data:", error);
//             })
//     };

//     useEffect(() => {
//         fetchData()
//     }, [])

//     const fetchPipelineDetail = async () => {
//         try {
//             const response = await apiInstance.get(`/viewPipeline/${pipelineId}`);
//             if (response.data.success === 'true') {
//                 setPipelineDetails(response.data.data[0]);
//             } else {
//                 console.error('Error fetching pipeline detail');
//             }
//         } catch (error) {
//             console.error('Error fetching pipeline detail:', error);
//         }
//     };


//     useEffect(() => {
//         if (isFocused) {
//             fetchPipelineDetail();
//         }
//     }, [isFocused, pipelineId]);

//     return (
//         <View style={{ flex: 1, backgroundColor: 'white', padding: 15 }}>

//             <FlatList
//                 data={meetingData}
//                 keyExtractor={(item) => item._id}
//                 renderItem={({ item }) => (
//                     <MeetingList
//                         item={item}
//                     // name={employeeName}
//                     />
//                 )}
//                 // onEndReached={handleEndReached}
//                 // onEndReachedThreshold={0.1}
//                 // ListFooterComponent={() => (loading ? <ActivityIndicator size="large" color="#FF0000" /> : null)}
//                 showsVerticalScrollIndicator={false}
//             />
//             {/* FAB button to open the modal */}
//             <FABButton onPress={scheduleMeeting} />

//             {/* Modal for scheduling meeting */}
//             <AddMeetingModal isVisible={isModalVisible} onClose={() => setModalVisible(false)} onSave={handleSaveMeeting} />
//         </View>
//     );
// };

// export default Meeting;


import { View, Text } from 'react-native'
import React from 'react'

const Meetings = () => {
  return (
    <View>
      <Text>Meetings</Text>
    </View>
  )
}

export default Meetings
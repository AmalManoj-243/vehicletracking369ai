import React, { useEffect, useState } from 'react';
import { RoundedScrollContainer, SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { MapViewComponent } from '@components/MapViewScreen';
import * as Location from 'expo-location';
import { TextInput as FormInput } from '@components/common/TextInput';
import Text from '@components/Text';
import { FONT_FAMILY } from '@constants/theme';
import { formatDate } from '@utils/common/date';
import { LoadingButton } from '@components/common/Button';
import { View } from 'react-native';
import { post } from '@api/services/utils';
import { useAuthStore } from '@stores/auth';

const MarkAttendanceScreen = ({ navigation, route }) => {
    const { date } = route?.params
    const currentUser = useAuthStore(state => state.user)
    const [locationData, setLocationData] = useState({
        latitude: null,
        longitude: null,
    });
    const [loading, setLoading] = useState(true);

    const handleMarkAttendance = async () => {
        const formattedDate = formatDate(date, 'yyyy-MM-dd')
        try {
            const requestPayload =
            {
                employee_id: currentUser?.related_profile?._id,
                forenoon_in: formattedDate,
                date: new Date()
            }
            const response = await post('/createAttendance', requestPayload)
            console.log("🚀 ~ file: MarkAttendance.js:26 ~ handleMarkAttendance ~ response:", response)
        } catch (error) {
            console.log('API Error: ', error);
        }
    }

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setLocationData({
                longitude: location.coords.longitude,
                latitude: location.coords.latitude,
            });
            setLoading(false);
        })();
    }, []);

    return (
        <SafeAreaView>
            <NavigationHeader
                title="Mark Attendance"
                onBackPress={() => navigation.goBack()}
                showLogo={false}
            />
            <RoundedScrollContainer>
                <FormInput label={'Date & Time'} editable={false} value={formatDate(date, 'yyyy-MM-dd')} />
                <LoadingButton title={'Forenoon Check In'} onPress={handleMarkAttendance} />
                <View style={{ flex: 1 / 3 }} />
                <Text style={{ fontFamily: FONT_FAMILY.urbanistSemiBold }}>You should be inside your shop</Text>
                {!loading && (
                    <MapViewComponent
                        longitude={locationData.longitude}
                        latitude={locationData.latitude}
                    />
                )}
            </RoundedScrollContainer>
        </SafeAreaView>
    );
};

export default MarkAttendanceScreen;

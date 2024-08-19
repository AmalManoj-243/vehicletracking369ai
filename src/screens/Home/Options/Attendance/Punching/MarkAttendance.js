import React, { useEffect, useState } from 'react';
import { RoundedScrollContainer, SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { MapViewComponent } from '@components/MapViewScreen';
import * as Location from 'expo-location';
import { TextInput as FormInput } from '@components/common/TextInput';
import Text from '@components/Text';
import { FONT_FAMILY } from '@constants/theme';
import { CheckBox } from '@components/common/CheckBox';
import { format } from 'date-fns';

const MarkAttendanceScreen = () => {
   
    const [locationData, setLocationData] = useState({
        latitude: null,
        longitude: null,
    });
    const [loading, setLoading] = useState(true);

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
                <FormInput label={'Date & Time'} editable={false} />
                <CheckBox label={'Forenoon In'}/>
                <CheckBox label={'Forenoon Out'}/>
                <CheckBox label={'After Noon In'}/>
                <CheckBox label={'After Noon Out'}/>
                <Text style={{fontFamily: FONT_FAMILY.urbanistSemiBold}}>You should be inside your shop</Text>
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

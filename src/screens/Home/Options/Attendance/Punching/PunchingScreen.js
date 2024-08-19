import React, { useState } from 'react';
import { RoundedContainer, SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { CalendarScreen } from '@components/Calendar';

const PunchingScreen = ({ navigation }) => {

    const [selectedDay, setSelectedDay] = useState(new Date());
    const handleDayPress = (day) => {
        setSelectedDay(day.dateString);
    };

    return (
        <SafeAreaView>
            <NavigationHeader
                title="Punching"
                onBackPress={() => navigation.goBack()}
                logo={false}
                iconOneName={'check'}
                iconOnePress={()=> navigation.navigate('MarkAttendance', {date: selectedDay})}
            />
            <RoundedContainer>
                <CalendarScreen
                    onDayPress={handleDayPress}
                />
            </RoundedContainer>
        </SafeAreaView>
    );
};

export default PunchingScreen;

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoundedContainer } from '@components/containers';
import { FABButton } from '@components/common/Button';
import { useNavigation } from '@react-navigation/native';

const Meetings = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView>
            <RoundedContainer>
                <FABButton onPress={() => navigation.navigate('MeetingsScheduleModal')} />
            </RoundedContainer>
        </SafeAreaView>
    );
};

export default Meetings;

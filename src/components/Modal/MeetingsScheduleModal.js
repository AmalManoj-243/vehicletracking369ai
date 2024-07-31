import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Text from '@components/Text';
import Modal from 'react-native-modal';
import { Button } from '@components/common/Button';
import Icon from 'react-native-vector-icons/FontAwesome';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import format from 'date-fns/format';
import { CheckBox } from '@components/common/CheckBox';
import { NavigationHeader } from '@components/Header';


const MeetingsScheduleModal = ({ isVisible, onClose, onSave, title, header = '', placeholder}) => {
    
    const [meeting, setMeeting] = useState('');
    const [meetingDate, setMeetingDate] = useState(new Date());
    const [meetingTime, setMeetingTime] = useState(new Date());
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [isTimePickerVisible, setTimePickerVisible] = useState(false);
    const [isReminder, setReminder] = useState(false);
    const [reminderMinutes, setReminderMinutes] = useState(0);
    const [errorText, setErrorText] = useState('');

    const handleSave = () => {
        let hasError = false;

        if (!meeting) {
            setErrorText('Meeting title is required');
            hasError = true;
        } else {
            setErrorText('');
        }

        if (!hasError) {
            onSave({
                title:meeting,
                start: meetingDate,
                time: meetingTime,
                is_Remainder: isReminder,
                minutes: isReminder ? reminderMinutes : 0,
                type: 'CRM',
            });
            resetForm();
            onClose();
        }
    };

    const resetForm = () => {
        setMeeting('');
        setMeetingDate(new Date());
        setMeetingTime(new Date());
        setReminder(false);
        setReminderMinutes(0);
        setErrorText('');
    };

    return (
        <Modal
            isVisible={isVisible}
            animationIn="bounceIn"
            animationOut="slideOutDown"
            backdropOpacity={0.7}
            animationInTiming={400}
            animationOutTiming={300}
            backdropTransitionInTiming={400}
            backdropTransitionOutTiming={300}
        >
            <View style={styles.modalContainer}>
                <NavigationHeader onBackPress={onClose} title={header} />
                <View style={styles.modalContent}>
                    <Text style={styles.label}>{title}</Text>
                    <TextInput
                        placeholder={placeholder}
                        value={meeting}
                        onChangeText={(text) => {
                            setMeeting(text);
                            setErrorText('');
                        }}
                        style={[styles.textInput, errorText && styles.textInputError]}
                    />
                    {errorText ? (
                        <View style={styles.errorContainer}>
                            <Icon name="error" size={20} color="red" />
                            <Text style={styles.errorText}>{errorText}</Text>
                        </View>
                    ) : null}
                    <View style={styles.inputRow}>
                        <Text style={styles.label}>Enter Date:</Text>
                        <View style={[styles.textInput, { flexDirection: "row", justifyContent: 'space-between' }]}>
                            <Text style={{ marginRight: 20 }}>
                                {meetingDate ? format(meetingDate, "dd-MM-yyyy") : 'Select Date'}
                            </Text>
                            <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
                                <Icon name="calendar" size={25} color='#2e294e' />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        date={meetingDate}
                        onConfirm={(date) => {
                            setMeetingDate(date);
                            setDatePickerVisible(false);
                        }}
                        onCancel={() => setDatePickerVisible(false)}
                    />
                    <View style={styles.inputRow}>
                        <Text style={styles.label}>Enter Time:</Text>
                        <View style={[styles.textInput, { flexDirection: "row", justifyContent: 'space-between' }]}>
                            <Text style={{ marginRight: 20 }}>
                                {meetingTime ? format(meetingTime, "HH:mm:ss") : 'Select Time'}
                            </Text>
                            <TouchableOpacity onPress={() => setTimePickerVisible(true)}>
                                <Icon name="clock-o" size={25} color='#2e294e' />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <DateTimePickerModal
                        isVisible={isTimePickerVisible}
                        mode="time"
                        date={meetingTime}
                        onConfirm={(time) => {
                            setMeetingTime(time);
                            setTimePickerVisible(false);
                        }}
                        onCancel={() => setTimePickerVisible(false)}
                    />
                    <View style={styles.checkboxContainer}>
                        <CheckBox value={isReminder} onValueChange={setReminder} />
                        <Text style={styles.checkboxLabel}>Set Reminder</Text>
                    </View>
                    {isReminder && (
                        <TextInput
                            placeholder={reminderMinutes === 0 ? 'Enter reminder minutes' : ''}
                            value={reminderMinutes === 0 ? '' : reminderMinutes.toString()}
                            onChangeText={(text) => setReminderMinutes(parseInt(text) || 0)}
                            keyboardType="numeric"
                            style={styles.textInput}
                        />
                    )}
                    <View style={styles.buttonRow}>
                        <View style={{ flex: 2 }}>
                            <Button title="CANCEL" onPress={onClose} />
                        </View>
                        <View style={{ width: 10 }} />
                        <View style={{ flex: 2 }}>
                            <Button title="SAVE" onPress={handleSave} />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '100%',
    },
    textInput: {
        borderWidth: 1,
        borderColor: 'gray',
        marginBottom: 10,
        padding: 10,
        fontFamily: FONT_FAMILY.urbanistSemiBold,
        borderRadius: 5,
    },
    textInputError: {
        borderColor: 'red',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    errorText: {
        color: 'red',
        marginLeft: 10,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        flex: 1,
        textAlign: 'left',
        color: COLORS.primaryThemeColor,
        fontFamily: FONT_FAMILY.urbanistSemiBold,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkboxLabel: {
        marginLeft: 8,
    },
});

export default MeetingsScheduleModal;

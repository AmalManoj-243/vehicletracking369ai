import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, FlatList, Platform, Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import Text from '@components/Text';
import { NavigationHeader } from '@components/Header';
import { FONT_FAMILY } from '@constants/theme';

const { height } = Dimensions.get('window');

const CustomListModal = ({ items, onValueChange, isVisible, onClose = () => { }, title }) => {

    const handleCustomModal = (selectedCustomData) => {
        onValueChange(selectedCustomData);
        onClose();
    };

    return (
        <Modal
            isVisible={isVisible}
            animationIn='slideInDown'
            animationOut="slideOutDown"
            backdropOpacity={0.7}
            animationInTiming={400}
            animationOutTiming={300}
            backdropTransitionInTiming={400}
            backdropTransitionOutTiming={300}
            style={{ margin: height < 800 ? 20 : 20, paddingVertical: height < 800 ? 20 : 10, }}
        >
            <View style={styles.modalContainer}>
                <NavigationHeader onBackPress={() => onClose()} title={title} />
                <View style={styles.modalContent}>
                    <FlatList
                        data={items}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.modalListContainer}>
                                <TouchableOpacity onPress={() => handleCustomModal(item)}>
                                    <Text style={{ fontFamily: FONT_FAMILY.urbanistSemiBold, fontSize: 16 }}>{item.label}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        // contentContainerStyle={{ paddingBottom: 150, paddingTop: 10 }}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default CustomListModal;

export const styles = StyleSheet.create({

    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
        width: '100%',
    },
    modalListContainer: {
        marginHorizontal: 5,
        marginVertical: 5,
        backgroundColor: 'white',
        borderRadius: 15,
        ...Platform.select({
            android: {
                elevation: 4,
            },
            ios: {
                shadowColor: 'black',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
            },
        }),
        padding: 20,
    },

    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
});
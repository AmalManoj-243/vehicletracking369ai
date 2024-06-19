import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import Text from '@components/Text';
import { BottomSheetModal, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { FONT_FAMILY } from '@constants/theme';
import {  NavigationHeader } from '@components/Header';


const DropdownSheet = ({
    isVisible,
    items,
    onValueChange,
    title,
    onClose = () => { }
}) => {
    const bottomSheetModalRef = useRef(null);
    const snapPoints = useMemo(() => ['25%', '30%', '50%', '96%'], []);

    useEffect(() => {
        if (isVisible) {
            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }
    }, [isVisible]);

    const handleSheetChanges = useCallback((number) => {
        // console.log('handleSheetChanges', number);
    }, []);

    const handleSelectItem = (item) => {
        onValueChange(item);
        onClose()
        bottomSheetModalRef.current?.dismiss();
    };



    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => handleSelectItem(item)} >
            <Text style={styles.text}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={2}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
        // backgroundStyle='left'
        >
            {/* <BottomSheetHeader title={title} /> */}
            <NavigationHeader title={title} onBackPress={() => bottomSheetModalRef.current?.dismiss()} />
            <BottomSheetFlatList
                data={items}
                numColumns={1}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            />
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        paddingBottom: 20,
    },
    item: {
        marginVertical: 3,
        backgroundColor: "white",
        borderRadius: 15,
        padding: 20,
        marginHorizontal: 10,
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    image: {
        height: 50,
        width: 50,
        marginRight: 20,
    },
    text: {
        fontFamily: FONT_FAMILY.urbanistBold,
        fontSize: 16
    },
});

export default DropdownSheet;

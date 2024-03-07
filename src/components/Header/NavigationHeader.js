import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import Text from '@components/Text';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import { AntDesign } from '@expo/vector-icons';

const NavigationHeader = ({ title, onBackPress }) => {
    const screenWidth = Dimensions.get('window').width;
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={onBackPress} style={styles.goBackContainer}>
            <AntDesign name="left" size={20} color="white" style={styles.arrowImage} />

                {/* <Image source={require('@assets/images/header/left_arrow.png')} style={styles.arrowImage} /> */}
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <Image source={require('@assets/images/header/logo_header.png')} style={styles.logoImage} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: COLORS.primaryThemeColor,
    },
    goBackContainer: {
        marginRight: 15,
    },
    arrowImage: {
        // width: Dimensions.get('window').width * 0.18,
        tintColor: 'white',
    },
    title: {
        color: COLORS.white,
        fontSize: 20,
        fontFamily: FONT_FAMILY.urbanistBold,
        flex: 1,
        paddingLeft: 10,
    },
    logoImage: {
        width: '30%',
        height: '130%',
        // resizeMode: 'contain', // Adjust the resizeMode as needed
        // overflow: 'hidden'
    },
});

export default NavigationHeader;

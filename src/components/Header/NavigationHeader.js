import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import Text from '@components/Text';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import { AntDesign, Feather } from '@expo/vector-icons';

const NavigationHeader = ({ title, onBackPress, color = COLORS.white, backgroundColor = COLORS.primaryThemeColor, logo = true, icon = false, iconPress = () => { }, iconName = '', refreshPress = () => { }, refreshIcon = false, checkIcon = false, checkPress = () => { } }) => {

    const isPrimaryTheme = backgroundColor === COLORS.primaryThemeColor;

    const logoSource = isPrimaryTheme ? require('@assets/images/header/transparent_logo_header.png') : require('@assets/images/header/logo_header_bg_white.png');

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <TouchableOpacity onPress={onBackPress} style={styles.goBackContainer}>
                <AntDesign name="left" size={20} color={color} />
            </TouchableOpacity>
            <Text style={[styles.title, { color }]}>{title}</Text>
            {logo &&
                <Image source={logoSource} style={styles.logoImage} />
            }
            {icon &&
                <TouchableOpacity activeOpacity={0.8} onPress={iconPress}>
                    <AntDesign name={iconName} size={20} color={color} />
                </TouchableOpacity>
            }
            {checkIcon &&
                <>
                    <TouchableOpacity activeOpacity={0.8} onPress={checkPress}>
                        <Feather name="check-circle" size={30} color={COLORS.orange} />
                    </TouchableOpacity>
                </>
            }
            {refreshIcon &&
                <>
                    <View style={{ width: 10 }} />
                    <TouchableOpacity activeOpacity={0.8} onPress={refreshPress}>
                        <Image source={require('@assets/images/header/refresh_button.png')} style={styles.refreshImage} />
                    </TouchableOpacity>
                </>
            }
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 15,
    },
    goBackContainer: {
        marginRight: 15,
    },
    title: {
        fontSize: 18,
        fontFamily: FONT_FAMILY.urbanistBold,
        flex: 1,
        paddingLeft: 10,
    },
    logoImage: {
        width: '30%',
        height: '150%',
    },
    refreshImage: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
        tintColor: COLORS.white
    },

});

export default NavigationHeader;

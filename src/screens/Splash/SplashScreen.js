import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import THEME from '@constants/theme';

const SplashScreen = () => {
    const navigation = useNavigation();
    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
        async function loadFonts() {
            await Font.loadAsync({
                'Urbanist-Black': require('@assets/fonts/Urbanist/Urbanist-Black.ttf'),
                'Urbanist-Bold': require('@assets/fonts/Urbanist/Urbanist-Bold.ttf'),
                'Urbanist-ExtraBold': require('@assets/fonts/Urbanist/Urbanist-ExtraBold.ttf'),
                'Urbanist-ExtraLight': require('@assets/fonts/Urbanist/Urbanist-ExtraLight.ttf'),
                'Urbanist-Light': require('@assets/fonts/Urbanist/Urbanist-Light.ttf'),
                'Urbanist-Medium': require('@assets/fonts/Urbanist/Urbanist-Medium.ttf'),
                'Urbanist-Regular': require('@assets/fonts/Urbanist/Urbanist-Regular.ttf'),
                'Urbanist-SemiBold': require('@assets/fonts/Urbanist/Urbanist-SemiBold.ttf'),
                'Urbanist-Thin': require('@assets/fonts/Urbanist/Urbanist-Thin.ttf'),
            });
            setFontsLoaded(true);
        }
        loadFonts();
    }, []);

    useEffect(() => {
        if (fontsLoaded) {
            const timeout = setTimeout(() => {
                navigation.replace('AppNavigator');
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [fontsLoaded, navigation]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Image
                source={require('@assets/images/Splash/splash.png')}
                style={styles.image}
                resizeMode="contain"
            />
            <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '80%',
        height: '80%',
    },
    versionText: {
        fontSize: 16,
        marginTop: 20,
        color: THEME.COLORS.orange,
        fontFamily: THEME.FONT_FAMILY.urbanistMedium,
    },
});

export default SplashScreen;

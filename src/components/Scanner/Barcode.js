import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';

const Barcode = ({ route }) => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [requestedPermission, setRequestedPermission] = useState(false);

    const scaleValue = useRef(new Animated.Value(1)).current;
    const translateYValue = useRef(new Animated.Value(0)).current;

    const { onScan, onClose = false } = route?.params || {};
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const getCameraPermissions = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");
    };

    useEffect(() => {
        if (!requestedPermission) {
            getCameraPermissions();
            setRequestedPermission(true);
        }
    }, [requestedPermission]);

    useEffect(() => {
        if (hasPermission === false) {
            setRequestedPermission(false);
            getCameraPermissions();
        }
    }, [hasPermission]);

    useEffect(() => {
        Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        const zoomAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleValue, {
                    toValue: 1.1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleValue, {
                    toValue: 1.0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        );

        if (!scanned) {
            zoomAnimation.start();
        } else {
            zoomAnimation.stop();
        }
        return () => zoomAnimation.stop();
    }, [scanned, scaleValue]);

    useEffect(() => {
        if (isFocused) {
            setScanned(false);
        }
    }, [isFocused]);

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        onScan(data);
        if (onClose) {
            navigation.goBack();
        }
    };

    const toggleFlash = () => {
        setIsFlashOn(!isFlashOn);
    };

    const handleClose = () => {
        Animated.timing(translateYValue, {
            toValue: 1000,
            duration: 500,
            useNativeDriver: true,
        }).start(() => {
            navigation.goBack();
        });
    };

    return (
        <Animated.View style={styles.container}>
            {isFocused && hasPermission && (
                <View style={styles.scannerContainer}>
                    <Camera
                        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                        style={styles.scanner}
                        flashMode={isFlashOn ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
                    />
                </View>
            )}
            <View style={styles.bottomButtonsContainer}>
                <TouchableOpacity style={styles.button} onPress={toggleFlash}>
                    <Ionicons name={isFlashOn ? 'flash' : 'flash-off'} size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
                    <Ionicons name={'refresh'} size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleClose}>
                    <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

export default Barcode;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black'
    },
    scannerContainer: {
        width: '70%', // Adjust width as needed
        height: '30%', // Adjust height as needed
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        position: 'absolute',
        top: '20%', // Adjust this value to vertically center the scanner
    },
    scanner: {
        width: '100%',
        height: '100%',
    },
    bottomButtonsContainer: {
        position: 'absolute',
        bottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
    },
    button: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
    },
});

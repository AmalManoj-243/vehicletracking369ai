import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Button, Animated, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import Text from '@components/Text';

const Scanner = ({ route }) => {

    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const scaleValue = useRef(new Animated.Value(1)).current;
    const translateYValue = useRef(new Animated.Value(0)).current;

    // Get the onScan function from navigation params
    const { onScan } = route?.params;
    console.log("🚀 ~ Scanner ~ onScan:", onScan)


    // navigation
    const navigation = useNavigation()

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
        };
        getCameraPermissions();
    }, []);

    useEffect(() => {
        // Initial animation when the scanner is opened
        Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);


    useEffect(() => {
        // Continuous zoom-in and zoom-out animation
        const zoomAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleValue, {
                    toValue: 1.1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleValue, {
                    toValue: 1.0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        if (!scanned) {
            zoomAnimation.start();
        } else {
            zoomAnimation.stop();
            // Start the closing animation when scanned
            Animated.timing(translateYValue, {
                toValue: 1000, // Adjust this value based on your animation needs
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
        return () => zoomAnimation.stop(); // Clean up the animation on component unmount
    }, [scanned, translateYValue]);

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        onScan(data)
        navigation.goBack()
        // alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    };

    const toggleFlash = () => {
        setIsFlashOn(!isFlashOn);
    };

    const handleClose = () => {
        // Start the closing animation when the close button is pressed
        Animated.timing(translateYValue, {
            toValue: 1000, // Adjust this value based on your animation needs
            duration: 500,
            useNativeDriver: true,
        }).start(() => {
            navigation.goBack()
        });
    };


    if (hasPermission === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <Animated.View style={[styles.container]}>
            <View style={styles.scannerContainer}>
                <Camera
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                    style={StyleSheet.absoluteFillObject}
                    flashMode={isFlashOn ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
                    barCodeScannerSettings={{
                        barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
                    }}
                />
                <View style={styles.scannerOverlay}>
                    <Animated.Image
                        source={require('@assets/images/scanner/scanner.png')}
                        style={[styles.scannerImage, { transform: [{ scale: scaleValue }] }]}
                    />
                </View>
            </View>
            {/* {scanned ? (
                <View style={styles.buttonContainer}>
                    <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />
                </View>
            ) : ( */}
                <View style={styles.bottomButtonsContainer}>
                    <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
                        <Ionicons name={isFlashOn ? 'flash' : 'flash-off'} size={30} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.refreshButton} onPress={()=>setScanned(false)}>
                        <Ionicons name={'refresh'} size={30} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                </View>
            {/* )} */}
        </Animated.View>
    );
};

export default Scanner;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',

    },
    scannerContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: 'black', // Background color of the scanner area
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerImage: {
        width: 300,
        height: 300,
        resizeMode: 'contain',
        tintColor: 'white',
    },
    buttonContainer: {
        marginTop: 20,
    },
    bottomButtonsContainer: {
        position: 'absolute',
        bottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
    },
    flashButton: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    closeButton: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    refreshButton: {
        padding: 10,
        borderRadius: 5,
        // backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
});

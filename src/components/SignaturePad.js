import React, { useRef, useState } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import Text from "./Text";
import * as FileSystem from "expo-file-system";
// import uploadApi from "../api/services/uploadApi";

export const CustomClearButton = ({ title, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: "#ed493d", }]}
            onPress={onPress}
        >
            <Text style={[styles.buttonText, { color: "white", }]}>{title}</Text>
        </TouchableOpacity>
    );
};

const SignaturePad = ({ onOK, setScrollEnabled, setUrl, url }) => {

    const [isDraw, setDraw] = useState(false);
    const ref = useRef();


    const handleOK = (drawingData) => {
        const path = FileSystem.cacheDirectory +  `signature_pad${Date.now()}.png`;
        FileSystem.writeAsStringAsync(
            path,
            drawingData.replace("data:image/png;base64,", ""),
            { encoding: FileSystem.EncodingType.Base64 }
        )
            .then(() => FileSystem.getInfoAsync(path))
            .then(async () => {
                try {
                  console.log("Signature to file completed. Path:", path);
        
                  await uploadApi(path, setUrl, url);
                  // console.log("API response---:", uploadResponse);
                  // Handle the API response as needed
                } catch (error) {
                  console.log("API error:", error);
                  // Log the error in the console, but don't affect the mobile screen
                }})
            .then(console.log)
            .catch(console.error);
    };

    const handleClear = () => {
        ref.current.clearSignature();
        setDraw(null);
    };

    const handleEnd = () => {
        ref.current.readSignature();
        setScrollEnabled(true)
        setDraw(true); // Show the clear button when drawing
    };
    const style =
        `.m-signature-pad {
        position: absolute;
        font-size: 10px;
        width: 700px;
        height: 400px;
        top: 50%;
        left: 50%;
        margin-left: -350px;
        margin-top: -200px;
        border: 1px solid #e8e8e8;
        background-color: #fff;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.27), 0 0 40px rgba(0, 0, 0, 0.08) inset;
      }`
    return (
        <>
            <View style={styles.signContainer}>
                <SignatureScreen ref={ref} onOK={handleOK} webStyle={style} onEnd={handleEnd}
                    onBegin={() => setScrollEnabled(false)}
                    onDraw={() => setScrollEnabled(false)}
                />
            </View>
            <View style={{ alignSelf: 'flex-end', marginTop: 10 }}>
                {isDraw ? (<CustomClearButton title="CLEAR" onPress={handleClear} />) : null}
            </View>
        </>
    );
};

export default SignaturePad;

const styles = StyleSheet.create({
    signContainer: {
        flex: 1,
        marginTop: 10,
        alignItems: "center",
        justifyContent: "center",
        height: 250,
        width: "100%",
        borderWidth: 0.9,
        borderColor: 'gray',
        borderRadius: 5,
        overflow: 'hidden',
    },
    row: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        alignItems: "center",
    },
    button: {
        width: 100,
        paddingHorizontal: 20,
        alignItems: 'center',
        paddingVertical: 5,
        borderRadius: 5,
        backgroundColor: "#ed493d",
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1.5,
        shadowRadius: 2,
        elevation: 5,
    },
    buttonText: {
        fontFamily: 'raleway_bold',
        textAlign: 'center',
        fontSize: 12,
        color: "white",
    },
});
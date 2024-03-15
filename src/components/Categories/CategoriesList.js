import { View, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import Text from '@components/Text';
import { FONT_FAMILY } from '@constants/theme';

const ProductsList = ({ item, onPress, showPrice }) => {

    const textContainerPosition = showPrice ? -60 : -80

    const errorImage = require('@assets/images/error/error.png');
    useEffect(() => {
        const timeout = setTimeout(() => {
            // Stop the loading indicator after a timeout (e.g., 10 seconds)
            setImageLoading(false);
        }, 10000); // Adjust the timeout as needed

        return () => clearTimeout(timeout);
    }, []);

    const [imageLoading, setImageLoading] = useState(true);
    const truncatedName =
        item?.product_name?.length > 15 ? item?.product_name?.substring(0, 14) + '...' : item?.product_name;

    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            {imageLoading && <ActivityIndicator size="small" color={'black'} style={{ position: 'absolute', top: 30 }} />}
            <Image
                source={item?.image_url ? { uri: item.image_url } : errorImage}
                style={styles.image}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
            />
            <View style={{ paddingTop: 50 }} />
            <View style={[styles.textContainer, { bottom: textContainerPosition }]}>
                <Text style={styles.name}>{truncatedName}</Text>
            </View>
            {showPrice && <View style={[styles.bottomBar, { backgroundColor: 'transparent' }]}>
                <Text style={styles.price}>Price{' '}:{' '}{item?.portal_price}{' '}AED</Text>
            </View>}
        </TouchableOpacity>
    );
};

export default ProductsList;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        margin: 6,
        borderWidth: 0.5,
        borderRadius: 10,
        marginTop: 5,
        borderColor: 'grey',
        backgroundColor: "white",
    },
    image: {
        width: 80,
        height: 80,
        resizeMode: 'cover',
        borderRadius: 8,
        marginTop: 10,
    },
    textContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        // bottom: -60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontSize: 14,
        textAlign: 'center',
        textTransform: 'capitalize',
        color: '#2E2B2B',
        fontFamily: FONT_FAMILY.urbanistBold
    },
    price: {
        fontSize: 12,
        color: 'grey',
        fontFamily: FONT_FAMILY.urbanistBold,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        paddingVertical: 5,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

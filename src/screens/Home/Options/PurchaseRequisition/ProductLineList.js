import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import React from 'react'
import { FONT_FAMILY } from '@constants/theme';

const ProductLineList = ({item}) => {
  return (
    <TouchableOpacity>
        <View style={styles.leftColumn}>
        <Text style={styles.head}>{item?.product_name?.trim() || '-'}</Text>
        <View style={styles.rightColumn}>
          <Text style={[styles.contentRight]}>{item?.quantity}</Text>
          <Text style={styles.content}>{item?.remarks || '-'}</Text>
        </View>
        <View style={styles.rightColumn}>
        
      </View>
        </View>

    </TouchableOpacity>
  )
}


const styles = StyleSheet.create({
    itemContainer: {
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
    leftColumn: {
      flex: 1,
    },
    rightColumn: {
      justifyContent: 'space-between', 
      flexDirection: 'row', 
      flex: 1 
    },
    head: {
      fontFamily: FONT_FAMILY.urbanistBold,
      fontSize: 17,
      marginBottom: 5,
    },
    content: {
      color: '#666666',
      marginBottom: 5,
      fontSize:14,
      fontFamily: FONT_FAMILY.urbanistSemiBold,
      textTransform:'capitalize'
    },
   
    contentRight: {
      color: '#666666',
      fontFamily: FONT_FAMILY.urbanistSemiBold,
      fontSize:14,
    },
  });

export default ProductLineList
import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Text from '@components/Text';
import { FONT_FAMILY } from '@constants/theme';
import { formatDate } from '@utils/common/date';

const ServiceList = ({ item, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.itemContainer}>
      <View style={styles.leftColumn}>
        <Text style={styles.head}>{item?.sequence_no || '-'}</Text>
        <Text style={styles.contentRight}>{formatDate(item?.date) || '-'}</Text>
        <Text style={styles.content}>{item?.customer_name}</Text>
       </View> 
      <View style={styles.rightColumn}>
        <Text style={styles.content}>{item?.assignee_name}</Text>
        <Text style={styles.content}>{item?.device_name}</Text>
        <Text style={[styles.contentStage, {color: 'red'}]}>{item?.job_stage}</Text>
      </View>
    </TouchableOpacity>
  );
};

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
    flexDirection: 'column', 
  },
  rightColumn: {
    flex: 1,
    flexDirection: 'column', 
  },
  head: {
    fontFamily: FONT_FAMILY.urbanistBold,
    fontSize: 17,
    marginBottom: 5,
  },
  content: {
    color: '#666666',
    marginTop: 5,
    fontSize: 16,
    fontFamily: FONT_FAMILY.urbanistSemiBold,
    textTransform: 'capitalize',
  },
  contentStage: {
    color: '#666666',
    marginTop: 5,
    fontSize: 16,
    marginLeft: 270,
    fontFamily: FONT_FAMILY.urbanistSemiBold,
    textTransform: 'capitalize',
  },
  contentRight: {
    color: '#666666',
    fontFamily: FONT_FAMILY.urbanistSemiBold,
    fontSize: 16,
  },
  additionalFields: {
    marginTop: 10,
  },
});

export default ServiceList;

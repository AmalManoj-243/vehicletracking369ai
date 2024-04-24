import React from 'react';
import { View, ScrollView } from 'react-native';
import { COLORS } from '@constants/theme';

const RoundedScrollContainer = ({ children, backgroundColor = COLORS.white, borderRadius = true, scrollEnabled = true, ...props }) => {

  const containerStyles = {
    flex: 1,
    // marginHorizontal:20,
    paddingHorizontal: 6,
    backgroundColor: backgroundColor,
    ...(borderRadius && { borderTopLeftRadius: 15, borderTopRightRadius: 15 }),
    ...props,
  };

  return (
    <View style={containerStyles}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 15 }} showsVerticalScrollIndicator={false} scrollEnabled={scrollEnabled}>
        {children}
      </ScrollView>
    </View>
  );
};

export default RoundedScrollContainer;

// components/containers/RoundedContainer.js

import React from 'react';
import { View } from 'react-native';
import { COLORS } from '@constants/theme';

const RoundedContainer = ({ children }) => {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white, borderTopLeftRadius: 15, borderTopRightRadius: 15 }}>
      {children}
    </View>
  );
};

export default RoundedContainer;

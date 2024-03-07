// components/containers/SafeAreaView.js

import React from 'react';
import { COLORS } from '@constants/theme';
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context';

const SafeAreaView = ({ children, backgroundColor = COLORS.primaryThemeColor }) => {
  return (
    <RNSSafeAreaView style={{ flex: 1, backgroundColor: backgroundColor }}>
        {children}
    </RNSSafeAreaView>
  );
};

export default SafeAreaView;

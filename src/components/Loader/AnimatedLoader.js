import React from 'react';
import { StyleSheet } from 'react-native';
import Loader from 'react-native-animated-loader';

const AnimatedLoader = ({ visible, animationSource }) => {
  return (
    <Loader
      visible={visible}
      source={animationSource}
      overlayColor="transparent"
      animationStyle={styles.lottie}
      speed={2}
    />
  );
};

const styles = StyleSheet.create({
  lottie: {
    width: 200,
    height: 200,
  },
});

export default AnimatedLoader;

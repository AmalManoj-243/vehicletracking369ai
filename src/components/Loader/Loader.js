import React from 'react';
import { StyleSheet } from 'react-native';
import AnimatedLoader from 'react-native-animated-loader';

const Loader = ({ visible, animationSource }) => {
  return (
    <AnimatedLoader
      visible={visible}
      source={animationSource}
      overlayColor="transparent"
      animationStyle={styles.lottie}
      speed={1.5}
    />
  );
};

const styles = StyleSheet.create({
  lottie: {
    width: 200,
    height: 200,
  },
});

export default Loader;

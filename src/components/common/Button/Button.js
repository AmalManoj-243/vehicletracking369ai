import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Text from '@components/Text';
import { COLORS, FONT_FAMILY } from '@constants/theme';

const Button = ({
  title,
  color = 'white',
  onPress = () => { },
  backgroundColor = COLORS.button,
  ...props
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        height: 45,
        width: '100%',
        backgroundColor: backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginVertical:10,
        ...props
      }}>
      <Text style={[styles.title, {color: color}]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.urbanistBold
  }
});

export default Button;

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Text from '@components/Text';
import { COLORS, FONT_FAMILY } from '@constants/theme';

const Button = ({
  title,
  color = 'white',
  onPress = () => { },
  backgroundColor = COLORS.button,
  disabled = false,
  ...props
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      style={{
        height: 45,
        width: '100%',
        backgroundColor: backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginVertical:10,
        paddingHorizontal:8,
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
    fontSize: 15,
    fontFamily: FONT_FAMILY.urbanistBold
  }
});

export default Button;

import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Text from '@components/Text';
import { COLORS } from '@constants/theme';
import { FONT_FAMILY } from '@constants/theme';

const DetailField = ({
  label,
  iconName,
  ...props
}) => {

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={inputContainerStyle}>
        <TextInput
        editable={false}
          autoCorrect={false}
          style={styles.input}
          {...props}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 5,
    // flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    flex: 2 / 3,
    marginVertical: 8,
    fontSize: 14,
    color: '#818181',
    fontFamily: FONT_FAMILY.urbanistSemiBold,
  },
  inputContainer: {
    flex: 3 / 3,
    minHeight: 45,
    flexDirection: 'row',
    paddingHorizontal: 15,
    borderRadius: 6,
    borderWidth: 0.8,
    backgroundColor: 'white',
    alignItems: 'center',
    borderColor: '#dadada'
  },
  input: {
    color: COLORS.black,
    flex: 1,
    fontFamily: FONT_FAMILY.urbanistMedium,
    marginTop: 10,
    textAlignVertical: 'top',
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginTop: 5,
    fontFamily: FONT_FAMILY.urbanistMedium
  },

});

export default DetailField;

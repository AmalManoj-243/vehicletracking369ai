import { StyleSheet } from 'react-native';
import { FONT_FAMILY } from '@constants/theme';

export const styles = StyleSheet.create({
  label: {
    marginVertical: 5,
    fontSize: 16,
    color: '#B56727',
    fontFamily: FONT_FAMILY.urbanistBold,
  },
  notification: {
    // position:'absolute',
    marginTop: 10,
    alignSelf: 'center',
    bottom: 50,
    fontSize: 16,
    color: 'red',
    fontFamily: FONT_FAMILY.urbanistSemiBold,
  },
  
});

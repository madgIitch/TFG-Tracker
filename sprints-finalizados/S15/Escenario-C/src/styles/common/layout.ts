import { StyleSheet } from 'react-native';

export const layoutStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

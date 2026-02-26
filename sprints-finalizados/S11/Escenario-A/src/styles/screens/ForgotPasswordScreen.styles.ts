import { StyleSheet } from 'react-native';
import { commonStyles } from '../common';

const styles = StyleSheet.create({
  container: commonStyles.screenContainer,
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
  },
});

export default styles;

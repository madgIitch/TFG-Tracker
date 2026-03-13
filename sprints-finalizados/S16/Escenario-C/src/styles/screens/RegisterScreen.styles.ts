import { Dimensions, StyleSheet } from 'react-native';

const isSmallScreen = Dimensions.get('window').width <= 320;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: isSmallScreen ? 12 : 20,
    paddingVertical: isSmallScreen ? 12 : 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: isSmallScreen ? '2%' : '6%',
    marginBottom: isSmallScreen ? '2%' : '4%',
  },
  logoImage: {
    width: isSmallScreen ? 68 : 84,
    height: isSmallScreen ? 68 : 84,
    marginBottom: isSmallScreen ? 8 : 12,
  },
  logo: {
    fontSize: isSmallScreen ? 26 : 32,
    fontWeight: 'bold',
    marginBottom: isSmallScreen ? 6 : 8,
  },
  subtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  footer: {
    paddingTop: isSmallScreen ? 8 : 12,
    paddingBottom: 8,
  },
});

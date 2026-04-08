import { Dimensions, StyleSheet } from 'react-native';

const isCompactWidth = Dimensions.get('window').width <= 320;

const styles = StyleSheet.create({  
  container: {  
    width: '100%',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: isCompactWidth ? 14 : 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {  
    fontSize: isCompactWidth ? 21 : 24,
    fontWeight: 'bold',  
    textAlign: 'center',  
    marginBottom: 8,  
  },  
  subtitle: {  
    fontSize: isCompactWidth ? 14 : 16,
    textAlign: 'center',  
    marginBottom: 16,  
  },  
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: isCompactWidth ? 6 : 8,
    marginBottom: isCompactWidth ? 16 : 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepDotInactive: {
    backgroundColor: '#E5E7EB',
  },
  input: {  
    borderWidth: 1,  
    padding: isCompactWidth ? 12 : 16,
    marginBottom: isCompactWidth ? 12 : 16,
    fontSize: isCompactWidth ? 15 : 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },  
  authButtons: {
    marginBottom: 8,
  },
});

export default styles;

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {  
    alignItems: 'center',  
    marginTop: '6%',
    marginBottom: 24,
  },  
  logoImage: {  
    width: 84,  
    height: 84,  
    marginBottom: 12,  
  },  
  logo: {  
    fontSize: 32,  
    fontWeight: 'bold',  
    marginBottom: 8,  
  },  
  subtitle: {  
    fontSize: 16,  
  },  
  content: {  
    flex: 1,  
    justifyContent: 'center',
  },  
  footer: {  
    marginTop: 16,
    paddingBottom: 16,
  },  
});

export default styles;

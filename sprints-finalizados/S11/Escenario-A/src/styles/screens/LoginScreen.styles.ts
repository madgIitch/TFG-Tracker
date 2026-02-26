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
    paddingBottom: 32,
  },
  header: {  
    alignItems: 'center',  
    marginTop: '10%',
    marginBottom: 40,
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
  form: {  
    flex: 1,  
    justifyContent: 'center',
    paddingBottom: 16,
  },  
  input: {  
    borderWidth: 1,  
    padding: 16,  
    marginBottom: 16,  
    fontSize: 16,  
  },  
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default styles;

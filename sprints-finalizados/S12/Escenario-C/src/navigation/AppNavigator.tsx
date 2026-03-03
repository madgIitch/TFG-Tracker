// src/navigation/AppNavigator.tsx    
import React, { useContext } from 'react';    
import { View, Text, StyleSheet, Linking } from 'react-native';    
import { NavigationContainer } from '@react-navigation/native';    
import { createStackNavigator } from '@react-navigation/stack';    
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';    
import { LoginScreen } from '../screens/LoginScreen';    
import { RegisterScreen } from '../screens/RegisterScreen';    
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { MainNavigator } from './MainNavigator';    
import { ProfileDetailScreen } from '../screens/ProfileDetailScreen';    
import { EditProfileScreen } from '../screens/EditProfileScreen';    
import { FiltersScreen } from '../screens/FiltersScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { RoomManagementScreen } from '../screens/RoomManagementScreen';
import { RoomEditScreen } from '../screens/RoomEditScreen';
import { RoomInterestsScreen } from '../screens/RoomInterestsScreen';
import { RulesManagementScreen } from '../screens/RulesManagementScreen';
import { ServicesManagementScreen } from '../screens/ServicesManagementScreen';
import { CreateFlatScreen } from '../screens/CreateFlatScreen';
import { RoomDetailScreen } from '../screens/RoomDetailScreen';
import { FlatExpensesScreen } from '../screens/FlatExpensesScreen';
import { FlatSettlementsScreen } from '../screens/FlatSettlementsScreen';
import { useTheme } from '../theme/ThemeContext';    
    
const Stack = createStackNavigator();    
    
// Simple loading screen component    
const LoadingScreen: React.FC = () => {    
  const theme = useTheme();    
  return (    
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>    
      <Text style={[styles.loadingText, { color: theme.colors.text }]}>    
        HomiMatch    
      </Text>    
    </View>    
  );    
};    
    
export const AppNavigator: React.FC = () => {    
  const authContext = useContext(AuthContext);    
  const theme = useTheme();

  const normalizeRecoveryUrl = (url: string | null) => {
    if (!url) return url;
    if (!url.includes('#')) return url;
    const [base, hash] = url.split('#');
    return `${base}?${hash}`;
  };

  const linking = {
    prefixes: ['homimatchapp://'],
    config: {
      screens: {
        Login: 'login',
        Register: 'register',
        ForgotPassword: 'auth/forgot-password',
        ResetPassword: 'auth/reset-password',
      },
    },
    getInitialURL: async () => {
      const url = await Linking.getInitialURL();
      return normalizeRecoveryUrl(url);
    },
    subscribe: (listener: (url: string) => void) => {
      const subscription = Linking.addEventListener('url', ({ url }) => {
        const normalizedUrl = normalizeRecoveryUrl(url);
        if (normalizedUrl) {
          listener(normalizedUrl);
        }
      });

      return () => {
        subscription.remove();
      };
    },
  };
      
  // Ensure context exists    
  if (!authContext) {    
    throw new Error('AppNavigator must be used within AuthProvider');    
  }    
      
  const { isAuthenticated, loading } = authContext;    
    
  if (loading) {    
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={['top', 'right', 'bottom', 'left']}
      >
        <LoadingScreen />
      </SafeAreaView>
    );    
  }    
    
  return (    
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'right', 'bottom', 'left']}
    >
      <NavigationContainer linking={linking}>    
        <Stack.Navigator screenOptions={{ headerShown: false }}>    
          {isAuthenticated ? (    
            <>    
              <Stack.Screen name="Main" component={MainNavigator} />    
              <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />    
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />    
              <Stack.Screen name="Filters" component={FiltersScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="RoomManagement" component={RoomManagementScreen} />
              <Stack.Screen name="RoomEdit" component={RoomEditScreen} />
              <Stack.Screen name="RoomInterests" component={RoomInterestsScreen} />
              <Stack.Screen name="RulesManagement" component={RulesManagementScreen} />
              <Stack.Screen name="ServicesManagement" component={ServicesManagementScreen} />
              <Stack.Screen name="CreateFlat" component={CreateFlatScreen} />
              <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
              <Stack.Screen name="FlatExpenses" component={FlatExpensesScreen} />
              <Stack.Screen name="FlatSettlements" component={FlatSettlementsScreen} />
            </>    
          ) : (    
            <>    
              <Stack.Screen name="Login" component={LoginScreen} />    
              <Stack.Screen name="Register" component={RegisterScreen} />    
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </>    
          )}    
        </Stack.Navigator>    
      </NavigationContainer>
    </SafeAreaView>    
  );    
};    
    
const styles = StyleSheet.create({    
  safeArea: {
    flex: 1,
  },
  container: {    
    flex: 1,    
    justifyContent: 'center',    
    alignItems: 'center',    
  },    
  loadingText: {    
    fontSize: 24,    
    fontWeight: 'bold',    
  },    
});

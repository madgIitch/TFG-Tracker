// src/navigation/AppNavigator.tsx    
import React, { useContext } from 'react';    
import { View, Text, StyleSheet } from 'react-native';    
import { NavigationContainer } from '@react-navigation/native';    
import { createStackNavigator } from '@react-navigation/stack';    
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';    
import { LoginScreen } from '../screens/LoginScreen';    
import { RegisterScreen } from '../screens/RegisterScreen';    
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
      <NavigationContainer>    
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

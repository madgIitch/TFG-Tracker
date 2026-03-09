// src/navigation/MainNavigator.tsx    
import React, { useCallback } from 'react';    
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';    
import { StyleSheet, View } from 'react-native';    
import { BlurView } from '@react-native-community/blur';
import { useTheme } from '../theme/ThemeContext';    
import { HomeScreen } from '../screens/HomeScreen';    
import { ProfileDetailScreen } from '../screens/ProfileDetailScreen';    
import { MatchesScreen } from '../screens/MatchesScreen';    
import { FlatExpensesScreen } from '../screens/FlatExpensesScreen';
import { TabBarIcon } from '../components/TabBarIcon';    
    
const Tab = createBottomTabNavigator();    
    
const getIconName = (routeName: string): string => {    
  switch (routeName) {    
    case 'Home':    
      return 'home';    
    case 'Profile':    
      return 'person';    
    case 'Matches':    
      return 'chatbubbles';    
    case 'Expenses':
      return 'wallet';
    default:    
      return 'help';    
  }    
};    
    
// Extracted component to avoid nested component definition    
const TabBarIconWrapper = ({ route, focused, color, size }: {    
  route: any;    
  focused: boolean;    
  color: string;    
  size: number;    
}) => (    
  <TabBarIcon     
    name={getIconName(route.name)}    
    focused={focused}    
    color={color}    
    size={size}    
  />    
);    
    
export const MainNavigator: React.FC = () => {    
  const theme = useTheme();    
    
  const screenOptions = useCallback(({ route }: { route: any }) => ({    
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (    
      <TabBarIconWrapper     
        route={route}    
        focused={focused}    
        color={color}    
        size={size}    
      />    
    ),    
    tabBarActiveTintColor: theme.colors.primary,    
    tabBarInactiveTintColor: theme.colors.textSecondary,    
    tabBarStyle: styles.tabBar,
    tabBarBackground: () => (
      <View style={StyleSheet.absoluteFillObject}>
        <BlurView
          blurType="light"
          blurAmount={16}
          reducedTransparencyFallbackColor="rgba(255,255,255,0.9)"
          style={StyleSheet.absoluteFillObject}
        />
        <View
          style={[
            styles.tabBarTint,
            {
              backgroundColor: theme.colors.glassSurfaceStrong,
              borderTopColor: theme.colors.glassStroke,
            },
          ]}
        />
      </View>
    ),
    headerShown: false,    
  }), [theme]);    
    
  return (    
    <Tab.Navigator screenOptions={screenOptions}>    
      <Tab.Screen     
        name="Home"     
        component={HomeScreen}    
        options={{ title: 'Explorar' }}    
      />    
      <Tab.Screen     
        name="Profile"     
        component={ProfileDetailScreen}    
        options={{ title: 'Perfil' }}    
      />    
      <Tab.Screen     
        name="Matches"     
        component={MatchesScreen}    
        options={{ title: 'Matches' }}    
      />    
      <Tab.Screen
        name="Expenses"
        component={FlatExpensesScreen}
        options={{ title: 'Gastos' }}
      />
    </Tab.Navigator>    
  );    
};    
    
const styles = StyleSheet.create({    
  tabBar: {    
    position: 'absolute',
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    paddingBottom: 8,    
    paddingTop: 8,    
    height: 60,    
  },
  tabBarTint: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
  },    
});
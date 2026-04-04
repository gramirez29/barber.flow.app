import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { DrawerNavigator } from './DrawerNavigator';
import { useAuthStore } from '../store/auth.store';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={DrawerNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};
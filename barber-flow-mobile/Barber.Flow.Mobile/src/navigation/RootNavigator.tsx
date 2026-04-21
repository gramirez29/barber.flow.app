import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { DrawerNavigator } from './DrawerNavigator';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/authService';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let active = true;

    const restoreUser = async () => {
      try {
        const storedUser = await authService.getStoredUser();

        if (active && storedUser) {
          setUser(storedUser);
        }
      } finally {
        if (active) {
          setIsAuthReady(true);
        }
      }
    };

    void restoreUser();

    return () => {
      active = false;
    };
  }, [setUser]);

  if (!isAuthReady) {
    return null;
  }

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
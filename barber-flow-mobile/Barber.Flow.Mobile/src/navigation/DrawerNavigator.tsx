import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { AppNavigator } from './AppNavigator';
import { AppDrawerContent } from '../components/ui/AppDrawerContent';

const Drawer = createDrawerNavigator();

export const DrawerNavigator = () => (
  <Drawer.Navigator screenOptions={{ headerShown: false }} drawerContent={(props) => <AppDrawerContent {...props} />}>
    <Drawer.Screen name="HomeTabs" component={AppNavigator} options={{ title: 'Home' }} />
  </Drawer.Navigator>
);
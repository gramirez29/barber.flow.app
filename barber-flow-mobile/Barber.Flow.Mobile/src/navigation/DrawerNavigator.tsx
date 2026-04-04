import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { AppNavigator } from './AppNavigator';
import { AppDrawerContent } from '../components/ui/AppDrawerContent';
import { useTranslation } from '../context/LanguageContext';

const Drawer = createDrawerNavigator();

export const DrawerNavigator = () => {
  const { translateText } = useTranslation();

  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }} drawerContent={(props) => <AppDrawerContent {...props} />}>
      <Drawer.Screen name="HomeTabs" component={AppNavigator} options={{ title: translateText('navigation.home') }} />
    </Drawer.Navigator>
  );
};
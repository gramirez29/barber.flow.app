import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CreateAppointmentScreen } from '../screens/CreateAppointmentScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { fonts } from '../theme/fonts';
import { colors } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeContext';

export type AppTabParamList = {
  Calendar: undefined;
  Clients: undefined;
  CreateAppointment: undefined;
  SettingsScreen: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppNavigator = () => {

  const { theme } = useAppTheme();

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.colors.surface },
        tabBarActiveTintColor: theme.colors.tabActive,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarLabelStyle: {
            fontFamily: fonts.medium,
            fontSize: 12,
        },
        tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            switch (route.name) {
                case 'Calendar':
                    iconName = 'calendar-outline';
                    break;
                case 'Clients':
                    iconName = 'people-outline';
                    break;
                case 'CreateAppointment':
                    iconName = 'add-circle-outline';
                    break;
                case 'SettingsScreen':
                    iconName = 'settings-outline';
                    break;
            }

            return <Ionicons name={iconName!} size={size} color={color} />;
        },
    })}>
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{ title: 'Clients' }}
      />
      <Tab.Screen
        name="CreateAppointment"
        component={CreateAppointmentScreen}
        options={{ title: 'Create Appointment' }}
      />
      <Tab.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};
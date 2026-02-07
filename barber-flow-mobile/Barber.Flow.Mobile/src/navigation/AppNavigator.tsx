import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CreateAppointmentScreen } from '../screens/CreateAppointmentScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { NotificationScreen } from '../screens/NotificationScreen';
import { fonts } from '../theme/fonts';
import { useAppTheme } from '../theme/ThemeContext';
import { useNotification } from '../context/NotificationContext';


export type AppTabParamList = {
  Calendar: undefined;
  Clients: undefined;
  CreateAppointment: undefined;
  SettingsScreen: undefined;
  NotificationScreen: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppNavigator = () => {

  const { theme } = useAppTheme();
  const { clientNotifications } = useNotification();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopWidth: 0.5,
          borderTopColor: theme.colors.border,

          // sombra superior
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 15,
        },
        tabBarActiveTintColor: theme.colors.tabActive,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: fonts.medium,
          fontWeight: "500",
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case "Calendar":
              iconName = "calendar-outline";
              break;
            case "Clients":
              iconName = "people-outline";
              break;
            case "CreateAppointment":
              iconName = "add-circle-outline";
              break;
            case "NotificationScreen":
              iconName = "notifications-outline";
              break;
            case "SettingsScreen":
              iconName = "settings-outline";
              break;
          }

          return (
            <Ionicons name={iconName!} size={focused ? 26 : 20} color={color} />
          );
        },
      })}
    >
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: "Calendar",
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{ title: "Clientes" }}
      />
      <Tab.Screen
        name="CreateAppointment"
        component={CreateAppointmentScreen}
        options={{ title: "Citas" }}
      />
      <Tab.Screen
        name="NotificationScreen"
        component={NotificationScreen}
        options={{
          title: "Notific.",
          tabBarBadge:
            clientNotifications > 0 ? clientNotifications : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.notificationBadge,
            color: theme.colors.surface,
            fontSize: 11,
            fontWeight: "600",
          },
        }}
      />
      <Tab.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ title: "Config." }}
      />
    </Tab.Navigator>
  );
};
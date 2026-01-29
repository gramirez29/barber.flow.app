import { createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CreateAppointmentScreen } from '../screens/CreateAppointmentScreen';
import { ClientsScreen } from '../screens/ClientsScreen';


export type AppStackParamList = {
  Calendar: undefined;
  Clients: undefined;
  CreateAppointment: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

{/* AppNavigator va a manejar la navegacion interna de la app */}
export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // usamos AppHeader custom
      }}
    >
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Clients" component={ClientsScreen} />
      <Stack.Screen name="CreateAppointment" component={CreateAppointmentScreen}
      />
    </Stack.Navigator>
  );
};
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CalendarScreen } from "../screens/CalendarScreen";
import {
  AppointmentFormScreen,
  type AppointmentFormParams,
} from "../screens/AppointmentFormScreen";

export type CalendarStackParamList = {
  CalendarHome:
    | {
        date?: string;
        initialView?: "month" | "week" | "day";
        source?: "notification" | "clientSaved";
      }
    | undefined;
  AppointmentForm: AppointmentFormParams;
};

const Stack = createNativeStackNavigator<CalendarStackParamList>();

export const CalendarNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CalendarHome" component={CalendarScreen} />
    <Stack.Screen name="AppointmentForm" component={AppointmentFormScreen} />
  </Stack.Navigator>
);

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Client } from "../types/clients";
import { ClientsScreen } from "../screens/ClientsScreen";
import { ClientFormScreen } from "../screens/ClientFormScreen";
import {
	AppointmentFormScreen,
	type AppointmentFormParams,
} from "../screens/AppointmentFormScreen";

export type ClientsStackParamList = {
	ClientsList: undefined;
	ClientForm: {
		client?: Client;
		mode: "create" | "edit";
	};
	AppointmentForm: AppointmentFormParams;
};

const Stack = createNativeStackNavigator<ClientsStackParamList>();

export const ClientsNavigator = () => (
	<Stack.Navigator screenOptions={{ headerShown: false }}>
		<Stack.Screen name="ClientsList" component={ClientsScreen} />
		<Stack.Screen name="ClientForm" component={ClientFormScreen} />
		<Stack.Screen name="AppointmentForm" component={AppointmentFormScreen} />
	</Stack.Navigator>
);

import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { AppNavigator, type AppTabParamList } from "./AppNavigator";
import { AppDrawerContent } from "../components/ui/AppDrawerContent";
import { useTranslation } from "../context/LanguageContext";
import type { NavigatorScreenParams } from "@react-navigation/native";

export type DrawerParamList = {
	HomeTabs: NavigatorScreenParams<AppTabParamList> | undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export const DrawerNavigator = () => {
	const { translateText } = useTranslation();

	return (
    <Drawer.Navigator
		screenOptions={{
			headerShown: false,
			drawerStyle: {
				backgroundColor: "#1C1C1C",
				borderRightColor: "transparent",
				borderRightWidth: 0,
			},
			drawerActiveBackgroundColor: "#2B2B2B",
			drawerInactiveBackgroundColor: "transparent",
		}}
		drawerContent={(props) => <AppDrawerContent {...props} />}
>
	<Drawer.Screen
        name="HomeTabs"
        component={AppNavigator}
        options={{ title: translateText("navigation.home") }}
	/>
    </Drawer.Navigator>
);
};
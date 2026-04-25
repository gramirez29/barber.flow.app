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
		screenOptions={{ headerShown: false }}
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
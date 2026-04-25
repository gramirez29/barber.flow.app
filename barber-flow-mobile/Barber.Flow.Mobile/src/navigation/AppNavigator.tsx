import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { DailyReportScreen } from "../screens/DailyReportScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { ClientsNavigator } from "./ClientsNavigator";
import { NotificationScreen } from "../screens/NotificationScreen";
import { fonts } from "../theme/fonts";
import { useAppTheme } from "../theme/ThemeContext";
import { useNotification } from "../context/NotificationContext";
import { useTranslation } from "../context/LanguageContext";
import type { NavigatorScreenParams } from "@react-navigation/native";
import {
	CalendarNavigator,
	type CalendarStackParamList,
} from "./CalendarNavigator";

export type AppTabParamList = {
	Calendar: NavigatorScreenParams<CalendarStackParamList> | undefined;
	Clients: undefined;
	DailyReport: undefined;
	SettingsScreen: undefined;
	NotificationScreen: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppNavigator = () => {
	const { theme } = useAppTheme();
	const { unreadCount } = useNotification();
	const { translateText } = useTranslation();
	const tabMetadata: Record<
		keyof AppTabParamList,
		{
			label: string;
			icon: keyof typeof Ionicons.glyphMap;
		}
	> = {
		Calendar: {
			label: translateText("navigation.calendar"),
			icon: "calendar-outline",
		},
		Clients: {
			label: translateText("navigation.clients"),
			icon: "people-outline",
		},
		DailyReport: {
			label: translateText("navigation.dailyReport"),
			icon: "bar-chart-outline",
		},
		NotificationScreen: {
			label: translateText("navigation.alerts"),
			icon: "notifications-outline",
		},
		SettingsScreen: {
			label: translateText("navigation.settings"),
			icon: "settings-outline",
		},
	};
	const isDarkMode = theme.mode === "dark";
	const activeIconBackground = isDarkMode
		? "rgba(96, 165, 250, 0.18)"
		: "rgba(59, 130, 246, 0.12)";
	const activeIconBorder = isDarkMode
		? "rgba(96, 165, 250, 0.32)"
		: "rgba(59, 130, 246, 0.2)";

	return (
		<Tab.Navigator
		screenOptions={({ route }) => ({
			headerShown: false,
			tabBarHideOnKeyboard: true,
			tabBarStyle: {
				backgroundColor: theme.colors.surface,
				height: 74,
				paddingBottom: theme.layout.spacing.sm,
				paddingTop: theme.layout.spacing.sm,
				borderTopWidth: 0.5,
				borderTopColor: theme.colors.border,
				...theme.layout.shadows.card,
			},
			tabBarItemStyle: {
				paddingHorizontal: theme.layout.spacing.xs,
			},
			tabBarActiveTintColor: theme.colors.tabActive,
			tabBarInactiveTintColor: theme.colors.tabInactive,
			tabBarLabelStyle: {
				fontSize: 11,
				fontFamily: fonts.medium,
				fontWeight: "500",
				marginTop: theme.layout.spacing.xs,
				marginBottom: 0,
				letterSpacing: 0.15,
			},
			tabBarIconStyle: {
				marginBottom: 0,
			},
			tabBarIcon: ({ focused, color }) => {
			const metadata = tabMetadata[route.name];

			return (
				<View
					style={[
						styles.iconShell,
						{
						borderRadius: theme.layout.radius.md + 2,
						},
						focused && {
						backgroundColor: activeIconBackground,
						borderColor: activeIconBorder,
						},
					]}
					>
					<Ionicons name={metadata.icon} size={22} color={color} />
				</View>
			);
			},
		})}
		>
		<Tab.Screen
			name="Calendar"
			component={CalendarNavigator}
			options={{
				title: tabMetadata.Calendar.label,
			}}
		/>
		<Tab.Screen
			name="Clients"
			component={ClientsNavigator}
			options={{ title: tabMetadata.Clients.label }}
		/>
		<Tab.Screen
			name="DailyReport"
			component={DailyReportScreen}
			options={{ title: tabMetadata.DailyReport.label }}
		/>
		<Tab.Screen
			name="NotificationScreen"
			component={NotificationScreen}
			options={{
				title: tabMetadata.NotificationScreen.label,
				tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
				tabBarBadgeStyle: {
					backgroundColor: theme.colors.notificationBadge,
					color: theme.colors.surface,
					fontSize: 11,
					fontWeight: "600",
					minWidth: 18,
					height: 18,
					lineHeight: 18,
					top: 6,
					right: 10,
				},
			}}
		/>
		<Tab.Screen
			name="SettingsScreen"
			component={SettingsScreen}
			options={{ title: tabMetadata.SettingsScreen.label }}
		/>
		</Tab.Navigator>
	);
};

const styles = StyleSheet.create({
	iconShell: {
		alignItems: "center",
		borderColor: "transparent",
		borderWidth: 1,
		height: 32,
		justifyContent: "center",
		width: 44,
	},
});

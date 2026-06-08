import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
			activeIcon: keyof typeof Ionicons.glyphMap;
		}
	> = {
		Calendar: {
			label: translateText("navigation.calendar"),
			icon: "calendar-outline",
			activeIcon: "calendar",
		},
		Clients: {
			label: translateText("navigation.clients"),
			icon: "people-outline",
			activeIcon: "people",
		},
		DailyReport: {
			label: translateText("navigation.dailyReport"),
			icon: "bar-chart-outline",
			activeIcon: "bar-chart",
		},
		NotificationScreen: {
			label: translateText("navigation.alerts"),
			icon: "notifications-outline",
			activeIcon: "notifications",
		},
		SettingsScreen: {
			label: translateText("navigation.settings"),
			icon: "settings-outline",
			activeIcon: "settings",
		},
	};
	const activeIconBackground = theme.colors.accent + "2E"; // ~18% opacity
	const activeIconBorder = theme.colors.accent + "61"; // ~38% opacity

	return (
		<Tab.Navigator
		screenOptions={({ route }) => ({
			headerShown: false,
			tabBarHideOnKeyboard: true,
			tabBarStyle: {
				backgroundColor: "transparent",
				borderTopWidth: 0,
				elevation: 0,
				height: 91,
				left: 10,
				overflow: "hidden",
				paddingBottom: 9,
				paddingTop: 9,
				position: "absolute",
				right: 10,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: -2 },
				shadowOpacity: 0.26,
				shadowRadius: 10,
			},
			tabBarBackground: () => (
				<LinearGradient
					colors={[theme.colors.primaryInput, theme.colors.background, theme.colors.surface]}
					end={{ x: 1, y: 0.5 }}
					start={{ x: 0, y: 0.5 }}
					style={styles.tabBarBackground}
				/>
			),
			tabBarItemStyle: {
				paddingHorizontal: 3,
			},
			tabBarActiveTintColor: theme.colors.accent,
			tabBarInactiveTintColor: theme.colors.textSecondary,
			tabBarLabelStyle: {
				fontSize: 11,
				fontFamily: fonts.medium,
				fontWeight: "600",
				marginTop: 3,
				marginBottom: 0,
				letterSpacing: 0.2,
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
						focused && {
						backgroundColor: activeIconBackground,
						borderColor: activeIconBorder,
						},
					]}
					>
					<Ionicons name={focused ? metadata.activeIcon : metadata.icon} size={21} color={color} />
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
						color: "#FFFFFF",
					fontSize: 11,
						fontWeight: "700",
					minWidth: 18,
					height: 18,
					lineHeight: 18,
						top: 4,
						right: 8,
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
		borderRadius: 12,
		height: 34,
		justifyContent: "center",
		width: 46,
	},
	tabBarBackground: {
		position: "absolute",
		top: 5,
		left: 0,
		right: 0,
		bottom: 0,
		borderColor: "rgba(170, 170, 170, 0.5)",
		borderRadius: 20,
		borderWidth: StyleSheet.hairlineWidth,
	},
});

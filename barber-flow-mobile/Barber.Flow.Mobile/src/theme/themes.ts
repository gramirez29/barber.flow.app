import {
	DefaultTheme as NavigationDefaultTheme,
	DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

export const lightTheme = {
	mode: "light",
	colors: {
		background: "#1A1A1A", // Lighter gray for a premium charcoal look
		surface: "#242424",
		primary: "#FFFFFF",
		secondary: "#C9A84C", 
		textPrimary: "#FFFFFF",
		textSecondary: "#A1A1AA",
		border: "#333333",
		tabActive: "#C9A84C",
		tabInactive: "#71717A",
		notificationBadge: "#EF4444",
		card: "#2A2A2A",
		primaryInput: "#1A1A1A",
		primaryTextInput: "#A1A1AA",
		error: "#DC2626",
		errorBg: "rgba(220, 38, 38, 0.1)",
		accent: "#C9A84C",
		accentLight: "#E5C878",
		surfaceElevated: "#2D2D2D",
		overlay: "rgba(0, 0, 0, 0.7)",
		badgePrimary: "#C9A84C",
		success: "#10B981",
		info: "#3B82F6",
	},
	layout: {
		spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
		radius: { sm: 6, md: 10, lg: 14 },
		sizes: {
			avatar: 64,
			headerHeight: 64,
			imageBannerHeight: 180,
			maxContentWidth: 520,
		},
		shadows: {
		color: "#000",
		card: {
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.08,
			shadowRadius: 8,
			elevation: 4,
		},
		},
		typography: { h1: 20, body: 16, small: 13 },
		components: {
		input: { paddingVertical: 14, paddingHorizontal: 14, radius: 10 },
		button: { height: 48, radius: 10, fontSize: 16 },
		},
	},
};

export const darkTheme = {
	mode: "dark",
	colors: {
		background: "#0D0D0D", // Original dark background
		surface: "#161616",
		primary: "#FFFFFF",
		secondary: "#C9A84C",
		textPrimary: "#FFFFFF",
		textSecondary: "#A3A3A3",
		border: "#262626",
		tabActive: "#C9A84C",
		tabInactive: "#737373",
		notificationBadge: "#EF4444",
		card: "#1E1E1E", // Fixed: was light color in dark theme
		primaryInput: "#0D0D0D",
		primaryTextInput: "#A3A3A3",
		error: "#EF4444",
		errorBg: "rgba(239, 68, 68, 0.1)",
		accent: "#C9A84C",
		accentLight: "#E5C878",
		surfaceElevated: "#1A1A1A",
		overlay: "rgba(0, 0, 0, 0.75)",
		badgePrimary: "#C9A84C",
		success: "#10B981",
		info: "#3B82F6",
	},
	layout: {
		spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
		radius: { sm: 6, md: 10, lg: 14 },
		sizes: {
			avatar: 64,
			headerHeight: 64,
			imageBannerHeight: 180,
			maxContentWidth: 520,
		},
		shadows: {
		color: "#000",
			card: {
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.08,
				shadowRadius: 8,
				elevation: 4,
			},
		},
		typography: { h1: 20, body: 16, small: 13 },
		components: {
		input: { paddingVertical: 14, paddingHorizontal: 14, radius: 10 },
		button: { height: 48, radius: 10, fontSize: 16 },
		},
	},
};

export type AppTheme = typeof lightTheme;

export const createPaperTheme = (theme: AppTheme) => {
	const baseTheme = theme.mode === "dark" ? MD3DarkTheme : MD3LightTheme;

	return {
		...baseTheme,
		colors: {
		...baseTheme.colors,
		background: theme.colors.background,
		error: theme.colors.error,
		onBackground: theme.colors.textPrimary,
		onPrimary: "#0D0D0D", // Dark text on Gold buttons
		onSurface: theme.colors.textPrimary,
		outline: theme.colors.border,
		primary: theme.colors.primary,
		secondary: theme.colors.secondary,
		surface: theme.colors.surface,
		},
		roundness: theme.layout.radius.md,
	};
};

export const createNavigationTheme = (theme: AppTheme) => {
	const baseTheme =
		theme.mode === "dark" ? NavigationDarkTheme : NavigationDefaultTheme;

	return {
		...baseTheme,
		colors: {
			...baseTheme.colors,
			background: theme.colors.background,
			border: theme.colors.border,
			card: theme.colors.surface,
			notification: theme.colors.notificationBadge,
			primary: theme.colors.primary,
			text: theme.colors.textPrimary,
		},
	};
};

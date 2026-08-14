import React from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
} from "react-native";

import { DrawerContentScrollView, type DrawerContentComponentProps } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../store/auth.store";
import { authService } from "../../services/authService";
import { useAppTheme } from "../../theme/ThemeContext";
import { AppTheme } from "../../theme/themes";
import { useTranslation } from "../../context/LanguageContext";
import { useDialog } from "../../context/DialogContext";
const pkg = require("../../../package.json");

const getInitials = (value: string) =>
	value
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("") || "BF";

export const AppDrawerContent = (props: DrawerContentComponentProps) => {
	const clearUser = useAuthStore((s) => s.clearUser);
	const user = useAuthStore((s) => s.user);
	const { theme } = useAppTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const { translateText } = useTranslation();
	const { showAlert } = useDialog();

	const name = user?.name ?? translateText("header.guest");
	const email = user?.email ?? "";
	const userName = user?.userName ?? "";
	const role = user?.role ?? "";
	const avatarUri = "https://i.pravatar.cc/160?img=12";
	const identity = name === "Guest" && userName ? userName : name;
	const initials = getInitials(identity);

	const handleLogout = () => {
		showAlert(translateText("drawer.logoutTitle"), translateText("drawer.logoutMessage"), [
		{ text: translateText("drawer.cancel"), style: "cancel" },
		{
			text: translateText("drawer.logout"),
			style: "destructive",
			onPress: async () => {
			props.navigation.closeDrawer();
			clearUser();
			await authService.clearStoredUser();
			},
		},
		]);
	};

	const handleDeleteAccount = () => {
		showAlert(
			translateText("drawer.deleteAccountTitle"),
			translateText("drawer.deleteAccountMessage"),
			[
				{ text: translateText("drawer.cancel"), style: "cancel" },
				{
					text: translateText("drawer.deleteAccountConfirm"),
					style: "destructive",
					onPress: async () => {
						props.navigation.closeDrawer();
						await authService.deleteSelf();
						clearUser();
					},
				},
			],
		);
	};

	const goToSettings = () => {
		props.navigation.navigate("HomeTabs", { screen: "SettingsScreen" });
		props.navigation.closeDrawer();
	};

	const openHelp = () => {
		showAlert(
		translateText("drawer.helpTitle"),
		translateText("drawer.helpMessage"),
		);
	};

	const year = new Date().getFullYear();
	const version = pkg?.version ?? "0.0.0";

	const renderAction = ({
		destructive = false,
		icon,
		label,
		onPress,
		description,
	}: {
		description: string;
		destructive?: boolean;
		icon: React.ComponentProps<typeof Ionicons>["name"];
		label: string;
		onPress: () => void;
	}) => (
		<TouchableOpacity
			key={label}
			activeOpacity={0.82}
			onPress={onPress}
			style={[
				styles.actionRow,
				{
					backgroundColor: theme.colors.surface,
					borderColor: theme.colors.border,
				},
			]}
		>
			<View
				style={[
					styles.actionIconWrap,
					{
						backgroundColor: destructive 
							? theme.colors.error + "38" 
							: theme.colors.accent + "29",
					},
				]}
			>
				<Ionicons
					name={icon}
					size={20}
					color={destructive ? theme.colors.error : theme.colors.textPrimary}
				/>
			</View>

			<View style={styles.actionCopy}>
				<Text
					style={[
						styles.actionLabel,
						{ color: destructive ? theme.colors.error : theme.colors.textPrimary },
					]}
					>
					{label}
				</Text>
				<Text style={[styles.actionDescription, { color: theme.colors.textSecondary }]}>
					{description}
				</Text>
			</View>

			<Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
		</TouchableOpacity>
	);

	return (
		<View style={styles.root}>
			<LinearGradient
				colors={["transparent", theme.colors.border + "2E", theme.colors.border + "2E", "transparent"]}
				locations={[0, 0.35, 0.65, 1]}
				start={{ x: 0, y: 0 }}
				end={{ x: 0, y: 1 }}
				style={styles.sideFadeLine}
				pointerEvents="none"
			/>
			<DrawerContentScrollView
				{...props}
				contentContainerStyle={[
					styles.container,
					{ backgroundColor: theme.colors.background },
				]}
				>
			<View style={styles.topGoldDivider} />
			<View
				style={[
					styles.heroCard,
					{
						backgroundColor: theme.colors.surface,
						borderColor: theme.colors.border,
					},
					theme.layout.shadows.card,
				]}
			>
				<LinearGradient
					colors={["#080808", "#111111", "#1B1B1B"]}
					end={{ x: 1, y: 0.5 }}
					start={{ x: 0, y: 0.5 }}
					style={styles.heroGradient}
				>
				<View style={styles.heroTopRow}>
					<View style={[styles.brandPill, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}> 
						<Text style={[styles.brandPillText, { color: theme.colors.textSecondary }]}>
							Barber Flow
						</Text>
					</View>
					<View style={[styles.versionPill, { backgroundColor: theme.colors.accent + "29" }]}> 
						<Text style={[styles.versionPillText, { color: theme.colors.accentLight }]}>
							v{version}
						</Text>
					</View>
				</View>

				<View style={styles.profileRow}>
					<View style={styles.avatarStack}>
						<Image
							source={{ uri: avatarUri }}
							style={[
								styles.avatar,
								{
								width: theme.layout.sizes.avatar + 12,
								height: theme.layout.sizes.avatar + 12,
								borderRadius: (theme.layout.sizes.avatar + 12) / 2,
								},
							]}
						/>
						<View style={[styles.avatarBadge, { backgroundColor: theme.colors.accent }]}> 
							<Text style={[styles.avatarBadgeText, { color: "#0F172A" }]}>
								{initials}
							</Text>
						</View>
					</View>

					<View style={styles.userInfo}>
						<Text style={styles.profileEyebrow}>{translateText("drawer.studioAccess")}</Text>
						<Text style={styles.profileTitle} numberOfLines={1}>{identity}</Text>
						<Text style={styles.profileSubtitle} numberOfLines={1}>
							{email || userName || translateText("drawer.noAccountMetadata")}
						</Text>
						{role ? (
							<View style={[styles.rolePill, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
								<Text style={[styles.rolePillText, { color: theme.colors.textSecondary }]}>{role}</Text>
							</View>
						) : null}
					</View>
				</View>

				<Text style={[styles.heroBody, { color: theme.colors.textSecondary }]}>
					{translateText("drawer.heroBody")}
				</Text>
				</LinearGradient>
			</View>

			<View style={styles.sectionGoldDivider} />

			<View style={styles.section}>
				<Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
					{translateText("drawer.workspace")}
				</Text>
				{renderAction({
					description: translateText("drawer.settingsDescription"),
					icon: "construct-outline",
					label: translateText("drawer.settings"),
					onPress: goToSettings,
				})}
			</View>

			<View style={styles.sectionGoldDivider} />

			<View style={styles.section}>
				<Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
					{translateText("drawer.support")}
				</Text>
				{renderAction({
					description: translateText("drawer.helpDescription"),
					icon: "sparkles-outline",
					label: translateText("drawer.help"),
					onPress: openHelp,
				})}
				{user?.role !== "Admin" && renderAction({
					description: translateText("drawer.deleteAccountDescription"),
					destructive: true,
					icon: "trash-outline",
					label: translateText("drawer.deleteAccount"),
					onPress: handleDeleteAccount,
				})}
				{renderAction({
					description: translateText("drawer.logoutDescription"),
					destructive: true,
					icon: "power-outline",
					label: translateText("drawer.logout"),
					onPress: handleLogout,
				})}
			</View>

			<View style={styles.footerWrap} />

			<View style={styles.footerGoldDivider} />

			<LinearGradient
				colors={["#080808", "#0D0D0D", "#1B1B1B"]}
				end={{ x: 1, y: 0.5 }}
				start={{ x: 0, y: 0.5 }}
				style={styles.footer}
			>
				<Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
					Barber Flow Mobile
				</Text>
				<Text style={[styles.footerMeta, { color: theme.colors.textSecondary }]}>
					v{version} • {year}
				</Text>
			</LinearGradient>
			</DrawerContentScrollView>
		</View>
	);
	};

const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
		root: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		sideFadeLine: {
			position: "absolute",
			right: 0,
			top: 8,
			bottom: 8,
			width: 2,
			zIndex: 10,
		},
		container: { 
			flexGrow: 1,
			paddingHorizontal: 16,
			paddingVertical: 16,
		},
		topGoldDivider: {
			backgroundColor: theme.colors.border,
			borderRadius: 1,
			height: StyleSheet.hairlineWidth,
			opacity: 0.5,
			marginBottom: 14,
		},
		heroCard: {
			borderRadius: 26,
			borderWidth: 1,
			marginBottom: 20,
			overflow: "hidden",
		},
		heroGradient: {
			paddingHorizontal: 18,
			paddingVertical: 18,
		},
		sectionGoldDivider: {
			backgroundColor: theme.colors.border,
			height: StyleSheet.hairlineWidth,
			opacity: 0.45,
			marginBottom: 14,
			marginHorizontal: 2,
		},
		heroTopRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 10,
			marginBottom: 18,
		},
		brandPill: {
			borderRadius: 999,
			borderWidth: 1,
			paddingHorizontal: 12,
			paddingVertical: 7,
		},
		brandPillText: {
			fontSize: 12,
			fontWeight: "700",
			letterSpacing: 0.8,
			textTransform: "uppercase",
		},
		versionPill: {
			borderRadius: 999,
			paddingHorizontal: 12,
			paddingVertical: 7,
		},
		versionPillText: {
			fontSize: 12,
			fontWeight: "700",
		},
		profileRow: {
			alignItems: "center",
			flexDirection: "row",
			gap: 16,
		},
		avatarStack: {
			position: "relative",
		},
		avatar: { },
		avatarBadge: {
			alignItems: "center",
			borderRadius: 16,
			bottom: -2,
			height: 32,
			justifyContent: "center",
			position: "absolute",
			right: -6,
			width: 32,
		},
		avatarBadgeText: {
			fontSize: 11,
			fontWeight: "700",
		},
		userInfo: {
			flex: 1,
			gap: 10,
		},
		profileEyebrow: {
			color: theme.colors.textSecondary,
			fontSize: 11,
			fontWeight: "700",
			letterSpacing: 0.8,
			textTransform: "uppercase",
		},
		profileTitle: {
			color: theme.colors.textPrimary,
			fontSize: 19,
			fontWeight: "700",
			lineHeight: 25,
		},
		profileSubtitle: {
			color: theme.colors.textSecondary,
			fontSize: 12,
			lineHeight: 17,
			marginTop: -4,
		},
		rolePill: {
			alignSelf: "flex-start",
			borderRadius: 999,
			borderWidth: 1,
			paddingHorizontal: 10,
			paddingVertical: 6,
		},
		rolePillText: {
			fontSize: 12,
			fontWeight: "600",
		},
		heroBody: {
			fontSize: 13,
			lineHeight: 19,
			marginTop: 16,
		},
		section: {
			marginBottom: 18,
		},
		sectionLabel: {
			fontSize: 12,
			fontWeight: "700",
			letterSpacing: 0.8,
			marginBottom: 10,
			marginLeft: 4,
			textTransform: "uppercase",
		},
		actionRow: {
			alignItems: "center",
			borderRadius: 18,
			borderWidth: 1,
			flexDirection: "row",
			gap: 14,
			marginBottom: 10,
			paddingHorizontal: 14,
			paddingVertical: 14,
		},
		actionIconWrap: {
			alignItems: "center",
			borderRadius: 20,
			height: 40,
			justifyContent: "center",
			width: 40,
		},
		actionCopy: {
			flex: 1,
			gap: 2,
		},
		actionLabel: {
			fontSize: 15,
			fontWeight: "700",
		},
		actionDescription: {
			fontSize: 13,
			lineHeight: 18,
		},
		footerWrap: {
			flex: 1,
		},
		footerGoldDivider: {
			backgroundColor: theme.colors.border,
			height: StyleSheet.hairlineWidth,
			opacity: 0.5,
			marginBottom: 10,
			marginHorizontal: 2,
		},
		footer: {
			borderRadius: 16,
			gap: 4,
			paddingHorizontal: 12,
			paddingVertical: 14,
		},
		footerText: {
			fontSize: 13,
			fontWeight: "700",
		},
		footerMeta: {
			fontSize: 12,
		},
	});

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
import { useTranslation } from "../../context/LanguageContext";
import { useDialog } from "../../context/DialogContext";
const pkg = require("../../../package.json");

const DRAWER_COLORS = {
	bg: "#1C1C1C",
	surface: "#1A1A1A",
	surfaceElevated: "#252525",
	border: "#3A3A3A",
	textPrimary: "#FFFFFF",
	textSecondary: "#B0B0B0",
	separator: "#9A9A9A",
	accentMuted: "rgba(201, 168, 76, 0.16)",
	errorMuted: "rgba(229, 115, 115, 0.22)",
} as const;

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
					backgroundColor: DRAWER_COLORS.surface,
					borderColor: DRAWER_COLORS.border,
				},
			]}
		>
			<View
				style={[
					styles.actionIconWrap,
					{
						backgroundColor: destructive ? DRAWER_COLORS.errorMuted : DRAWER_COLORS.accentMuted,
					},
				]}
			>
				<Ionicons
					name={icon}
					size={20}
					color={destructive ? "#E57373" : DRAWER_COLORS.textPrimary}
				/>
			</View>

			<View style={styles.actionCopy}>
				<Text
					style={[
						styles.actionLabel,
						{ color: destructive ? "#E57373" : DRAWER_COLORS.textPrimary },
					]}
					>
					{label}
				</Text>
				<Text style={[styles.actionDescription, { color: DRAWER_COLORS.textSecondary }]}>
					{description}
				</Text>
			</View>

			<Ionicons name="chevron-forward" size={18} color={DRAWER_COLORS.textSecondary} />
		</TouchableOpacity>
	);

	return (
		<View style={styles.root}>
			<LinearGradient
				colors={["rgba(154,154,154,0)", "rgba(154,154,154,0.18)", "rgba(154,154,154,0.18)", "rgba(154,154,154,0)"]}
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
					{ backgroundColor: DRAWER_COLORS.bg },
				]}
				>
			<View style={styles.topGoldDivider} />
			<View
				style={[
					styles.heroCard,
					{
						backgroundColor: DRAWER_COLORS.surface,
						borderColor: DRAWER_COLORS.border,
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
					<View style={[styles.brandPill, { backgroundColor: DRAWER_COLORS.surfaceElevated, borderColor: DRAWER_COLORS.border }]}> 
						<Text style={[styles.brandPillText, { color: DRAWER_COLORS.textSecondary }]}>
							Barber Flow
						</Text>
					</View>
					<View style={[styles.versionPill, { backgroundColor: DRAWER_COLORS.accentMuted }]}> 
						<Text style={[styles.versionPillText, { color: "#E8D4A2" }]}>
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
						<View style={[styles.avatarBadge, { backgroundColor: "#C9A84C" }]}> 
							<Text style={[styles.avatarBadgeText, { color: "#0D0D0D" }]}>
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
							<View style={[styles.rolePill, { backgroundColor: DRAWER_COLORS.surfaceElevated, borderColor: DRAWER_COLORS.border }]}>
								<Text style={[styles.rolePillText, { color: DRAWER_COLORS.textSecondary }]}>{role}</Text>
							</View>
						) : null}
					</View>
				</View>

				<Text style={[styles.heroBody, { color: DRAWER_COLORS.textSecondary }]}>
					{translateText("drawer.heroBody")}
				</Text>
				</LinearGradient>
			</View>

			<View style={styles.sectionGoldDivider} />

			<View style={styles.section}>
				<Text style={[styles.sectionLabel, { color: DRAWER_COLORS.textSecondary }]}>
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
				<Text style={[styles.sectionLabel, { color: DRAWER_COLORS.textSecondary }]}>
					{translateText("drawer.support")}
				</Text>
				{renderAction({
					description: translateText("drawer.helpDescription"),
					icon: "sparkles-outline",
					label: translateText("drawer.help"),
					onPress: openHelp,
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
				<Text style={[styles.footerText, { color: DRAWER_COLORS.textSecondary }]}>
					Barber Flow Mobile
				</Text>
				<Text style={[styles.footerMeta, { color: DRAWER_COLORS.textSecondary }]}>
					v{version} • {year}
				</Text>
			</LinearGradient>
			</DrawerContentScrollView>
		</View>
	);
	};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: DRAWER_COLORS.bg,
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
		backgroundColor: DRAWER_COLORS.separator,
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
		backgroundColor: DRAWER_COLORS.separator,
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
		color: DRAWER_COLORS.textSecondary,
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 0.8,
		textTransform: "uppercase",
	},
	profileTitle: {
		color: DRAWER_COLORS.textPrimary,
		fontSize: 19,
		fontWeight: "700",
		lineHeight: 25,
	},
	profileSubtitle: {
		color: DRAWER_COLORS.textSecondary,
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
		backgroundColor: "#101010",
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
		backgroundColor: DRAWER_COLORS.separator,
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

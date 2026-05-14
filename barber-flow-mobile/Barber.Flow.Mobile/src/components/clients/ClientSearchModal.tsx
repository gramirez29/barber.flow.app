import React from "react";
import {
	ActivityIndicator,
	FlatList,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { Modal, Portal } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { ClientAvatar } from "../ClientAvatar";
import type { Client } from "../../types/clients";
import {
	openClientMessagePicker,
	openClientPhoneCall,
} from "../../utils/contactActions";
import { useTranslation } from "../../context/LanguageContext";

const COLORS = {
	bg: "#0D0D0D",
	surface: "#1A1A1A",
	surfaceElevated: "#252525",
	gold: "#C9A84C",
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
	border: "#3A3A3A",
} as const;

interface ClientSearchModalProps {
	clients: Client[];
	loading: boolean;
	search: string;
	visible: boolean;
	onApplyFilter: () => void;
	onClose: () => void;
	onSearchChange: (value: string) => void;
	onSelectClient: (client: Client) => void;
}

export const ClientSearchModal: React.FC<ClientSearchModalProps> = ({
	clients,
	loading,
	search,
	visible,
	onApplyFilter,
	onClose,
	onSearchChange,
	onSelectClient,
}) => {
	const { translateText } = useTranslation();
	const contactActionLabels = {
		callUnavailableMessage: translateText("contactActions.callUnavailableMessage"),
		callUnavailableOpen: translateText("contactActions.callUnavailableOpen"),
		callUnavailableTitle: translateText("contactActions.callUnavailableTitle"),
		cancel: translateText("common.cancel"),
		chooseContactMethod: translateText("contactActions.chooseContactMethod"),
		hello: translateText("contactActions.hello"),
		helloName: translateText("contactActions.helloName", { name: "%{name}" }),
		sendMessage: translateText("contactActions.sendMessage"),
		smsLabel: "SMS",
		smsUnavailableMessage: translateText("contactActions.smsUnavailableMessage"),
		smsUnavailableOpen: translateText("contactActions.smsUnavailableOpen"),
		smsUnavailableTitle: translateText("contactActions.smsUnavailableTitle"),
		whatsappLabel: "WhatsApp",
		whatsappUnavailableMessage: translateText("contactActions.whatsappUnavailableMessage"),
		whatsappUnavailableOpen: translateText("contactActions.whatsappUnavailableOpen"),
		whatsappUnavailableTitle: translateText("contactActions.whatsappUnavailableTitle"),
	};

	return (
		<Portal>
			<Modal
				visible={visible}
				onDismiss={onClose}
				contentContainerStyle={styles.modal}
			>
				{/* ─── Header ─────────────────────────────────── */}
				<View style={styles.header}>
					<View style={styles.headerText}>
						<Text style={styles.eyebrow}>
							{translateText("clients.searchModal.eyebrow")}
						</Text>
						<Text style={styles.title}>
							{translateText("clients.searchModal.title")}
						</Text>
						<Text style={styles.subtitle}>
							{translateText("clients.searchModal.subtitle")}
						</Text>
					</View>
					<Pressable
						onPress={onClose}
						style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
						accessibilityLabel={translateText("common.close")}
					>
						<Ionicons name="close" size={18} color={COLORS.textSecondary} />
					</Pressable>
				</View>

				{/* ─── Search bar ─────────────────────────────── */}
				<View style={styles.searchWrap}>
					<Ionicons
						name="search"
						size={17}
						color={COLORS.textSecondary}
						style={styles.searchIcon}
					/>
					<TextInput
						style={styles.searchInput}
						placeholder={translateText("clients.searchModal.placeholder")}
						placeholderTextColor={COLORS.textSecondary}
						value={search}
						onChangeText={onSearchChange}
						onSubmitEditing={onApplyFilter}
						returnKeyType="search"
						autoCapitalize="none"
						autoCorrect={false}
					/>
					<Pressable
						onPress={onApplyFilter}
						disabled={loading}
						style={({ pressed }) => [
							styles.searchSubmitBtn,
							pressed && styles.searchSubmitBtnPressed,
							loading && styles.searchSubmitBtnDisabled,
						]}
						accessibilityLabel={translateText("common.search")}
					>
						{loading ? (
							<ActivityIndicator size={18} color={COLORS.gold} />
						) : (
							<Ionicons name="arrow-forward-circle" size={26} color={COLORS.gold} />
						)}
					</Pressable>
				</View>

				{/* ─── Results list ────────────────────────────── */}
				<FlatList
					data={clients}
					keyExtractor={(item) =>
						item.id ?? `${item.firstName}-${item.lastName}-${item.phone}`
					}
					renderItem={({ item, index }) => {
						const fullName = `${item.firstName} ${item.lastName}`.trim();
						const isFirst = index === 0;
						const isLast = index === clients.length - 1;

						return (
							<View
								style={[
									styles.card,
									isFirst && styles.cardFirst,
									isLast && styles.cardLast,
								]}
							>
								<View style={styles.cardTopRow}>
									<ClientAvatar initials={fullName} size={44} uri={item.photoUrl} />
									<View style={styles.cardText}>
										<Text style={styles.cardName} numberOfLines={1}>{fullName}</Text>
										<Text style={styles.cardMeta} numberOfLines={1}>{item.phone}</Text>
										{item.email ? (
											<Text style={styles.cardMeta} numberOfLines={1}>{item.email}</Text>
										) : null}
									</View>
								</View>

								<View style={styles.cardActions}>
									<Pressable
										onPress={() => void openClientPhoneCall(item.phone, contactActionLabels)}
										style={({ pressed }) => [
											styles.actionBtn,
											pressed && styles.actionBtnPressed,
										]}
									>
										<Ionicons name="call-outline" size={14} color={COLORS.textSecondary} />
										<Text style={styles.actionBtnText}>
											{translateText("common.call")}
										</Text>
									</Pressable>

									<Pressable
										onPress={() =>
											openClientMessagePicker(item.phone, contactActionLabels, fullName)
										}
										style={({ pressed }) => [
											styles.actionBtn,
											pressed && styles.actionBtnPressed,
										]}
									>
										<Ionicons name="chatbubble-outline" size={14} color={COLORS.textSecondary} />
										<Text style={styles.actionBtnText}>
											{translateText("clients.searchModal.message")}
										</Text>
									</Pressable>

									<Pressable
										onPress={() => onSelectClient(item)}
										style={({ pressed }) => [
											styles.selectBtn,
											pressed && styles.selectBtnPressed,
										]}
									>
										<Ionicons name="checkmark-circle-outline" size={14} color={COLORS.bg} />
										<Text style={styles.selectBtnText}>
											{translateText("clients.searchModal.select")}
										</Text>
									</Pressable>
								</View>
							</View>
						);
					}}
					ItemSeparatorComponent={() => <View style={styles.separator} />}
					contentContainerStyle={
						clients.length === 0 ? styles.emptyContainer : styles.listContent
					}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
					onRefresh={onApplyFilter}
					refreshing={loading}
					ListEmptyComponent={
						loading ? (
							<View style={styles.loadingState}>
								<ActivityIndicator size="large" color={COLORS.gold} />
							</View>
						) : (
							<View style={styles.emptyState}>
								<Ionicons name="people-outline" size={40} color={COLORS.border} />
								<Text style={styles.emptyTitle}>
									{translateText("clients.searchModal.emptyTitle")}
								</Text>
								<Text style={styles.emptyBody}>
									{translateText("clients.searchModal.emptyBody")}
								</Text>
							</View>
						)
					}
				/>
			</Modal>
		</Portal>
	);
};

const styles = StyleSheet.create({
	// ─── Modal container
	modal: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.border,
		borderRadius: 24,
		borderWidth: 1,
		margin: 20,
		maxHeight: "88%",
		overflow: "hidden",
		shadowColor: "#C9A84C",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 16,
		elevation: 12,
	},
	// ─── Header
	header: {
		alignItems: "flex-start",
		flexDirection: "row",
		gap: 12,
		justifyContent: "space-between",
		paddingBottom: 16,
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	headerText: {
		flex: 1,
		gap: 4,
	},
	eyebrow: {
		color: COLORS.gold,
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.2,
		textTransform: "uppercase",
	},
	title: {
		color: COLORS.textPrimary,
		fontSize: 22,
		fontWeight: "700",
		letterSpacing: 0.15,
	},
	subtitle: {
		color: COLORS.textSecondary,
		fontSize: 13,
		lineHeight: 19,
		marginTop: 2,
	},
	closeBtn: {
		alignItems: "center",
		backgroundColor: COLORS.surfaceElevated,
		borderColor: COLORS.border,
		borderRadius: 10,
		borderWidth: 1,
		height: 36,
		justifyContent: "center",
		marginTop: 4,
		width: 36,
	},
	closeBtnPressed: {
		opacity: 0.6,
	},
	// ─── Search bar
	searchWrap: {
		alignItems: "center",
		backgroundColor: COLORS.surfaceElevated,
		borderColor: COLORS.border,
		borderRadius: 12,
		borderWidth: 1,
		flexDirection: "row",
		marginBottom: 14,
		marginHorizontal: 20,
		paddingHorizontal: 12,
	},
	searchIcon: {
		marginRight: 8,
	},
	searchInput: {
		color: COLORS.textPrimary,
		flex: 1,
		fontSize: 15,
		paddingVertical: Platform.OS === "ios" ? 12 : 8,
	},
	searchSubmitBtn: {
		padding: 4,
	},
	searchSubmitBtnPressed: {
		opacity: 0.6,
	},
	searchSubmitBtnDisabled: {
		opacity: 0.4,
	},
	// ─── List
	listContent: {
		paddingBottom: 12,
		paddingHorizontal: 20,
	},
	separator: {
		height: 1,
		backgroundColor: COLORS.border,
	},
	// ─── Client card
	card: {
		backgroundColor: COLORS.surfaceElevated,
		borderColor: COLORS.border,
		borderLeftWidth: 1,
		borderRightWidth: 1,
		overflow: "hidden",
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	cardFirst: {
		borderTopLeftRadius: 14,
		borderTopRightRadius: 14,
		borderTopWidth: 1,
	},
	cardLast: {
		borderBottomLeftRadius: 14,
		borderBottomRightRadius: 14,
		borderBottomWidth: 1,
	},
	cardTopRow: {
		alignItems: "center",
		flexDirection: "row",
		gap: 12,
	},
	cardText: {
		flex: 1,
		gap: 2,
	},
	cardName: {
		color: COLORS.textPrimary,
		fontSize: 15,
		fontWeight: "700",
		letterSpacing: 0.1,
	},
	cardMeta: {
		color: COLORS.textSecondary,
		fontSize: 12,
		lineHeight: 17,
	},
	cardActions: {
		alignItems: "center",
		borderColor: COLORS.border,
		borderTopWidth: 1,
		flexDirection: "row",
		gap: 6,
		marginTop: 10,
		paddingTop: 10,
	},
	actionBtn: {
		alignItems: "center",
		borderColor: COLORS.border,
		borderRadius: 8,
		borderWidth: 1,
		flexDirection: "row",
		gap: 5,
		paddingHorizontal: 10,
		paddingVertical: 7,
	},
	actionBtnPressed: {
		backgroundColor: "rgba(255,255,255,0.05)",
	},
	actionBtnText: {
		color: COLORS.textSecondary,
		fontSize: 12,
		fontWeight: "600",
	},
	selectBtn: {
		alignItems: "center",
		backgroundColor: COLORS.gold,
		borderRadius: 8,
		flexDirection: "row",
		gap: 5,
		marginLeft: "auto",
		paddingHorizontal: 12,
		paddingVertical: 7,
	},
	selectBtnPressed: {
		opacity: 0.8,
	},
	selectBtnText: {
		color: COLORS.bg,
		fontSize: 12,
		fontWeight: "700",
	},
	// ─── Empty / loading states
	emptyContainer: {
		paddingBottom: 12,
		paddingHorizontal: 20,
	},
	emptyState: {
		alignItems: "center",
		gap: 10,
		paddingVertical: 32,
	},
	emptyTitle: {
		color: COLORS.textPrimary,
		fontSize: 16,
		fontWeight: "700",
		textAlign: "center",
	},
	emptyBody: {
		color: COLORS.textSecondary,
		fontSize: 13,
		lineHeight: 19,
		textAlign: "center",
	},
	loadingState: {
		alignItems: "center",
		paddingVertical: 32,
	},
});
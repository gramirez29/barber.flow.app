import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
	ActivityIndicator,
	Button,
	Divider,
	Modal,
	Portal,
	Searchbar,
	Text,
} from "react-native-paper";
import { useAppTheme } from "../../theme/ThemeContext";
import type { Client } from "../../types/clients";
import {
	openClientMessagePicker,
	openClientPhoneCall,
} from "../../utils/contactActions";
import { useTranslation } from "../../context/LanguageContext";

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
	const { theme } = useAppTheme();
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
				contentContainerStyle={[
				styles.modal,
				{
					backgroundColor: theme.colors.surface,
					borderColor: theme.colors.border,
				},
				]}
			>
				<View style={styles.header}>
					<View style={styles.headerTextWrap}>
						<Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>
							{translateText("clients.searchModal.eyebrow")}
						</Text>
						<Text style={[styles.title, { color: theme.colors.textPrimary }]}>
							{translateText("clients.searchModal.title")}
						</Text>
						<Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
							{translateText("clients.searchModal.subtitle")}
						</Text>
					</View>
					<Button mode="text" onPress={onClose}>
						{translateText("common.close")}
					</Button>
				</View>

				<View style={styles.searchRow}>
					<Searchbar
						placeholder={translateText("clients.searchModal.placeholder")}
						value={search}
						onChangeText={onSearchChange}
						onSubmitEditing={onApplyFilter}
						style={styles.searchbar}
					/>
					<Button mode="contained" onPress={onApplyFilter} loading={loading} disabled={loading}>
						{translateText("common.search")}
					</Button>
				</View>

				{loading ? <ActivityIndicator style={styles.loader} /> : null}

				<FlatList
					data={clients}
					keyExtractor={(item) => item.id ?? `${item.firstName}-${item.lastName}-${item.phone}`}
					renderItem={({ item }) => {
						const fullName = `${item.firstName} ${item.lastName}`.trim();

					return (
						<View
							style={[
							styles.resultCard,
							{
								backgroundColor: theme.colors.background,
								borderColor: theme.colors.border,
							},
							]}>
							<View style={styles.resultTopRow}>
								<View style={styles.resultTextWrap}>
									<Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
										{fullName}
									</Text>
									<Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
										{item.phone}
									</Text>
										{item.email ? (
									<Text style={[styles.resultMeta, { color: theme.colors.textSecondary }]}>
										{item.email}
									</Text>
									) : null}
								</View>
							</View>

							<View style={styles.resultActionsRow}>
								<Button
									compact
									contentStyle={styles.actionButtonContent}
									icon="phone-outline"
									mode="text"
									onPress={() => void openClientPhoneCall(item.phone, contactActionLabels)}
								>
									{translateText("common.call")}
								</Button>
								<Button
									compact
									contentStyle={styles.actionButtonContent}
									icon="message-text-outline"
									mode="text"
									onPress={() => openClientMessagePicker(item.phone, contactActionLabels, fullName)}
								>
									{translateText("clients.searchModal.message")}
								</Button>
								<Button
									compact
									contentStyle={styles.actionButtonContent}
									mode="contained"
									onPress={() => onSelectClient(item)}
								>
									{translateText("clients.searchModal.select")}
								</Button>
							</View>
						</View>
					);
				}}
					contentContainerStyle={clients.length === 0 ? styles.emptyContainer : styles.listContent}
					keyboardShouldPersistTaps="handled"
					ItemSeparatorComponent={() => <Divider style={styles.hiddenDivider} />}
					ListEmptyComponent={
						<View style={styles.emptyState}>
							<Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
								{translateText("clients.searchModal.emptyTitle")}
							</Text>
							<Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
								{translateText("clients.searchModal.emptyBody")}
							</Text>
						</View>
					}
					onRefresh={onApplyFilter}
					refreshing={loading}
					showsVerticalScrollIndicator={false}
					/>
			</Modal>
		</Portal>
	);
};

const styles = StyleSheet.create({
	actionButtonContent: {
		minHeight: 40,
	},
	modal: {
		borderRadius: 24,
		borderWidth: 1,
		margin: 20,
		maxHeight: "88%",
		padding: 20,
	},
	header: {
		alignItems: "flex-start",
		flexDirection: "row",
		gap: 12,
		justifyContent: "space-between",
		marginBottom: 16,
	},
	headerTextWrap: {
		flex: 1,
	},
	eyebrow: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		marginBottom: 4,
		textTransform: "uppercase",
	},
	title: {
		fontSize: 22,
		fontWeight: "700",
	},
	subtitle: {
		fontSize: 14,
		lineHeight: 20,
		marginTop: 6,
	},
	searchRow: {
		alignItems: "center",
		flexDirection: "row",
		gap: 12,
		marginBottom: 12,
	},
	searchbar: {
		flex: 1,
	},
	loader: {
		marginVertical: 12,
	},
	listContent: {
		paddingBottom: 8,
	},
	hiddenDivider: {
		opacity: 0,
	},
	resultCard: {
		borderRadius: 18,
		borderWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	resultActionsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 14,
	},
	resultTextWrap: {
		flex: 1,
	},
	resultTopRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	resultTitle: {
		fontSize: 16,
		fontWeight: "700",
		marginBottom: 4,
	},
	resultSubtitle: {
		fontSize: 14,
		marginBottom: 2,
	},
	resultMeta: {
		fontSize: 13,
	},
	emptyContainer: {
		flexGrow: 1,
	},
	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
		paddingVertical: 32,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 8,
	},
	emptySubtitle: {
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
	},
});
import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { openClientMessagePicker, openClientPhoneCall } from "../../utils/contactActions";
import { Picker } from "@react-native-picker/picker";
import { HelperText, TextInput } from "react-native-paper";
import { ClientAvatar } from "../ClientAvatar";
import { AvatarPicker } from "../AvatarPicker";
import { useTranslation } from "../../context/LanguageContext";
import type { Client } from "../../types/clients";
import {
	ClientFormErrors,
	ClientTouchedFields,
	PAYMENT_METHODS,
	getClientPaymentMethodLabel,
} from "../../features/clients/clientForm";

const COLORS = {
	bg: "#0D0D0D",
	surface: "#1A1A1A",
	surfaceElevated: "#252525",
	gold: "#C9A84C",
	goldLight: "#E5C878",
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
	border: "#3A3A3A",
	error: "#F87171",
} as const;

const PAPER_THEME = {
	colors: {
		primary: COLORS.gold,
		onSurfaceVariant: COLORS.textSecondary,
		background: COLORS.surfaceElevated,
		outline: COLORS.border,
		surface: COLORS.surfaceElevated,
		onSurface: COLORS.textPrimary,
		error: COLORS.error,
	},
} as const;

interface ClientFormProps {
	client: Client;
	errors: ClientFormErrors;
	touched: ClientTouchedFields;
	loading: boolean;
	onFieldChange: <K extends keyof Client>(key: K, value: Client[K]) => void;
	onFieldBlur: (key: keyof Client) => void;
	onOpenDatePicker: () => void;
	/** Called with the local file URI after the user picks/takes a photo */
	onPhotoChange?: (uri: string) => void;
}

const formatBirthday = (
	translateText: (key: string) => string,
	birthday?: string,
) => {
	if (!birthday) {
		return translateText("clients.form.selectDate");
	}

	return new Date(birthday).toLocaleDateString();
};

export const ClientForm: React.FC<ClientFormProps> = ({
	client,
	errors,
	touched,
	loading,
	onFieldChange,
	onFieldBlur,
	onOpenDatePicker,
	onPhotoChange,
}) => {
	const { translateText } = useTranslation();
	const isEditing = Boolean(client.id);
	const fullName = `${client.firstName} ${client.lastName}`.trim()
		|| translateText("clients.form.createTitleFallback");

	return (
		<View style={styles.container}>
			{/* ─── Hero card ─────────────────────────────────────────────── */}
			<View style={styles.card}>
				<View style={styles.heroRow}>
					{isEditing && onPhotoChange ? (
						<AvatarPicker
							variant="compact"
							size={92}
							uri={client.photoUrl}
							initials={fullName}
							loading={loading}
							onChangePhoto={onPhotoChange}
						/>
					) : (
						<ClientAvatar size={92} uri={client.photoUrl} initials={fullName} />
					)}

					<View style={styles.heroTextWrap}>
						<Text style={styles.eyebrow}>
							{isEditing
								? translateText("clients.form.editEyebrow")
								: translateText("clients.form.createEyebrow")}
						</Text>
						<Text style={styles.heroTitle}>
							{fullName}
						</Text>
						<Text style={styles.heroSubtitle}>
							{client.phone || translateText("clients.form.createSubtitle")}
						</Text>
						<View style={styles.statusRow}>
							<View
								style={[
									styles.statusPill,
									{ backgroundColor: client.active ? COLORS.gold : COLORS.border },
								]}
							>
								<Text style={[styles.statusPillText, { color: client.active ? COLORS.bg : COLORS.textSecondary }]}>
									{client.active
										? translateText("clients.form.statusActive")
										: translateText("clients.form.statusInactive")}
								</Text>
							</View>
							{client.id ? (
								<Text style={styles.helperLine}>{translateText("clients.form.editingExisting")}</Text>
							) : null}
						</View>
					</View>
				</View>
			</View>

			{/* ─── Contact ───────────────────────────────────────────── */}
		{isEditing ? (
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>
					{translateText("clients.form.contactTitle")}
				</Text>
				<Text style={styles.sectionSubtitle}>
					{translateText("clients.form.contactSubtitle")}
				</Text>

				<View style={styles.contactRow}>
					<Pressable
						style={({ pressed }) => [styles.contactBtn, pressed && styles.contactBtnPressed]}
						onPress={() => {
							const labels = {
								callUnavailableMessage: translateText("contactActions.callUnavailableMessage"),
								callUnavailableOpen: translateText("contactActions.callUnavailableOpen"),
								callUnavailableTitle: translateText("contactActions.callUnavailableTitle"),
								cancel: translateText("contactActions.cancel"),
								chooseContactMethod: translateText("contactActions.chooseContactMethod"),
								hello: translateText("contactActions.hello"),
								helloName: translateText("contactActions.helloName"),
								sendMessage: translateText("contactActions.sendMessage"),
								smsLabel: translateText("contactActions.smsLabel"),
								smsUnavailableMessage: translateText("contactActions.smsUnavailableMessage"),
								smsUnavailableOpen: translateText("contactActions.smsUnavailableOpen"),
								smsUnavailableTitle: translateText("contactActions.smsUnavailableTitle"),
								whatsappLabel: translateText("contactActions.whatsappLabel"),
								whatsappUnavailableMessage: translateText("contactActions.whatsappUnavailableMessage"),
								whatsappUnavailableOpen: translateText("contactActions.whatsappUnavailableOpen"),
								whatsappUnavailableTitle: translateText("contactActions.whatsappUnavailableTitle"),
							};
							void openClientPhoneCall(client.phone ?? "", labels);
						}}
					>
						<View style={styles.contactBtnInner}>
							<View style={[styles.contactIconWrap, styles.contactIconCall]}>
								<Ionicons name="call" size={20} color={COLORS.bg} />
							</View>
							<Text style={styles.contactBtnLabel}>
								{translateText("clients.form.callButton")}
							</Text>
						</View>
					</Pressable>

					<Pressable
						style={({ pressed }) => [styles.contactBtn, pressed && styles.contactBtnPressed]}
						onPress={() => {
							const labels = {
								callUnavailableMessage: translateText("contactActions.callUnavailableMessage"),
								callUnavailableOpen: translateText("contactActions.callUnavailableOpen"),
								callUnavailableTitle: translateText("contactActions.callUnavailableTitle"),
								cancel: translateText("contactActions.cancel"),
								chooseContactMethod: translateText("contactActions.chooseContactMethod"),
								hello: translateText("contactActions.hello"),
								helloName: translateText("contactActions.helloName"),
								sendMessage: translateText("contactActions.sendMessage"),
								smsLabel: translateText("contactActions.smsLabel"),
								smsUnavailableMessage: translateText("contactActions.smsUnavailableMessage"),
								smsUnavailableOpen: translateText("contactActions.smsUnavailableOpen"),
								smsUnavailableTitle: translateText("contactActions.smsUnavailableTitle"),
								whatsappLabel: translateText("contactActions.whatsappLabel"),
								whatsappUnavailableMessage: translateText("contactActions.whatsappUnavailableMessage"),
								whatsappUnavailableOpen: translateText("contactActions.whatsappUnavailableOpen"),
								whatsappUnavailableTitle: translateText("contactActions.whatsappUnavailableTitle"),
							};
							const clientName = `${client.firstName} ${client.lastName}`.trim();
							openClientMessagePicker(client.phone ?? "", labels, clientName || undefined);
						}}
					>
						<View style={styles.contactBtnInner}>
							<View style={[styles.contactIconWrap, styles.contactIconMessage]}>
								<Ionicons name="chatbubble" size={18} color={COLORS.gold} />
							</View>
							<Text style={styles.contactBtnLabel}>
								{translateText("clients.form.messageButton")}
							</Text>
						</View>
					</Pressable>
				</View>
			</View>
		) : null}

			{/* ─── Identity ──────────────────────────────────────────────── */}
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>
					{translateText("clients.form.identityTitle")}
				</Text>
				<Text style={styles.sectionSubtitle}>
					{translateText("clients.form.identitySubtitle")}
				</Text>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("clients.form.firstName")}
						value={client.firstName}
						onChangeText={(value) => onFieldChange("firstName", value)}
						onBlur={() => onFieldBlur("firstName")}
						error={Boolean(touched.firstName && errors.firstName)}
						mode="outlined"
						returnKeyType="next"
						disabled={loading}
						theme={PAPER_THEME as any}
					/>
					<HelperText type="error" visible={Boolean(touched.firstName && errors.firstName)}>
						{errors.firstName ? translateText(errors.firstName) : undefined}
					</HelperText>
				</View>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("clients.form.lastName")}
						value={client.lastName}
						onChangeText={(value) => onFieldChange("lastName", value)}
						onBlur={() => onFieldBlur("lastName")}
						error={Boolean(touched.lastName && errors.lastName)}
						mode="outlined"
						disabled={loading}
						theme={PAPER_THEME as any}
					/>
					<HelperText type="error" visible={Boolean(touched.lastName && errors.lastName)}>
						{errors.lastName ? translateText(errors.lastName) : undefined}
					</HelperText>
				</View>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("clients.form.phone")}
						value={client.phone}
						onChangeText={(value) => onFieldChange("phone", value)}
						onBlur={() => onFieldBlur("phone")}
						error={Boolean(touched.phone && errors.phone)}
						mode="outlined"
						keyboardType="phone-pad"
						placeholder="0000-0000"
						maxLength={9}
						disabled={loading}
						theme={PAPER_THEME as any}
					/>
					<HelperText type="error" visible={Boolean(touched.phone && errors.phone)}>
						{errors.phone ? translateText(errors.phone) : undefined}
					</HelperText>
				</View>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("clients.form.email")}
						value={client.email ?? ""}
						onChangeText={(value) => onFieldChange("email", value)}
						onBlur={() => onFieldBlur("email")}
						error={Boolean(touched.email && errors.email)}
						mode="outlined"
						keyboardType="email-address"
						autoCapitalize="none"
						disabled={loading}
						theme={PAPER_THEME as any}
					/>
					<HelperText type="error" visible={Boolean(touched.email && errors.email)}>
						{errors.email ? translateText(errors.email) : undefined}
					</HelperText>
				</View>
			</View>

			{/* ─── Profile details ───────────────────────────────────────── */}
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>
					{translateText("clients.form.profileDetailsTitle")}
				</Text>
				<Text style={styles.sectionSubtitle}>
					{translateText("clients.form.profileDetailsSubtitle")}
				</Text>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("clients.form.address")}
						value={client.address ?? ""}
						onChangeText={(value) => onFieldChange("address", value)}
						mode="outlined"
						disabled={loading}
						theme={PAPER_THEME as any}
					/>
				</View>

				<View style={styles.formGroup}>
					<Pressable
						onPress={onOpenDatePicker}
						style={styles.dateField}
						disabled={loading}
					>
						<Text style={styles.dateLabel}>
							{translateText("clients.form.birthday")}
						</Text>
						<Text style={styles.dateValue}>
							{formatBirthday(translateText, client.birthday)}
						</Text>
					</Pressable>
				</View>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("clients.form.preferences")}
						value={client.preferences ?? ""}
						onChangeText={(value) => onFieldChange("preferences", value)}
						mode="outlined"
						multiline
						numberOfLines={3}
						disabled={loading}
						theme={PAPER_THEME as any}
					/>
				</View>
			</View>

			{/* ─── Preferences ───────────────────────────────────────────── */}
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>
					{translateText("clients.form.preferencesTitle")}
				</Text>
				<Text style={styles.sectionSubtitle}>
					{translateText("clients.form.preferencesSubtitle")}
				</Text>

				<View style={styles.formGroup}>
					<Text style={styles.fieldLabel}>
						{translateText("clients.form.paymentMethod")}
					</Text>
					<View style={styles.pickerWrap}>
						<Picker
							selectedValue={client.paymentMethod}
							onValueChange={(value) => onFieldChange("paymentMethod", value as Client["paymentMethod"])}
							enabled={!loading}
							style={{ color: COLORS.textPrimary, backgroundColor: COLORS.surfaceElevated }}
							itemStyle={{ color: COLORS.textPrimary, backgroundColor: COLORS.surfaceElevated }}
							dropdownIconColor={COLORS.gold}
						>
							{PAYMENT_METHODS.map((paymentMethod) => (
								<Picker.Item
									key={paymentMethod}
									label={getClientPaymentMethodLabel(paymentMethod, translateText)}
									value={paymentMethod}
									color={COLORS.textPrimary}
									style={{ color: COLORS.textPrimary, backgroundColor: COLORS.surfaceElevated }}
								/>
							))}
						</Picker>
					</View>
				</View>

				<View style={styles.switchRow}>
					<View style={styles.switchTextWrap}>
						<Text style={styles.switchTitle}>
							{translateText("clients.form.activeTitle")}
						</Text>
						<Text style={styles.switchDescription}>
							{translateText("clients.form.activeDescription")}
						</Text>
					</View>
					<Switch
						value={Boolean(client.active)}
						onValueChange={(value) => onFieldChange("active", value)}
						disabled={loading}
						trackColor={{ false: COLORS.border, true: COLORS.gold }}
						thumbColor={client.active ? COLORS.goldLight : COLORS.textSecondary}
					/>
				</View>
			</View>
	</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: 16,
	},
	// ─── Card
	card: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.border,
		borderRadius: 20,
		borderWidth: 1,
		padding: 20,
	},
	heroRow: {
		alignItems: "center",
		flexDirection: "row",
		gap: 16,
	},
	heroTextWrap: {
		flex: 1,
		gap: 4,
	},
	eyebrow: {
		color: COLORS.gold,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
	},
	heroTitle: {
		color: COLORS.textPrimary,
		fontSize: 24,
		fontWeight: "700",
	},
	heroSubtitle: {
		color: COLORS.textSecondary,
		fontSize: 14,
		lineHeight: 20,
	},
	statusRow: {
		alignItems: "center",
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 8,
	},
	statusPill: {
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	statusPillText: {
		fontSize: 12,
		fontWeight: "700",
	},
	helperLine: {
		color: COLORS.textSecondary,
		fontSize: 12,
	},
	sectionTitle: {
		color: COLORS.textPrimary,
		fontSize: 20,
		fontWeight: "700",
		marginBottom: 4,
	},
	sectionSubtitle: {
		color: COLORS.textSecondary,
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 16,
	},
	formGroup: {
		marginBottom: 8,
	},
	dateField: {
		backgroundColor: COLORS.surfaceElevated,
		borderColor: COLORS.border,
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	dateLabel: {
		color: COLORS.textSecondary,
		fontSize: 12,
		fontWeight: "600",
		marginBottom: 6,
		textTransform: "uppercase",
	},
	dateValue: {
		color: COLORS.textPrimary,
		fontSize: 16,
		fontWeight: "500",
	},
	fieldLabel: {
		color: COLORS.textSecondary,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 0.5,
		marginBottom: 8,
		textTransform: "uppercase",
	},
	pickerWrap: {
		backgroundColor: COLORS.surfaceElevated,
		borderColor: COLORS.border,
		borderRadius: 12,
		borderWidth: 1,
		overflow: "hidden",
	},
	switchRow: {
		alignItems: "center",
		backgroundColor: COLORS.surfaceElevated,
		borderColor: COLORS.border,
		borderRadius: 16,
		borderWidth: 1,
		flexDirection: "row",
		gap: 16,
		marginTop: 8,
		paddingHorizontal: 16,
		paddingVertical: 16,
	},
	switchTextWrap: {
		flex: 1,
	},
	switchTitle: {
		color: COLORS.textPrimary,
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 4,
	},
	switchDescription: {
		color: COLORS.textSecondary,
		fontSize: 13,
		lineHeight: 18,
	},
	// ─── Contact
	contactRow: {
		flexDirection: "row",
		gap: 12,
	},
	contactBtn: {
		backgroundColor: COLORS.surfaceElevated,
		borderColor: COLORS.border,
		borderRadius: 16,
		borderWidth: 1,
		flex: 1,
		paddingVertical: 16,
	},
	contactBtnPressed: {
		opacity: 0.65,
	},
	contactBtnInner: {
		alignItems: "center",
		gap: 10,
	},
	contactIconWrap: {
		alignItems: "center",
		borderRadius: 999,
		height: 44,
		justifyContent: "center",
		width: 44,
	},
	contactIconCall: {
		backgroundColor: COLORS.gold,
	},
	contactIconMessage: {
		backgroundColor: "rgba(201,168,76,0.15)",
		borderColor: COLORS.gold,
		borderWidth: 1,
	},
	contactBtnLabel: {
		color: COLORS.textPrimary,
		fontSize: 14,
		fontWeight: "600",
	},
});
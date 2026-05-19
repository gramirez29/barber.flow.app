import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
	TextInput,
} from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";
import {
	APPOINTMENT_PAYMENT_METHOD_OPTIONS,
	AppointmentDraft,
	AppointmentStatus,
	getAppointmentPaymentMethodLabel,
} from "../../features/appointments/appointments.types";
import type { AppointmentFormErrors } from "../../features/appointments/useAppointmentForm";
import { useTranslation } from "../../context/LanguageContext";
import { formatPhoneNumber } from "../../utils/formatUtil";

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
	errorBg: "rgba(248,113,113,0.10)",
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

interface AppointmentFormProps {
	draft: AppointmentDraft;
	errors: AppointmentFormErrors;
	touched: Record<string, boolean>;
	isEditMode: boolean;
	onFieldChange: <K extends keyof AppointmentDraft>(
		key: K,
		value: AppointmentDraft[K],
	) => void;
	onFieldBlur: (key: keyof AppointmentDraft) => void;
	onSubmit: () => void;
	onCancel: () => void;
	isSaving?: boolean;
	onPaymentMethodTouched?: () => void;
	onOpenClientSearch?: () => void;
	onStatusChange?: (next: AppointmentStatus) => void;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
	draft,
	errors,
	touched,
	isEditMode,
	onFieldChange,
	onFieldBlur,
	onSubmit,
	onCancel,
	isSaving,
	onPaymentMethodTouched,
	onOpenClientSearch,
	onStatusChange,
}) => {
	const { translateText } = useTranslation();
	const [isTimePickerVisible, setTimePickerVisible] = useState(false);

	const handleTimeConfirm = (selectedTime: Date) => {
		onFieldChange("time", format(selectedTime, "HH:mm"));
		setTimePickerVisible(false);
	};

	return (
		<>
			<View style={styles.formGroup}>
				<Text style={styles.sectionLabel}>
					{translateText("calendar.appointmentModal.status")}
				</Text>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
			{(["scheduled", "confirmed", "completed", "cancelled"] as AppointmentStatus[]).map((s) => (
						<Pressable
							key={s}
							style={[styles.pill, (draft.status ?? "scheduled") === s && styles.pillActive]}
							onPress={() => onStatusChange ? onStatusChange(s) : onFieldChange("status", s)}
						>
							<Text style={[(draft.status ?? "scheduled") === s ? styles.pillTextActive : styles.pillText]}>
								{translateText(`calendar.appointmentModal.statuses.${s}`)}
							</Text>
						</Pressable>
					))}
				</ScrollView>
				{draft.status === "completed" && (
					<Text style={styles.helperInfo}>
						{translateText("calendar.appointmentModal.completedInfo")}
					</Text>
				)}
			</View>

			<View style={styles.formGroup}>
				<TextInput
					label={translateText("calendar.appointmentModal.clientName")}
					value={draft.clientName}
					onChangeText={(value) => onFieldChange("clientName", value)}
					onBlur={() => onFieldBlur("clientName")}
					error={Boolean(touched.clientName && errors.clientName)}
					mode="outlined"
					right={
						onOpenClientSearch ? (
							<TextInput.Icon
								icon="account-search-outline"
								onPress={onOpenClientSearch}
							/>
						) : undefined
					}
					theme={PAPER_THEME as any}
				/>
				{Boolean(touched.clientName && errors.clientName) && (
					<Text style={styles.helperError}>
						{errors.clientName ? translateText(errors.clientName) : undefined}
					</Text>
				)}
			</View>

			<View style={styles.formGroup}>
				<TextInput
					label={translateText("calendar.appointmentModal.phone")}
					value={draft.phone}
					onChangeText={(value) =>
						onFieldChange("phone", formatPhoneNumber(value))
					}
					onBlur={() => onFieldBlur("phone")}
					error={Boolean(touched.phone && errors.phone)}
					mode="outlined"
					keyboardType="phone-pad"
					placeholder="0000-0000"
					maxLength={9}
					theme={PAPER_THEME as any}
				/>
				{Boolean(touched.phone && errors.phone) && (
					<Text style={styles.helperError}>
						{errors.phone ? translateText(errors.phone) : undefined}
					</Text>
				)}
			</View>

			<View style={styles.formGroup}>
				<TextInput
					label={translateText("calendar.appointmentModal.service")}
					value={draft.serviceName ?? ""}
					onChangeText={(value) => onFieldChange("serviceName", value)}
					mode="outlined"
					placeholder={translateText(
						"calendar.appointmentModal.servicePlaceholder",
					)}
					theme={PAPER_THEME as any}
				/>
			</View>

			<View style={styles.formGroup}>
				<TextInput
					label={translateText("calendar.appointmentModal.servicePrice")}
					value={
						draft.servicePrice !== undefined ? String(draft.servicePrice) : ""
					}
					onChangeText={(value) => {
						const normalized = value.replace(/,/g, ".");
						onFieldChange(
						"servicePrice",
						normalized ? Number(normalized) : undefined,
						);
					}}
					onBlur={() => onFieldBlur("servicePrice")}
					error={Boolean(touched.servicePrice && errors.servicePrice)}
					mode="outlined"
					keyboardType="decimal-pad"
					placeholder="0.00"
					left={<TextInput.Affix text="CRC" />}
					theme={PAPER_THEME as any}
				/>
				{Boolean(touched.servicePrice && errors.servicePrice) && (
					<Text style={styles.helperError}>
						{errors.servicePrice ? translateText(errors.servicePrice) : undefined}
					</Text>
				)}
			</View>

			<View style={styles.formGroup}>
				<Text style={styles.sectionLabel}>
					{translateText("calendar.appointmentModal.paymentMethod")}
				</Text>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
					{APPOINTMENT_PAYMENT_METHOD_OPTIONS.map((option) => (
						<Pressable
							key={option}
							style={[styles.pill, draft.paymentMethodUsed === option && styles.pillActive]}
							onPress={() => {
								onFieldChange("paymentMethodUsed", option);
								onPaymentMethodTouched?.();
							}}
						>
							<Text style={[draft.paymentMethodUsed === option ? styles.pillTextActive : styles.pillText]}>
								{getAppointmentPaymentMethodLabel(option, translateText)}
							</Text>
						</Pressable>
					))}
				</ScrollView>
				{Boolean(touched.paymentMethodUsed && errors.paymentMethodUsed) && (
					<Text style={styles.helperError}>
						{errors.paymentMethodUsed ? translateText(errors.paymentMethodUsed) : undefined}
					</Text>
				)}
			</View>

			<View style={styles.formGroup}>
				<TextInput
					label={translateText("calendar.appointmentModal.time")}
					value={draft.time}
					onPressIn={() => setTimePickerVisible(true)}
					onBlur={() => onFieldBlur("time")}
					error={Boolean(touched.time && errors.time)}
					mode="outlined"
					placeholder="HH:mm"
					editable={false}
					right={
						<TextInput.Icon
						icon="clock-outline"
						onPress={() => setTimePickerVisible(true)}
						/>
					}
					theme={PAPER_THEME as any}
				/>
				{Boolean(touched.time && errors.time) && (
					<Text style={styles.helperError}>
						{errors.time ? translateText(errors.time) : undefined}
					</Text>
				)}
			</View>

			<View style={styles.formGroup}>
				<TextInput
					label={translateText("calendar.appointmentModal.notes")}
					value={draft.notes ?? ""}
					onChangeText={(value) => onFieldChange("notes", value)}
					mode="outlined"
					multiline
					numberOfLines={4}
					placeholder={translateText(
						"calendar.appointmentModal.notesPlaceholder",
					)}
					theme={PAPER_THEME as any}
				/>
			</View>

			<View style={styles.actions}>
				<Pressable
					style={({ pressed }) => [styles.goldBtn, pressed && !isSaving && styles.goldBtnPressed, isSaving && styles.goldBtnDisabled]}
					onPress={isSaving ? undefined : onSubmit}
					disabled={isSaving}
				>
					{isSaving ? (
						<ActivityIndicator size="small" color="#000" />
					) : (
						<Text style={styles.goldBtnText}>
							{isEditMode
								? translateText("calendar.appointmentModal.saveChanges")
								: translateText("calendar.appointmentModal.saveAppointment")}
						</Text>
					)}
				</Pressable>
				<Pressable
					style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
					onPress={onCancel}
				>
					<Text style={styles.cancelBtnText}>
						{translateText("calendar.appointmentModal.cancel")}
					</Text>
				</Pressable>
			</View>

			<DateTimePickerModal
				isVisible={isTimePickerVisible}
				mode="time"
				themeVariant="dark"
				accentColor="#C9A84C"
				onConfirm={handleTimeConfirm}
				onCancel={() => setTimePickerVisible(false)}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	formGroup: {
		marginBottom: 8,
	},
	sectionLabel: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1,
		marginBottom: 10,
		textTransform: "uppercase",
		color: COLORS.textSecondary,
	},
	pillRow: {
		flexDirection: "row",
		marginBottom: 4,
	},
	pill: {
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: COLORS.border,
		marginRight: 8,
		backgroundColor: COLORS.surfaceElevated,
	},
	pillActive: {
		backgroundColor: COLORS.gold,
		borderColor: COLORS.gold,
	},
	pillText: {
		color: COLORS.textSecondary,
		fontSize: 13,
		fontWeight: "500",
	},
	pillTextActive: {
		color: COLORS.bg,
		fontSize: 13,
		fontWeight: "700",
	},
	helperError: {
		color: COLORS.error,
		fontSize: 12,
		marginTop: 3,
		marginLeft: 4,
	},
	helperInfo: {
		color: COLORS.textSecondary,
		fontSize: 12,
		marginTop: 3,
		marginLeft: 4,
	},
	actions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 10,
		marginTop: 20,
	},
	goldBtn: {
		flex: 1,
		backgroundColor: COLORS.gold,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	goldBtnPressed: {
		backgroundColor: COLORS.goldLight,
	},
	goldBtnDisabled: {
		opacity: 0.6,
	},
	goldBtnText: {
		color: COLORS.bg,
		fontSize: 15,
		fontWeight: "700",
		letterSpacing: 0.4,
	},
	cancelBtn: {
		flex: 1,
		backgroundColor: "transparent",
		paddingVertical: 14,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: COLORS.border,
		alignItems: "center",
		justifyContent: "center",
	},
	cancelBtnPressed: {
		borderColor: COLORS.gold,
	},
	cancelBtnText: {
		color: COLORS.textSecondary,
		fontSize: 15,
		fontWeight: "600",
		letterSpacing: 0.4,
	},
});

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

import { AppTheme } from "../../theme/themes";
import { useAppTheme } from "../../theme/ThemeContext";

interface AppointmentFormProps {
	draft: AppointmentDraft;
	errors: AppointmentFormErrors;
	touched: Record<string, boolean>;
	isEditMode: boolean;
	readOnly?: boolean;
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
	readOnly = false,
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
	const { theme } = useAppTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const paperTheme = React.useMemo(
		() => ({
			...theme,
			colors: {
				...theme.colors,
				primary: theme.colors.accent,
				onSurfaceVariant: theme.colors.textSecondary,
				background: theme.colors.surfaceElevated,
				outline: theme.colors.border,
				surface: theme.colors.surfaceElevated,
				onSurface: theme.colors.textPrimary,
				error: theme.colors.error,
			},
		}),
		[theme],
	);

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
							style={[
								styles.pill,
								(draft.status ?? "scheduled") === s && styles.pillActive,
								readOnly && styles.pillDisabled,
							]}
							disabled={readOnly}
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
				{readOnly && (
					<Text style={styles.helperInfo}>
						{translateText("calendar.appointmentModal.readOnlyInfo")}
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
					editable={!readOnly}
					right={
						onOpenClientSearch && !readOnly ? (
							<TextInput.Icon
								icon="account-search-outline"
								onPress={onOpenClientSearch}
							/>
						) : undefined
					}
					theme={paperTheme as any}
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
					editable={!readOnly}
					theme={paperTheme as any}
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
					editable={!readOnly}
					theme={paperTheme as any}
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
					editable={!readOnly}
					theme={paperTheme as any}
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
							style={[
								styles.pill,
								draft.paymentMethodUsed === option && styles.pillActive,
								readOnly && styles.pillDisabled,
							]}
							disabled={readOnly}
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
					onPressIn={() => !readOnly && setTimePickerVisible(true)}
					onBlur={() => onFieldBlur("time")}
					error={Boolean(touched.time && errors.time)}
					mode="outlined"
					placeholder="HH:mm"
					editable={false}
					right={
						readOnly ? undefined : (
							<TextInput.Icon
							icon="clock-outline"
							onPress={() => setTimePickerVisible(true)}
							/>
						)
					}
					theme={paperTheme as any}
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
					editable={!readOnly}
					theme={paperTheme as any}
				/>
			</View>

			<View style={styles.actions}>
				{!readOnly && (
					<Pressable
						style={({ pressed }) => [styles.goldBtn, pressed && !isSaving && styles.goldBtnPressed, isSaving && styles.goldBtnDisabled]}
						onPress={isSaving ? undefined : onSubmit}
						disabled={isSaving}
					>
						{isSaving ? (
							<ActivityIndicator size="small" color={theme.colors.background} />
						) : (
							<Text style={styles.goldBtnText}>
								{isEditMode
									? translateText("calendar.appointmentModal.saveChanges")
									: translateText("calendar.appointmentModal.saveAppointment")}
							</Text>
						)}
					</Pressable>
				)}
				<Pressable
					style={({ pressed }) => [
						styles.cancelBtn,
						pressed && styles.cancelBtnPressed,
					]}
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
				accentColor={theme.colors.accent}
				onConfirm={handleTimeConfirm}
				onCancel={() => setTimePickerVisible(false)}
			/>
		</>
	);
};

const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
		formGroup: {
			marginBottom: 8,
		},
		sectionLabel: {
			fontSize: 11,
			fontWeight: "700",
			letterSpacing: 1,
			marginBottom: 10,
			textTransform: "uppercase",
			color: theme.colors.textSecondary,
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
			borderColor: theme.colors.border,
			marginRight: 8,
			backgroundColor: theme.colors.surfaceElevated,
		},
		pillActive: {
			backgroundColor: theme.colors.accent,
			borderColor: theme.colors.accent,
		},
		pillDisabled: {
			opacity: 0.5,
		},
		pillText: {
			color: theme.colors.textSecondary,
			fontSize: 13,
			fontWeight: "500",
		},
		pillTextActive: {
			color: theme.colors.background,
			fontSize: 13,
			fontWeight: "700",
		},
		helperError: {
			color: theme.colors.error,
			fontSize: 12,
			marginTop: 3,
			marginLeft: 4,
		},
		helperInfo: {
			color: theme.colors.textSecondary,
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
			backgroundColor: theme.colors.accent,
			paddingVertical: 14,
			borderRadius: 12,
			alignItems: "center",
			justifyContent: "center",
		},
		goldBtnPressed: {
			backgroundColor: theme.colors.accentLight,
		},
		goldBtnDisabled: {
			opacity: 0.6,
		},
		goldBtnText: {
			color: theme.colors.background,
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
			borderColor: theme.colors.border,
			alignItems: "center",
			justifyContent: "center",
		},
		cancelBtnPressed: {
			borderColor: theme.colors.accent,
		},
		cancelBtnText: {
			color: theme.colors.textSecondary,
			fontSize: 15,
			fontWeight: "600",
			letterSpacing: 0.4,
		},
	});

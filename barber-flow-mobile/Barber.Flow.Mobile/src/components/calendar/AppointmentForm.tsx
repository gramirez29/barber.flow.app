import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
	Button,
	HelperText,
	SegmentedButtons,
	Text,
	TextInput,
} from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";
import {
	APPOINTMENT_PAYMENT_METHOD_OPTIONS,
	AppointmentDraft,
	getAppointmentPaymentMethodLabel,
} from "../../features/appointments/appointments.types";
import type { AppointmentFormErrors } from "../../features/appointments/useAppointmentForm";
import { useTranslation } from "../../context/LanguageContext";
import { useAppTheme } from "../../theme/ThemeContext";
import { formatPhoneNumber } from "../../utils/formatUtil";

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
	onPaymentMethodTouched?: () => void;
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
	onPaymentMethodTouched,
}) => {
	const { theme } = useAppTheme();
	const { translateText } = useTranslation();
	const [isTimePickerVisible, setTimePickerVisible] = useState(false);

	const handleTimeConfirm = (selectedTime: Date) => {
		onFieldChange("time", format(selectedTime, "HH:mm"));
		setTimePickerVisible(false);
	};

	return (
		<>
			<View style={styles.formGroup}>
				<Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
					{translateText("calendar.appointmentModal.status")}
				</Text>
				<SegmentedButtons
					density="small"
					onValueChange={(value) =>
						onFieldChange("status", value as AppointmentDraft["status"])
					}
					value={draft.status ?? "scheduled"}
					buttons={[
						{
							label: translateText(
								"calendar.appointmentModal.statuses.scheduled",
							),
							value: "scheduled",
						},
						{
							label: translateText(
								"calendar.appointmentModal.statuses.confirmed",
							),
							value: "confirmed",
						},
						{
							label: translateText(
								"calendar.appointmentModal.statuses.completed",
							),
							value: "completed",
						},
						{
							label: translateText(
								"calendar.appointmentModal.statuses.cancelled",
							),
							value: "cancelled",
						},
					]}
				/>
				<HelperText type="info" visible={draft.status === "completed"}>
					{translateText("calendar.appointmentModal.completedInfo")}
				</HelperText>
			</View>

			<View style={styles.formGroup}>
				<TextInput
					label={translateText("calendar.appointmentModal.clientName")}
					value={draft.clientName}
					onChangeText={(value) => onFieldChange("clientName", value)}
					onBlur={() => onFieldBlur("clientName")}
					error={Boolean(touched.clientName && errors.clientName)}
					mode="outlined"
				/>
				<HelperText type="error" visible={Boolean(touched.clientName && errors.clientName)}>
					{errors.clientName ? translateText(errors.clientName) : undefined}
				</HelperText>
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
				/>
				<HelperText type="error" visible={Boolean(touched.phone && errors.phone)}>
					{errors.phone ? translateText(errors.phone) : undefined}
				</HelperText>
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
				/>
				<HelperText type="error" visible={Boolean(touched.servicePrice && errors.servicePrice)}>
					{errors.servicePrice ? translateText(errors.servicePrice) : undefined}
				</HelperText>
			</View>

			<View style={styles.formGroup}>
				<Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
					{translateText("calendar.appointmentModal.paymentMethod")}
				</Text>
				<SegmentedButtons
					density="small"
					onValueChange={(value) => {
						onFieldChange(
						"paymentMethodUsed",
						value as AppointmentDraft["paymentMethodUsed"],
						);
						onPaymentMethodTouched?.();
					}}
					value={draft.paymentMethodUsed ?? ""}
					buttons={APPOINTMENT_PAYMENT_METHOD_OPTIONS.map((option) => ({
						label: getAppointmentPaymentMethodLabel(option, translateText),
						value: option,
					}))}
				/>
				<HelperText type="info" visible={Boolean(draft.paymentMethodUsed)}>
					{draft.paymentMethodUsed
						? getAppointmentPaymentMethodLabel(
							draft.paymentMethodUsed,
							translateText,
						)
						: translateText(
							"calendar.appointmentModal.paymentMethodPlaceholder",
						)}
				</HelperText>
				<HelperText
					type="error"
					visible={Boolean(
						touched.paymentMethodUsed && errors.paymentMethodUsed,
					)}
					>
					{errors.paymentMethodUsed
						? translateText(errors.paymentMethodUsed)
						: undefined}
				</HelperText>
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
				/>
				<HelperText type="error" visible={Boolean(touched.time && errors.time)}>
					{errors.time ? translateText(errors.time) : undefined}
				</HelperText>
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
				/>
			</View>

			<View style={styles.actions}>
				<Button mode="contained" onPress={onSubmit}>
					{isEditMode
						? translateText("calendar.appointmentModal.saveChanges")
						: translateText("calendar.appointmentModal.saveAppointment")}
				</Button>
				<Button mode="contained" onPress={onCancel}>
					{translateText("calendar.appointmentModal.cancel")}
				</Button>
			</View>

			<DateTimePickerModal
				isVisible={isTimePickerVisible}
				mode="time"
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
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 0.8,
		marginBottom: 8,
		textTransform: "uppercase",
	},
	actions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 10,
		marginTop: 16,
	},
});

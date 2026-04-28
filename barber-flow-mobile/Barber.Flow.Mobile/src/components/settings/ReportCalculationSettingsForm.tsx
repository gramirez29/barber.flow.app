import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HelperText, TextInput } from "react-native-paper";
import type {
	ReportCalculationSettingErrors,
	ReportCalculationSettingTouched,
} from "../../features/settings/reportCalculationsForm";
import { useTranslation } from "../../context/LanguageContext";
import type { ReportCalculationSettings } from "../../types/settings";

interface ReportCalculationSettingsFormProps {
	errors: ReportCalculationSettingErrors;
	loading: boolean;
	onBlurField: (key: keyof ReportCalculationSettings) => void;
	onFieldChange: <K extends keyof ReportCalculationSettings>(
		key: K,
		value: ReportCalculationSettings[K],
	) => void;
	onReset: () => void;
	onSave: () => void;
	touched: ReportCalculationSettingTouched;
	values: ReportCalculationSettings;
}

const COLORS = {
	bg: "#0D0D0D",
	surface: "#1A1A1A",
	gold: "#C9A84C",
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
	border: "#3A3A3A",
} as const;

const PAPER_THEME = {
	colors: {
		background: COLORS.surface,
		onBackground: COLORS.textPrimary,
		onSurface: COLORS.textPrimary,
		onSurfaceVariant: COLORS.textSecondary,
		outline: COLORS.border,
		primary: COLORS.gold,
		surface: COLORS.surface,
		text: COLORS.textPrimary,
	},
};

export const ReportCalculationSettingsForm = ({
	errors,
	loading,
	onBlurField,
	onFieldChange,
	onReset,
	onSave,
	touched,
	values,
}: ReportCalculationSettingsFormProps) => {
	const { translateText } = useTranslation();

	return (
		<View style={styles.container}>
			<View style={styles.copyBlock}>
				<Text style={styles.title}>{translateText("settings.reportCalculationForm.title")}</Text>
				<Text style={styles.subtitle}>{translateText("settings.reportCalculationForm.subtitle")}</Text>
			</View>

			<View style={styles.formGroup}>
				<TextInput
					label={translateText("settings.reportCalculationForm.commissionPercentage")}
					value={String(values.commissionPercentage)}
					onChangeText={(value) =>
						onFieldChange(
						"commissionPercentage",
						value ? Number(value.replace(/,/g, ".")) : 0,
						)
					}
					onBlur={() => onBlurField("commissionPercentage")}
					error={Boolean(touched.commissionPercentage && errors.commissionPercentage)}
					mode="outlined"
					theme={PAPER_THEME as any}
					textColor={COLORS.textPrimary}
					keyboardType="decimal-pad"
					right={<TextInput.Affix text="%" />}
					disabled={loading}
				/>
				<HelperText type="error" visible={Boolean(touched.commissionPercentage && errors.commissionPercentage)}>
					{errors.commissionPercentage ? translateText(errors.commissionPercentage) : undefined}
				</HelperText>
			</View>

			<View style={styles.formGroup}>
				<TextInput
					label={translateText("settings.reportCalculationForm.fixedDailyExpense")}
					value={String(values.fixedDailyExpense)}
					onChangeText={(value) =>
						onFieldChange(
						"fixedDailyExpense",
						value ? Number(value.replace(/,/g, ".")) : 0,
						)
					}
					onBlur={() => onBlurField("fixedDailyExpense")}
					error={Boolean(touched.fixedDailyExpense && errors.fixedDailyExpense)}
					mode="outlined"
					theme={PAPER_THEME as any}
					textColor={COLORS.textPrimary}
					keyboardType="decimal-pad"
					left={<TextInput.Affix text="CRC" />}
					disabled={loading}
				/>
				<HelperText type="error" visible={Boolean(touched.fixedDailyExpense && errors.fixedDailyExpense)}>
					{errors.fixedDailyExpense ? translateText(errors.fixedDailyExpense) : undefined}
				</HelperText>
			</View>

			<View style={styles.actions}>
				<Pressable
					onPress={onReset}
					disabled={loading}
					style={({ pressed }) => [styles.btnSecondary, loading && styles.btnDisabled, pressed && { opacity: 0.8 }]}
				>
					<Text style={styles.btnSecondaryText}>{translateText("common.reset")}</Text>
				</Pressable>
				<Pressable
					onPress={onSave}
					disabled={loading}
					style={({ pressed }) => [styles.btnPrimary, loading && styles.btnDisabled, pressed && { opacity: 0.8 }]}
				>
					<Text style={styles.btnPrimaryText}>{translateText("common.save")}</Text>
				</Pressable>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 0,
		paddingTop: 0,
	},
	copyBlock: {
		marginBottom: 16,
	},
	title: {
		color: COLORS.textPrimary,
		fontSize: 16,
		fontWeight: "700",
		marginBottom: 4,
	},
	subtitle: {
		color: COLORS.textSecondary,
		fontSize: 14,
		lineHeight: 20,
	},
	formGroup: {
		marginBottom: 8,
	},
	actions: {
		flexDirection: "row",
		gap: 8,
		marginTop: 10,
	},
	btnPrimary: {
		alignItems: "center",
		backgroundColor: COLORS.gold,
		borderRadius: 12,
		flex: 1,
		justifyContent: "center",
		minHeight: 44,
		paddingHorizontal: 14,
	},
	btnPrimaryText: {
		color: COLORS.bg,
		fontSize: 14,
		fontWeight: "700",
	},
	btnSecondary: {
		alignItems: "center",
		backgroundColor: COLORS.surface,
		borderColor: COLORS.border,
		borderRadius: 12,
		borderWidth: 1,
		flex: 1,
		justifyContent: "center",
		minHeight: 44,
		paddingHorizontal: 14,
	},
	btnSecondaryText: {
		color: COLORS.textPrimary,
		fontSize: 14,
		fontWeight: "600",
	},
	btnDisabled: {
		opacity: 0.55,
	},
});

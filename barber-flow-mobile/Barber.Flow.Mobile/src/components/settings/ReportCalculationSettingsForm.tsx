import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import type {
	ReportCalculationSettingErrors,
	ReportCalculationSettingTouched,
} from "../../features/settings/reportCalculationsForm";
import { useTranslation } from "../../context/LanguageContext";
import { useAppTheme } from "../../theme/ThemeContext";
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
	const { theme } = useAppTheme();
	const { translateText } = useTranslation();

	return (
		<View style={styles.container}>
			<View style={styles.copyBlock}>
				<Text style={[styles.title, { color: theme.colors.textPrimary }]}>
					{translateText("settings.reportCalculationForm.title")}
				</Text>
				<Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
					{translateText("settings.reportCalculationForm.subtitle")}
				</Text>
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
					keyboardType="decimal-pad"
					left={<TextInput.Affix text="CRC" />}
					disabled={loading}
				/>
				<HelperText type="error" visible={Boolean(touched.fixedDailyExpense && errors.fixedDailyExpense)}>
					{errors.fixedDailyExpense ? translateText(errors.fixedDailyExpense) : undefined}
				</HelperText>
			</View>

			<View style={styles.actions}>
				<Button mode="outlined" onPress={onReset} disabled={loading}>
					{translateText("common.reset")}
				</Button>
				<Button mode="contained" onPress={onSave} disabled={loading}>
					{translateText("common.save")}
				</Button>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	copyBlock: {
		marginBottom: 16,
	},
	title: {
		fontSize: 16,
		fontWeight: "700",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		lineHeight: 20,
	},
	formGroup: {
		marginBottom: 8,
	},
	actions: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 12,
		marginBottom: 8,
	},
});
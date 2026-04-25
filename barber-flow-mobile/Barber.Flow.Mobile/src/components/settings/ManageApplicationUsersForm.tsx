import React from "react";
import { StyleSheet, View } from "react-native";
import {
	ActivityIndicator,
	Button,
	HelperText,
	Text,
	TextInput,
} from "react-native-paper";
import { FormCard } from "../ui/FormCard";
import { useAppTheme } from "../../theme/ThemeContext";
import { useTranslation } from "../../context/LanguageContext";
import type { ApplicationUserSettingsForm, BarberApiResponse } from "../../types/settings";
import type {
	ApplicationUserFormErrors,
	ApplicationUserFormTouched,
} from "../../features/settings/settingsForm";

interface ManageApplicationUsersFormProps {
	errors: ApplicationUserFormErrors;
	isFormValid: boolean;
	loading: boolean;
	mode: "create" | "edit";
	onBlurField: (key: keyof ApplicationUserSettingsForm) => void;
	onDelete: () => void;
	onFieldChange: <K extends keyof ApplicationUserSettingsForm>(
		key: K,
		value: ApplicationUserSettingsForm[K],
	) => void;
	onReset: () => void;
	onSearch: () => void;
	onSearchQueryChange: (value: string) => void;
	onSelectResult: (result: BarberApiResponse) => void;
	onSubmit: () => void;
	searchQuery: string;
	searchResults: BarberApiResponse[];
	touched: ApplicationUserFormTouched;
	values: ApplicationUserSettingsForm;
}

export const ManageApplicationUsersForm: React.FC<ManageApplicationUsersFormProps> = ({
	errors,
	isFormValid,
	loading,
	mode,
	onBlurField,
	onDelete,
	onFieldChange,
	onReset,
	onSearch,
	onSearchQueryChange,
	onSelectResult,
	onSubmit,
	searchQuery,
	searchResults,
	touched,
	values,
}) => {
	const { theme } = useAppTheme();
	const { translateText } = useTranslation();

	return (
		<View style={styles.container}>
			<FormCard>
				<Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>
					{translateText("settings.manageUsersForm.eyebrow")}
				</Text>
				<Text style={[styles.title, { color: theme.colors.textPrimary }]}>
					{translateText("settings.manageUsersForm.title")}
				</Text>
				<Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}> 
					{translateText("settings.manageUsersForm.subtitle")}
				</Text>

				<View style={styles.searchRow}>
					<TextInput
						label={translateText("settings.manageUsersForm.searchLabel")}
						value={searchQuery}
						onChangeText={onSearchQueryChange}
						mode="outlined"
						style={styles.searchInput}
						disabled={loading}
					/>
					<Button mode="contained" onPress={onSearch} loading={loading} disabled={loading}>
						{translateText("common.search")}
					</Button>
				</View>

				{loading ? <ActivityIndicator style={styles.loader} /> : null}

				{searchResults.length > 0 ? (
				<View style={styles.resultsWrap}>
					{searchResults.slice(0, 3).map((result) => (
					<Button
						key={result.id}
						mode="text"
						onPress={() => onSelectResult(result)}
						contentStyle={styles.resultButtonContent}
						style={styles.resultButton}
					>
						{`${result.id} • ${result.userName}`}
					</Button>
					))}
				</View>
				) : null}
			</FormCard>

			<FormCard>
				<Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
					{translateText("settings.manageUsersForm.userDataTitle")}
				</Text>
				<Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}> 
					{mode === "edit"
						? translateText("settings.manageUsersForm.editSubtitle")
						: translateText("settings.manageUsersForm.createSubtitle")}
				</Text>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("settings.manageUsersForm.barberId")}
						value={values.barberId ?? ""}
						mode="outlined"
						editable={false}
					/>
				</View>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("settings.manageUsersForm.name")}
						value={values.userName}
						onChangeText={(value) => onFieldChange("userName", value)}
						onBlur={() => onBlurField("userName")}
						error={Boolean(touched.userName && errors.userName)}
						mode="outlined"
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.userName && errors.userName)}>
						{errors.userName ? translateText(errors.userName) : undefined}
					</HelperText>
				</View>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("settings.manageUsersForm.phone")}
						value={values.userPhone}
						onChangeText={(value) => onFieldChange("userPhone", value)}
						onBlur={() => onBlurField("userPhone")}
						error={Boolean(touched.userPhone && errors.userPhone)}
						mode="outlined"
						keyboardType="phone-pad"
						placeholder="0000-0000"
						maxLength={9}
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.userPhone && errors.userPhone)}>
						{errors.userPhone ? translateText(errors.userPhone) : undefined}
					</HelperText>
				</View>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("settings.manageUsersForm.email")}
						value={values.userEmail}
						onChangeText={(value) => onFieldChange("userEmail", value)}
						onBlur={() => onBlurField("userEmail")}
						error={Boolean(touched.userEmail && errors.userEmail)}
						mode="outlined"
						keyboardType="email-address"
						autoCapitalize="none"
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.userEmail && errors.userEmail)}>
						{errors.userEmail ? translateText(errors.userEmail) : undefined}
				</HelperText>
				</View>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("settings.manageUsersForm.barberName")}
						value={values.barberName}
						onChangeText={(value) => onFieldChange("barberName", value)}
						onBlur={() => onBlurField("barberName")}
						error={Boolean(touched.barberName && errors.barberName)}
						mode="outlined"
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.barberName && errors.barberName)}>
						{errors.barberName ? translateText(errors.barberName) : undefined}
					</HelperText>
				</View>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("settings.manageUsersForm.barberPhone")}
						value={values.barberPhone}
						onChangeText={(value) => onFieldChange("barberPhone", value)}
						onBlur={() => onBlurField("barberPhone")}
						error={Boolean(touched.barberPhone && errors.barberPhone)}
						mode="outlined"
						keyboardType="phone-pad"
						placeholder="0000-0000"
						maxLength={9}
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.barberPhone && errors.barberPhone)}>
						{errors.barberPhone ? translateText(errors.barberPhone) : undefined}
					</HelperText>
				</View>

				<View style={styles.formGroup}>
					<TextInput
						label={translateText("settings.manageUsersForm.address")}
						value={values.address ?? ""}
						onChangeText={(value) => onFieldChange("address", value)}
						mode="outlined"
						disabled={loading}
					/>
				</View>

				<View style={styles.actions}>
					<Button
						mode="contained"
						onPress={onSubmit}
						disabled={!isFormValid || loading}
						loading={loading}
					>
						{mode === "edit"
						? translateText("settings.manageUsersForm.updateUser")
						: translateText("settings.manageUsersForm.createUser")}
					</Button>
					<Button mode="outlined" onPress={onReset} disabled={loading}>
						{translateText("common.reset")}
					</Button>
					<Button
						mode="text"
						onPress={onDelete}
						disabled={!values.barberId || mode !== "edit" || loading}
						textColor={mode === "edit" ? theme.colors.error : theme.colors.textSecondary}
					>
						{translateText("common.delete")}
					</Button>
				</View>
			</FormCard>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		gap: 16,
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
		marginTop: 8,
	},
	searchRow: {
		alignItems: "center",
		flexDirection: "row",
		gap: 12,
		marginTop: 16,
	},
	searchInput: {
		flex: 1,
	},
	loader: {
		marginTop: 12,
	},
	resultsWrap: {
		marginTop: 12,
	},
	resultButton: {
		alignItems: "flex-start",
	},
	resultButtonContent: {
		justifyContent: "flex-start",
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "700",
		marginBottom: 4,
	},
	sectionSubtitle: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 16,
	},
	formGroup: {
		marginBottom: 8,
	},
	actions: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 16,
	},
});
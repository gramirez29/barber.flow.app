import React, { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { AvatarPicker } from "../AvatarPicker";
import { HelperText, TextInput } from "react-native-paper";
import { useTranslation } from "../../context/LanguageContext";
import type { ApplicationUserSettingsForm, BarberApiResponse } from "../../types/settings";
import type {
	ApplicationUserFormErrors,
	ApplicationUserFormTouched,
} from "../../features/settings/settingsForm";

import { AppTheme } from "../../theme/themes";
import { useAppTheme } from "../../theme/ThemeContext";

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
	const { translateText } = useTranslation();
	const { theme } = useAppTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const paperTheme = React.useMemo(
		() => ({
			...theme,
			colors: {
				...theme.colors,
				primary: theme.colors.accent,
				outline: theme.colors.border,
				surface: theme.colors.surface,
				onSurfaceVariant: theme.colors.textSecondary,
			},
		}),
		[theme],
	);

	const { width } = useWindowDimensions();
	const isCompact = width < 380;
	const isUltraCompact = width <= 360;
	const [showPassword, setShowPassword] = useState(false);

	return (
		<View style={[styles.container, isCompact && styles.containerCompact, isUltraCompact && styles.containerUltraCompact]}>
			<View style={[styles.card, isCompact && styles.cardCompact, isUltraCompact && styles.cardUltraCompact]}>
				<Text style={[styles.eyebrow, isUltraCompact && styles.eyebrowUltraCompact]}>{translateText("settings.manageUsersForm.eyebrow")}</Text>
				<Text style={[styles.title, isCompact && styles.titleCompact, isUltraCompact && styles.titleUltraCompact]}>{translateText("settings.manageUsersForm.title")}</Text>
				<Text style={[styles.subtitle, isUltraCompact && styles.subtitleUltraCompact]}>{translateText("settings.manageUsersForm.subtitle")}</Text>

				<View style={styles.searchRow}>
					<TextInput
						label={translateText("settings.manageUsersForm.searchLabel")}
						value={searchQuery}
						onChangeText={onSearchQueryChange}
						mode="outlined"
						theme={paperTheme as any}
						textColor={theme.colors.textPrimary}
						style={styles.searchInput}
						disabled={loading}
					/>
					<Pressable
						onPress={onSearch}
						disabled={loading}
						style={({ pressed }) => [
							styles.btnPrimary,
							loading && styles.btnDisabled,
							pressed && { opacity: 0.8 },
						]}
					>
						<Text style={styles.btnPrimaryText}>{translateText("common.search")}</Text>
					</Pressable>
				</View>

				{loading ? <ActivityIndicator style={styles.loader} /> : null}

				{searchResults.length > 0 ? (
					<View style={styles.resultsWrap}>
						{searchResults.slice(0, 3).map((result) => (
							<Pressable
								key={result.id}
								onPress={() => onSelectResult(result)}
								style={({ pressed }) => [styles.resultButton, pressed && { opacity: 0.82 }]}
							>
								<Text style={styles.resultButtonText}>{`${result.id} - ${result.barberName}`}</Text>
							</Pressable>
						))}
					</View>
				) : null}
			</View>

			<View style={[styles.card, isCompact && styles.cardCompact, isUltraCompact && styles.cardUltraCompact]}>
				<Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact, isUltraCompact && styles.sectionTitleUltraCompact]}>{translateText("settings.manageUsersForm.userDataTitle")}</Text>
				<Text style={[styles.sectionSubtitle, isUltraCompact && styles.sectionSubtitleUltraCompact]}>
					{mode === "edit"
						? translateText("settings.manageUsersForm.editSubtitle")
						: translateText("settings.manageUsersForm.createSubtitle")}
				</Text>

				<Text style={[styles.sectionLabel, isUltraCompact && styles.sectionLabelUltraCompact]}>{translateText("settings.manageUsersForm.barberProfileSection")}</Text>

				<View style={[styles.formGroup, isUltraCompact && styles.formGroupUltraCompact]}>
					<TextInput
						label={translateText("settings.manageUsersForm.barberId")}
						value={values.barberId ?? ""}
						mode="outlined"
						theme={paperTheme as any}
						editable={false}
					/>
				</View>

				<View style={[styles.formGroup, isUltraCompact && styles.formGroupUltraCompact]}>
					<TextInput
						label={translateText("settings.manageUsersForm.barberName")}
						value={values.barberName}
						onChangeText={(value) => onFieldChange("barberName", value)}
						onBlur={() => onBlurField("barberName")}
						error={Boolean(touched.barberName && errors.barberName)}
						mode="outlined"
						theme={paperTheme as any}
						textColor={theme.colors.textPrimary}
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.barberName && errors.barberName)}>
						{errors.barberName ? translateText(errors.barberName) : undefined}
					</HelperText>
				</View>

				<View style={[styles.formGroup, isUltraCompact && styles.formGroupUltraCompact]}>
					<TextInput
						label={translateText("settings.manageUsersForm.barberPhone")}
						value={values.barberPhone}
						onChangeText={(value) => onFieldChange("barberPhone", value)}
						onBlur={() => onBlurField("barberPhone")}
						error={Boolean(touched.barberPhone && errors.barberPhone)}
						mode="outlined"
						theme={paperTheme as any}
						textColor={theme.colors.textPrimary}
						keyboardType="phone-pad"
						placeholder="0000-0000"
						maxLength={9}
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.barberPhone && errors.barberPhone)}>
						{errors.barberPhone ? translateText(errors.barberPhone) : undefined}
					</HelperText>
				</View>

				<View style={[styles.formGroup, isUltraCompact && styles.formGroupUltraCompact]}>
					<TextInput
						label={translateText("settings.manageUsersForm.email")}
						value={values.userEmail}
						onChangeText={(value) => onFieldChange("userEmail", value)}
						onBlur={() => onBlurField("userEmail")}
						error={Boolean(touched.userEmail && errors.userEmail)}
						mode="outlined"
						theme={paperTheme as any}
						textColor={theme.colors.textPrimary}
						keyboardType="email-address"
						autoCapitalize="none"
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.userEmail && errors.userEmail)}>
						{errors.userEmail ? translateText(errors.userEmail) : undefined}
					</HelperText>
				</View>

				<Text style={[styles.sectionLabel, isUltraCompact && styles.sectionLabelUltraCompact]}>{translateText("settings.manageUsersForm.barberShopSection")}</Text>

				<View style={[styles.formGroup, isUltraCompact && styles.formGroupUltraCompact]}>
					<TextInput
						label={translateText("settings.manageUsersForm.shopName")}
						value={values.shopName ?? ""}
						onChangeText={(value) => onFieldChange("shopName", value)}
						onBlur={() => onBlurField("shopName")}
						error={Boolean(touched.shopName && errors.shopName)}
						mode="outlined"
						theme={paperTheme as any}
						textColor={theme.colors.textPrimary}
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.shopName && errors.shopName)}>
						{errors.shopName ? translateText(errors.shopName) : undefined}
					</HelperText>
				</View>

				<View style={[styles.formGroup, isUltraCompact && styles.formGroupUltraCompact]}>
					<TextInput
						label={translateText("settings.manageUsersForm.shopPhone")}
						value={values.shopPhone ?? ""}
						onChangeText={(value) => onFieldChange("shopPhone", value)}
						onBlur={() => onBlurField("shopPhone")}
						error={Boolean(touched.shopPhone && errors.shopPhone)}
						mode="outlined"
						theme={paperTheme as any}
						textColor={theme.colors.textPrimary}
						keyboardType="phone-pad"
						placeholder="0000-0000"
						maxLength={9}
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.shopPhone && errors.shopPhone)}>
						{errors.shopPhone ? translateText(errors.shopPhone) : undefined}
					</HelperText>
				</View>

				<View style={[styles.formGroup, isUltraCompact && styles.formGroupUltraCompact]}>
					<TextInput
						label={translateText("settings.manageUsersForm.address")}
						value={values.address ?? ""}
						onChangeText={(value) => onFieldChange("address", value)}
						onBlur={() => onBlurField("address")}
						error={Boolean(touched.address && errors.address)}
						mode="outlined"
						theme={paperTheme as any}
						textColor={theme.colors.textPrimary}
						multiline
						numberOfLines={3}
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.address && errors.address)}>
						{errors.address ? translateText(errors.address) : undefined}
					</HelperText>
				</View>

				<Text style={[styles.sectionLabel, isUltraCompact && styles.sectionLabelUltraCompact]}>{translateText("settings.manageUsersForm.accessSection")}</Text>

				<View style={[styles.formGroup, isUltraCompact && styles.formGroupUltraCompact]}>
					<TextInput
						label={translateText("settings.manageUsersForm.username")}
						value={values.userName}
						onChangeText={(value) => onFieldChange("userName", value)}
						onBlur={() => onBlurField("userName")}
						error={Boolean(touched.userName && errors.userName)}
						mode="outlined"
						theme={paperTheme as any}
						textColor={theme.colors.textPrimary}
						autoCapitalize="none"
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.userName && errors.userName)}>
						{errors.userName ? translateText(errors.userName) : undefined}
					</HelperText>
				</View>

				<View style={[styles.formGroup, isUltraCompact && styles.formGroupUltraCompact]}>
					<TextInput
						label={translateText("settings.manageUsersForm.password")}
						value={values.password ?? ""}
						onChangeText={(value) => onFieldChange("password", value)}
						onBlur={() => onBlurField("password")}
						error={Boolean(touched.password && errors.password)}
						mode="outlined"
						theme={paperTheme as any}
						textColor={theme.colors.textPrimary}
						secureTextEntry={!showPassword}
						disabled={loading}
						right={
							<TextInput.Icon
								icon={showPassword ? "eye-off" : "eye"}
								onPress={() => setShowPassword((v) => !v)}
								color={showPassword ? theme.colors.accent : theme.colors.textSecondary}
							/>
						}
					/>
					<HelperText type="error" visible={Boolean(touched.password && errors.password)}>
						{errors.password ? translateText(errors.password) : undefined}
					</HelperText>
				</View>

				<View style={styles.photoCard}>
					<Text style={styles.photoTitle}>{translateText("settings.manageUsersForm.photoTitle")}</Text>
					<AvatarPicker
						variant="full"
						uri={values.profilePhotoUrl ?? undefined}
						size={88}
						loading={loading}
						onChangePhoto={(photoUri) => onFieldChange("profilePhotoUrl", photoUri)}
					/>
				</View>

				<View style={styles.actions}>
					<Pressable
						onPress={onSubmit}
						disabled={!isFormValid || loading}
						style={({ pressed }) => [
							styles.btnPrimary,
							(!isFormValid || loading) && styles.btnDisabled,
							pressed && { opacity: 0.8 },
						]}
					>
						{loading ? (
							<ActivityIndicator color={theme.colors.background} size="small" />
						) : (
							<Text style={styles.btnPrimaryText}>
								{mode === "edit"
									? translateText("settings.manageUsersForm.updateUser")
									: translateText("settings.manageUsersForm.createUser")}
							</Text>
						)}
					</Pressable>
					<Pressable
						onPress={onReset}
						disabled={loading}
						style={({ pressed }) => [
							styles.btnSecondary,
							loading && styles.btnDisabled,
							pressed && { opacity: 0.8 },
						]}
					>
						<Text style={styles.btnSecondaryText}>{translateText("common.reset")}</Text>
					</Pressable>
					<Pressable
						onPress={onDelete}
						disabled={!values.barberId || mode !== "edit" || loading}
						style={({ pressed }) => [
							styles.btnDangerGhost,
							(!values.barberId || mode !== "edit" || loading) && styles.btnDisabled,
							pressed && { opacity: 0.8 },
						]}
					>
						<Text style={styles.btnDangerText}>{translateText("common.delete")}</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
};

const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
		container: {
			gap: 16,
			paddingHorizontal: 16,
		},
		containerCompact: {
			paddingHorizontal: 12,
		},
		containerUltraCompact: {
			gap: 12,
			paddingHorizontal: 8,
		},
		card: {
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderRadius: 20,
			borderWidth: 1,
			paddingHorizontal: 16,
			paddingVertical: 16,
		},
		cardCompact: {
			borderRadius: 16,
			paddingHorizontal: 12,
			paddingVertical: 12,
		},
		cardUltraCompact: {
			borderRadius: 14,
			paddingHorizontal: 10,
			paddingVertical: 10,
		},
		eyebrow: {
			color: theme.colors.accent,
			fontSize: 12,
			fontWeight: "700",
			letterSpacing: 1,
			marginBottom: 4,
			textTransform: "uppercase",
		},
		eyebrowUltraCompact: {
			fontSize: 10,
			marginBottom: 2,
		},
		title: {
			color: theme.colors.textPrimary,
			fontSize: 22,
			fontWeight: "700",
		},
		titleCompact: {
			fontSize: 20,
		},
		titleUltraCompact: {
			fontSize: 17,
		},
		subtitle: {
			color: theme.colors.textSecondary,
			fontSize: 14,
			lineHeight: 20,
			marginTop: 8,
		},
		subtitleUltraCompact: {
			fontSize: 12,
			lineHeight: 17,
			marginTop: 4,
		},
		searchRow: {
			alignItems: "stretch",
			flexDirection: "column",
			gap: 12,
			marginTop: 16,
		},
		searchInput: {
			backgroundColor: theme.colors.surface,
		},
		loader: {
			marginTop: 12,
		},
		resultsWrap: {
			gap: 8,
			marginTop: 12,
		},
		resultButton: {
			backgroundColor: theme.colors.surfaceElevated,
			borderColor: theme.colors.border,
			borderRadius: 10,
			borderWidth: 1,
			paddingHorizontal: 12,
			paddingVertical: 10,
		},
		resultButtonText: {
			color: theme.colors.textPrimary,
			fontSize: 14,
			fontWeight: "600",
		},
		sectionTitle: {
			color: theme.colors.textPrimary,
			fontSize: 20,
			fontWeight: "700",
			marginBottom: 4,
		},
		sectionTitleCompact: {
			fontSize: 18,
		},
		sectionTitleUltraCompact: {
			fontSize: 15,
		},
		sectionSubtitle: {
			color: theme.colors.textSecondary,
			fontSize: 14,
			lineHeight: 20,
			marginBottom: 16,
		},
		sectionSubtitleUltraCompact: {
			fontSize: 12,
			lineHeight: 17,
			marginBottom: 10,
		},
		sectionLabel: {
			color: theme.colors.accent,
			fontSize: 12,
			fontWeight: "700",
			letterSpacing: 0.8,
			marginBottom: 10,
			marginTop: 4,
			textTransform: "uppercase",
		},
		sectionLabelUltraCompact: {
			fontSize: 10,
			marginBottom: 6,
			marginTop: 2,
		},
		formGroup: {
			marginBottom: 8,
		},
		formGroupUltraCompact: {
			marginBottom: 2,
		},
		photoCard: {
			backgroundColor: theme.colors.surfaceElevated,
			borderColor: theme.colors.border,
			borderRadius: 12,
			borderWidth: 1,
			marginTop: 8,
			paddingHorizontal: 12,
			paddingVertical: 12,
		},
		photoTitle: {
			color: theme.colors.textPrimary,
			fontSize: 14,
			fontWeight: "600",
			marginBottom: 10,
		},
		actions: {
			flexDirection: "column",
			gap: 8,
			marginTop: 16,
		},
		btnPrimary: {
			alignItems: "center",
			backgroundColor: theme.colors.accent,
			borderRadius: 12,
			justifyContent: "center",
			minHeight: 46,
			paddingHorizontal: 14,
		},
		btnDisabled: {
			opacity: 0.4,
		},
		btnPrimaryText: {
			color: theme.colors.background,
			fontSize: 15,
			fontWeight: "700",
		},
		btnSecondary: {
			alignItems: "center",
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderRadius: 12,
			borderWidth: 1,
			flex: 1,
			justifyContent: "center",
			minHeight: 42,
			paddingHorizontal: 12,
		},
		btnSecondaryText: {
			color: theme.colors.textPrimary,
			fontSize: 14,
			fontWeight: "600",
		},
		btnDangerGhost: {
			alignItems: "center",
			borderColor: theme.colors.error,
			borderRadius: 12,
			borderWidth: 1,
			justifyContent: "center",
			minHeight: 42,
		},
		btnDangerText: {
			color: theme.colors.error,
			fontSize: 14,
			fontWeight: "600",
		},
	});

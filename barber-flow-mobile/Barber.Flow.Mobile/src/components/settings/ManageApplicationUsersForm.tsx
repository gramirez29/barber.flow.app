import React from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { HelperText, TextInput } from "react-native-paper";
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

const COLORS = {
	bg: "#0D0D0D",
	surface: "#1A1A1A",
	surfaceElevated: "#252525",
	gold: "#C9A84C",
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
	border: "#3A3A3A",
	error: "#E57373",
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
	const { width } = useWindowDimensions();
	const isCompact = width < 380;
	const isUltraCompact = width <= 360;

	const handlePickFromGallery = async () => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permission.granted) {
			Alert.alert(
				translateText("common.open"),
				translateText("settings.manageUsersForm.galleryPermissionRequired"),
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			allowsEditing: true,
			aspect: [1, 1],
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.85,
		});

		if (!result.canceled && result.assets.length > 0) {
			onFieldChange("profilePhotoUrl", result.assets[0].uri);
		}
	};

	const handleTakePhoto = async () => {
		const permission = await ImagePicker.requestCameraPermissionsAsync();

		if (!permission.granted) {
			Alert.alert(
				translateText("common.open"),
				translateText("settings.manageUsersForm.cameraPermissionRequired"),
			);
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [1, 1],
			cameraType: ImagePicker.CameraType.front,
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.85,
		});

		if (!result.canceled && result.assets.length > 0) {
			onFieldChange("profilePhotoUrl", result.assets[0].uri);
		}
	};

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
						theme={PAPER_THEME as any}
						textColor={COLORS.textPrimary}
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
						theme={PAPER_THEME as any}
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
						theme={PAPER_THEME as any}
						textColor={COLORS.textPrimary}
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
						theme={PAPER_THEME as any}
						textColor={COLORS.textPrimary}
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
						theme={PAPER_THEME as any}
						textColor={COLORS.textPrimary}
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
						theme={PAPER_THEME as any}
						textColor={COLORS.textPrimary}
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
						theme={PAPER_THEME as any}
						textColor={COLORS.textPrimary}
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
						theme={PAPER_THEME as any}
						textColor={COLORS.textPrimary}
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
						theme={PAPER_THEME as any}
						textColor={COLORS.textPrimary}
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
						theme={PAPER_THEME as any}
						textColor={COLORS.textPrimary}
						secureTextEntry
						disabled={loading}
					/>
					<HelperText type="error" visible={Boolean(touched.password && errors.password)}>
						{errors.password ? translateText(errors.password) : undefined}
					</HelperText>
				</View>

				<View style={styles.photoCard}>
					<Text style={styles.photoTitle}>{translateText("settings.manageUsersForm.photoTitle")}</Text>
					<Image
						source={
							values.profilePhotoUrl
								? { uri: values.profilePhotoUrl }
								: require("../../../assets/images/no-image.jpg")
						}
						style={styles.photoPreview}
					/>
					<View style={[styles.photoActions, isCompact && styles.photoActionsCompact]}>
						<Pressable
							onPress={() => void handleTakePhoto()}
							style={({ pressed }) => [styles.photoBtnPrimary, isCompact && styles.photoBtnCompact, pressed && { opacity: 0.8 }]}
						>
							<Text style={styles.photoBtnPrimaryText}>{translateText("settings.manageUsersForm.takePhoto")}</Text>
						</Pressable>
						<Pressable
							onPress={() => void handlePickFromGallery()}
							style={({ pressed }) => [styles.photoBtnSecondary, isCompact && styles.photoBtnCompact, pressed && { opacity: 0.8 }]}
						>
							<Text style={styles.photoBtnSecondaryText}>{translateText("settings.manageUsersForm.uploadPhoto")}</Text>
						</Pressable>
					</View>
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
						<Text style={styles.btnPrimaryText}>
							{mode === "edit"
								? translateText("settings.manageUsersForm.updateUser")
								: translateText("settings.manageUsersForm.createUser")}
						</Text>
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

const styles = StyleSheet.create({
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
		backgroundColor: COLORS.surface,
		borderColor: COLORS.border,
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
		color: COLORS.gold,
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
		color: COLORS.textPrimary,
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
		color: COLORS.textSecondary,
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
		backgroundColor: COLORS.surface,
	},
	loader: {
		marginTop: 12,
	},
	resultsWrap: {
		gap: 8,
		marginTop: 12,
	},
	resultButton: {
		backgroundColor: COLORS.surfaceElevated,
		borderColor: COLORS.border,
		borderRadius: 10,
		borderWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	resultButtonText: {
		color: COLORS.textPrimary,
		fontSize: 14,
		fontWeight: "600",
	},
	sectionTitle: {
		color: COLORS.textPrimary,
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
		color: COLORS.textSecondary,
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
		color: COLORS.gold,
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
		backgroundColor: COLORS.surfaceElevated,
		borderColor: COLORS.border,
		borderRadius: 12,
		borderWidth: 1,
		marginTop: 8,
		paddingHorizontal: 12,
		paddingVertical: 12,
	},
	photoTitle: {
		color: COLORS.textPrimary,
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 10,
	},
	photoPreview: {
		alignSelf: "center",
		backgroundColor: COLORS.bg,
		borderRadius: 44,
		height: 88,
		marginBottom: 12,
		width: 88,
	},
	photoActions: {
		flexDirection: "row",
		gap: 8,
		marginTop: 2,
	},
	photoActionsCompact: {
		flexDirection: "column",
	},
	photoBtnPrimary: {
		alignItems: "center",
		backgroundColor: COLORS.gold,
		borderRadius: 12,
		flex: 1,
		justifyContent: "center",
		minHeight: 42,
		paddingHorizontal: 12,
	},
	photoBtnPrimaryText: {
		color: COLORS.bg,
		fontSize: 14,
		fontWeight: "700",
	},
	photoBtnSecondary: {
		alignItems: "center",
		backgroundColor: COLORS.surface,
		borderColor: COLORS.border,
		borderRadius: 12,
		borderWidth: 1,
		flex: 1,
		justifyContent: "center",
		minHeight: 42,
		paddingHorizontal: 12,
	},
	photoBtnSecondaryText: {
		color: COLORS.textPrimary,
		fontSize: 14,
		fontWeight: "600",
	},
	photoBtnCompact: {
		flex: 0,
	},
	actions: {
		flexDirection: "column",
		gap: 8,
		marginTop: 16,
	},
	btnPrimary: {
		alignItems: "center",
		backgroundColor: COLORS.gold,
		borderRadius: 12,
		justifyContent: "center",
		minHeight: 46,
		paddingHorizontal: 14,
	},
	btnPrimaryText: {
		color: COLORS.bg,
		fontSize: 15,
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
		minHeight: 42,
		paddingHorizontal: 12,
	},
	btnSecondaryText: {
		color: COLORS.textPrimary,
		fontSize: 14,
		fontWeight: "600",
	},
	btnDangerGhost: {
		alignItems: "center",
		borderColor: COLORS.error,
		borderRadius: 12,
		borderWidth: 1,
		justifyContent: "center",
		minHeight: 42,
	},
	btnDangerText: {
		color: COLORS.error,
		fontSize: 14,
		fontWeight: "600",
	},
	btnDisabled: {
		opacity: 0.5,
	},
});

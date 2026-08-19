import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ManageApplicationUsersForm } from "./ManageApplicationUsersForm";
import { useTranslation } from "../../context/LanguageContext";
import type { ApplicationUserSettingsForm, BarberApiResponse } from "../../types/settings";
import { AppTheme } from "../../theme/themes";
import { useAppTheme } from "../../theme/ThemeContext";
import type {
	ApplicationUserFormErrors,
	ApplicationUserFormTouched,
} from "../../features/settings/settingsForm";

interface ApplicationUsersModalProps {
	errors: ApplicationUserFormErrors;
	isFormValid: boolean;
	loading: boolean;
	mode: "create" | "edit";
	onBlurField: (key: keyof ApplicationUserSettingsForm) => void;
	onClose: () => void;
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
	onToggleBlocked: () => void;
	searchQuery: string;
	searchResults: BarberApiResponse[];
	selectedIsBlocked: boolean;
	selectedUserId: string | null;
	touched: ApplicationUserFormTouched;
	values: ApplicationUserSettingsForm;
	visible: boolean;
}

export const ApplicationUsersModal: React.FC<ApplicationUsersModalProps> = ({
	errors,
	isFormValid,
	loading,
	mode,
	onBlurField,
	onClose,
	onDelete,
	onFieldChange,
	onReset,
	onSearch,
	onSearchQueryChange,
	onSelectResult,
	onSubmit,
	onToggleBlocked,
	searchQuery,
	searchResults,
	selectedIsBlocked,
	selectedUserId,
	touched,
	values,
	visible,
}) => {
	const { translateText } = useTranslation();
	const { theme } = useAppTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const { width } = useWindowDimensions();
	const isCompact = width < 380;
	const isUltraCompact = width <= 360;

	return (
		<Modal
			animationType="slide"
			presentationStyle={Platform.OS === "ios" ? "pageSheet" : undefined}
			transparent
			visible={visible}
			onRequestClose={onClose}
		>
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.backdrop}>
					<View style={[styles.modalCard, isCompact && styles.modalCardCompact, isUltraCompact && styles.modalCardUltraCompact]}>
						<View style={styles.header}>
							<Text style={[styles.headerTitle, isUltraCompact && styles.headerTitleUltraCompact]}>{translateText("settings.manageUsersForm.title")}</Text>
							{/* <Pressable
								onPress={onClose}
								style={({ pressed }) => [styles.headerClose, pressed && { opacity: 0.75 }]}
							>
								<Text style={styles.headerCloseText}>{translateText("common.close")}</Text>
							</Pressable> */}
						</View>
						<KeyboardAwareScrollView
							style={styles.flex}
							contentContainerStyle={styles.scrollContent}
							enableOnAndroid
							keyboardOpeningTime={0}
							extraScrollHeight={Platform.OS === "android" ? 120 : 20}
							keyboardShouldPersistTaps="handled"
							showsVerticalScrollIndicator={false}
						>
							<ManageApplicationUsersForm
								errors={errors}
								isFormValid={isFormValid}
								loading={loading}
								mode={mode}
								onBlurField={onBlurField}
								onDelete={onDelete}
								onFieldChange={onFieldChange}
								onReset={onReset}
								onSearch={onSearch}
								onSearchQueryChange={onSearchQueryChange}
								onSelectResult={onSelectResult}
								onSubmit={onSubmit}
								onToggleBlocked={onToggleBlocked}
								searchQuery={searchQuery}
								searchResults={searchResults}
								selectedIsBlocked={selectedIsBlocked}
								selectedUserId={selectedUserId}
								touched={touched}
								values={values}
							/>
						</KeyboardAwareScrollView>

						<View style={styles.footer}>
							<Pressable
								onPress={onClose}
								style={({ pressed }) => [styles.footerButton, pressed && { opacity: 0.8 }]}
							>
								<Text style={styles.footerButtonText}>{translateText("common.close")}</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</SafeAreaView>
		</Modal>
	);
};

const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
	safeArea: {
		backgroundColor: theme.colors.overlay,
		flex: 1,
	},
	backdrop: {
		alignItems: "center",
		backgroundColor: theme.colors.overlay,
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 12,
		paddingVertical: 14,
	},
	modalCard: {
		backgroundColor: theme.colors.background,
		borderColor: theme.colors.border,
		borderRadius: 24,
		borderWidth: 1,
		flex: 1,
		maxHeight: "97%",
		maxWidth: 720,
		overflow: "hidden",
		width: "100%",
	},
	modalCardCompact: {
		borderRadius: 18,
	},
	modalCardUltraCompact: {
		borderRadius: 14,
	},
	header: {
		alignItems: "center",
		borderBottomColor: theme.colors.border,
		borderBottomWidth: 1,
		justifyContent: "center",
		paddingHorizontal: 14,
		paddingVertical: 12,
		position: "relative",
	},
	headerTitle: {
		color: theme.colors.textPrimary,
		fontSize: 18,
		fontWeight: "700",
		paddingHorizontal: 44,
		textAlign: "center",
	},
	headerTitleUltraCompact: {
		fontSize: 15,
		paddingHorizontal: 40,
	},
	headerClose: {
		position: "absolute",
		right: 14,
		top: 8,
		borderColor: theme.colors.border,
		borderRadius: 10,
		borderWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 7,
	},
	headerCloseText: {
		color: theme.colors.textSecondary,
		fontSize: 13,
		fontWeight: "600",
	},
	flex: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 32,
		paddingTop: 12,
	},
	footer: {
		borderTopColor: theme.colors.border,
		borderTopWidth: 1,
		paddingHorizontal: 18,
		paddingVertical: 14,
	},
	footerButton: {
		alignItems: "center",
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderRadius: 12,
		borderWidth: 1,
		justifyContent: "center",
		minHeight: 46,
	},
	footerButtonText: {
		color: theme.colors.textPrimary,
		fontSize: 15,
		fontWeight: "600",
	},
});

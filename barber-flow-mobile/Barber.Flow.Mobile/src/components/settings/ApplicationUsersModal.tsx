import React from "react";
import { Modal, Platform, SafeAreaView, StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ManageApplicationUsersForm } from "./ManageApplicationUsersForm";
import { useAppTheme } from "../../theme/ThemeContext";
import { useTranslation } from "../../context/LanguageContext";
import type { ApplicationUserSettingsForm, BarberApiResponse } from "../../types/settings";
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
	searchQuery: string;
	searchResults: BarberApiResponse[];
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
	searchQuery,
	searchResults,
	touched,
	values,
	visible,
}) => {
	const { theme } = useAppTheme();
	const { translateText } = useTranslation();

	return (
		<Modal
			animationType="slide"
			presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
			transparent={false}
			visible={visible}
			onRequestClose={onClose}
		>
			<SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
				<View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
					<Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
						{translateText("settings.manageUsersForm.title")}
					</Text>
					<IconButton
						icon="close"
						size={24}
						onPress={onClose}
						iconColor={theme.colors.textPrimary}
					/>
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
						searchQuery={searchQuery}
						searchResults={searchResults}
						touched={touched}
						values={values}
					/>
				</KeyboardAwareScrollView>
			</SafeAreaView>
		</Modal>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
	},
	header: {
		alignItems: "center",
		borderBottomWidth: StyleSheet.hairlineWidth,
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	headerTitle: {
		fontSize: 17,
		fontWeight: "600",
	},
	flex: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 32,
		paddingTop: 16,
	},
});

import React, { useEffect, useState } from "react";
import {
	Alert,
	ImageBackground,
	Platform,
	Pressable,
	StyleSheet,
	Switch,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ReportCalculationSettingsForm } from "../components/settings/ReportCalculationSettingsForm";
import { ScreenLayout } from "../components/ScreenLayout";
import { ApplicationUsersModal } from "../components/settings/ApplicationUsersModal";
import { useNotification } from "../context/NotificationContext";
import { useReportCalculationSettingsForm } from "../features/settings/reportCalculationsForm";
import {
	mapBarberResponseToForm,
	useApplicationUsersForm,
} from "../features/settings/settingsForm";
import { settingsService } from "../services/settingsService";
import { useAuthStore } from "../store/auth.store";
import { useLanguage, useTranslation } from "../context/LanguageContext";
import { getErrorMessage } from "../utils/errors";
import {
	DEFAULT_REPORT_CALCULATION_SETTINGS,
	type BarberApiResponse,
	type Language,
} from "../types/settings";
import { DrawerActions, useNavigation } from "@react-navigation/core";
import { AppTabParamList } from "../navigation/AppNavigator";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

const APP_VERSION = "1.0.0";
const DEVELOPER_NAME = "Guillermo Ramirez";

const COLORS = {
	bg: "#0D0D0D",
	surface: "#1A1A1A",
	surfaceElevated: "#252525",
	gold: "#C9A84C",
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
	border: "#3A3A3A",
	overlay: "rgba(13,13,13,0.65)",
} as const;

export const SettingsScreen = () => {
	const { width } = useWindowDimensions();
	const isUltraCompact = width <= 360;
	const user = useAuthStore((state) => state.user);
	const isAdmin = user?.role === "Admin";
	const { notificationsEnabled, setNotificationsEnabled, unreadCount } = useNotification();
	const { isUsingSystemLanguage, language, resetToSystemLanguage, setLanguage, systemLanguage } = useLanguage();
	const { translateText } = useTranslation();
	const {
		errors,
		isFormValid,
		loadValues,
		mode,
		onBlurField,
		resetValues,
		setField,
		touched,
		validateBeforeSubmit,
		values,
	} = useApplicationUsersForm();

	const [applicationUserLoading, setApplicationUserLoading] = useState(false);
	const [applicationUserResults, setApplicationUserResults] = useState<BarberApiResponse[]>([]);
	const [isManageUsersModalVisible, setIsManageUsersModalVisible] = useState(false);
	const [reportSettingsLoading, setReportSettingsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const {
		errors: reportSettingErrors,
		loadValues: loadReportSettingValues,
		onBlurField: onBlurReportSettingField,
		resetValues: resetReportSettingValues,
		setField: setReportSettingField,
		touched: reportSettingTouched,
		validateBeforeSubmit: validateReportSettingsBeforeSubmit,
		values: reportSettingValues,
	} = useReportCalculationSettingsForm();
	const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();

	useEffect(() => {
		let mounted = true;

		const loadReportSettings = async () => {
		const settings = await settingsService.getReportCalculationSettings();

		if (!mounted) {
			return;
		}

			loadReportSettingValues(settings);
			setReportSettingsLoading(false);
		};

		void loadReportSettings();

		return () => {
			mounted = false;
		};
	}, [loadReportSettingValues]);

	const primeNextBarberId = async () => {
		setApplicationUserLoading(true);

		try {
			const nextId = await settingsService.getNextBarberId();
			setField("barberId", nextId);
		} catch (error: unknown) {
			Alert.alert(
				translateText("common.search"),
				getErrorMessage(error) || translateText("settings.alerts.nextIdFailed"),
			);
		} finally {
			setApplicationUserLoading(false);
		}
	};

	const handleLanguageChange = async (value: string) => {
		await setLanguage(value as Language);
	};

	const handleLanguageModeToggle = async () => {
		if (isUsingSystemLanguage) {
		await setLanguage(language);
		return;
		}

		await resetToSystemLanguage();
	};

	const currentSystemLanguageLabel = systemLanguage === "es"
		? translateText("settings.preferencesPanel.spanish")
		: translateText("settings.preferencesPanel.english");

	const handleApplicationUserSubmit = async () => {
		const nextErrors = validateBeforeSubmit();

		if (
			nextErrors.userName ||
			nextErrors.password ||
			nextErrors.userEmail ||
			nextErrors.barberName ||
			nextErrors.barberPhone ||
			nextErrors.shopName ||
			nextErrors.shopPhone ||
			nextErrors.address
		) {
			Alert.alert(
				translateText("common.save"),
				translateText("settings.alerts.validation"),
			);
			return;
		}

		setApplicationUserLoading(true);

		try {
			if (mode === "edit" && values.barberId) {
				const updated = await settingsService.updateApplicationUser(values.barberId, values);
				Alert.alert(
					translateText("common.update"),
					translateText("settings.alerts.applicationUserUpdated", { id: updated.id }),
				);
				loadValues(mapBarberResponseToForm(updated), "edit");
			} else {
				const barberIdToUse = values.barberId?.trim() || (await settingsService.getNextBarberId());
				const created = await settingsService.createApplicationUser({
					...values,
					barberId: barberIdToUse,
				});
				Alert.alert(
					translateText("common.save"),
					translateText("settings.alerts.applicationUserCreated", { id: created.id }),
				);
				await handleResetApplicationUser();
				return;
			}

			setApplicationUserResults([]);
			setSearchQuery("");
		} catch (error: unknown) {
			Alert.alert(
				translateText("common.delete"),
				getErrorMessage(error) || translateText("settings.alerts.saveFailed"),
			);
		} finally {
			setApplicationUserLoading(false);
		}
	};

	const handleApplicationUserSearch = async () => {
		const query = searchQuery.trim() || (mode === "edit" ? values.barberId?.trim() : "");

		if (!query) {
			Alert.alert(
				translateText("common.search"),
				translateText("settings.alerts.searchHint"),
			);
			return;
		}

		setApplicationUserLoading(true);

		try {
			if (/^CRB-/i.test(query)) {
				const found = await settingsService.getApplicationUserById(query);
				setApplicationUserResults([found]);
				loadValues(mapBarberResponseToForm(found), "edit");
			} else {
				const results = await settingsService.findApplicationUsers(query);
				setApplicationUserResults(results);

				if (results.length === 1) {
					loadValues(mapBarberResponseToForm(results[0]), "edit");
				} else if (results.length === 0) {
					Alert.alert(
						translateText("settings.alerts.searchFailed"),
						translateText("settings.alerts.noApplicationUserSearchResult"),
					);
				}
			}
		} catch (error: unknown) {
			Alert.alert(
				translateText("common.search"),
				getErrorMessage(error) || translateText("settings.alerts.searchFailed"),
			);
		} finally {
			setApplicationUserLoading(false);
		}
	};

	const handleApplicationUserDelete = async () => {
		if (!values.barberId || mode !== "edit") {
			Alert.alert(
				translateText("common.delete"),
				translateText("settings.alerts.noApplicationUserSelected"),
			);
			return;
		}

		const barberId = values.barberId;

		Alert.alert(translateText("common.delete"), translateText("settings.alerts.confirmDeleteUser", { id: barberId }), [
			{ text: translateText("common.cancel"), style: "cancel" },
			{
				onPress: async () => {
					setApplicationUserLoading(true);

					try {
						await settingsService.deleteApplicationUser(barberId);
						Alert.alert(
							translateText("common.delete"),
							translateText("settings.alerts.applicationUserDeleted", { id: barberId }),
						);
						await handleResetApplicationUser();
					} catch (error: unknown) {
						Alert.alert(
							translateText("common.delete"),
							getErrorMessage(error) || translateText("settings.alerts.deleteFailed"),
						);
					} finally {
						setApplicationUserLoading(false);
					}
				},
				style: "destructive",
				text: translateText("common.delete"),
			},
		]);
	};

	const handleResetApplicationUser = async () => {
		resetValues();
		setApplicationUserResults([]);
		setSearchQuery("");
		await primeNextBarberId();
	};

	const handleOpenManageUsers = async () => {
		setIsManageUsersModalVisible(true);
		await handleResetApplicationUser();
	};

	const handleSelectApplicationUserResult = (result: BarberApiResponse) => {
		loadValues(mapBarberResponseToForm(result), "edit");
		setApplicationUserResults([result]);
	};

	const handleSaveReportSettings = async () => {
		const nextErrors = validateReportSettingsBeforeSubmit();

		if (nextErrors.commissionPercentage || nextErrors.fixedDailyExpense) {
			Alert.alert(
				translateText("common.save"),
				translateText("settings.alerts.reportValidation"),
			);
			return;
		}

		await settingsService.setReportCalculationSettings(reportSettingValues);
		Alert.alert(
			translateText("common.save"),
			translateText("settings.alerts.dailyReportSaved"),
		);
	};

	const handleResetReportSettings = async () => {
		resetReportSettingValues(DEFAULT_REPORT_CALCULATION_SETTINGS);
		await settingsService.setReportCalculationSettings(DEFAULT_REPORT_CALCULATION_SETTINGS);
		Alert.alert(
			translateText("common.reset"),
			translateText("settings.alerts.dailyReportReset"),
		);
	};

	return (
		<ImageBackground
			source={require("../../assets/images/barber-flow-background-image.jpg")}
			style={styles.screenBg}
			resizeMode="cover"
		>
			<StatusBar style="light" translucent backgroundColor="transparent" />
			<View style={styles.screenOverlay} />
			<ScreenLayout
				title={translateText("settings.title")}
				backgroundColor="transparent"
				onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
			>
				<KeyboardAwareScrollView
					style={styles.flex}
					contentContainerStyle={styles.scrollContent}
					enableOnAndroid
					keyboardOpeningTime={0}
					extraScrollHeight={Platform.OS === "android" ? 120 : 20}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.card}>
						<Text style={styles.eyebrow}>{translateText("settings.workspaceSettings")}</Text>
						<Text style={[styles.heroTitle, isUltraCompact && styles.heroTitleUltraCompact]}>{translateText("settings.settingsAndPreferences")}</Text>
						<Text style={styles.heroSubtitle}>{translateText("settings.heroSubtitle")}</Text>

						<View style={styles.heroMetrics}>
							<View style={styles.metricPill}>
								<Text style={styles.metricValue}>{isUsingSystemLanguage ? "Auto" : "Manual"}</Text>
								<Text style={styles.metricLabel}>{translateText("settings.preferencesPanel.languageTitle")}</Text>
							</View>
							<View style={styles.metricPill}>
								<Text style={styles.metricValue}>{unreadCount}</Text>
								<Text style={styles.metricLabel}>{translateText("common.unread")}</Text>
							</View>
						</View>
					</View>

					<View style={styles.sectionWrap}>
						<Text style={styles.sectionTitle}>{translateText("settings.preferences")}</Text>
						<View style={styles.card}>
							<View style={styles.settingRow}>
								<View style={styles.settingCopy}>
									<Text style={styles.settingLabel}>
										{translateText("settings.preferencesPanel.followDeviceLanguage")}
									</Text>
									<Text style={styles.settingBody}>
										{isUsingSystemLanguage
											? translateText("settings.preferencesPanel.languageSystemBody", {
												language: currentSystemLanguageLabel,
											})
											: translateText("settings.preferencesPanel.languageManualBody")}
									</Text>
								</View>
								<Switch
									trackColor={{ false: COLORS.border, true: COLORS.gold }}
									thumbColor={COLORS.textPrimary}
									onValueChange={() => void handleLanguageModeToggle()}
									value={isUsingSystemLanguage}
								/>
							</View>

							<View style={[styles.languageOptions, isUsingSystemLanguage && styles.languageOptionsDisabled]}>
								<Pressable
									onPress={() => void handleLanguageChange("es")}
									disabled={isUsingSystemLanguage}
									style={({ pressed }) => [
										styles.languageOption,
										language === "es" ? styles.languageOptionActive : styles.languageOptionInactive,
										pressed && { opacity: 0.85 },
									]}
								>
									<Text style={language === "es" ? styles.languageOptionTextActive : styles.languageOptionTextInactive}>
										{translateText("settings.preferencesPanel.spanish")}
									</Text>
								</Pressable>
								<Pressable
									onPress={() => void handleLanguageChange("en")}
									disabled={isUsingSystemLanguage}
									style={({ pressed }) => [
										styles.languageOption,
										language === "en" ? styles.languageOptionActive : styles.languageOptionInactive,
										pressed && { opacity: 0.85 },
									]}
								>
									<Text style={language === "en" ? styles.languageOptionTextActive : styles.languageOptionTextInactive}>
										{translateText("settings.preferencesPanel.english")}
									</Text>
								</Pressable>
							</View>

							<View style={styles.settingRow}>
								<View style={styles.settingCopy}>
									<Text style={styles.settingLabel}>
										{translateText("settings.preferencesPanel.notifications", {
											count: unreadCount,
										})}
									</Text>
								</View>
								<Switch
									trackColor={{ false: COLORS.border, true: COLORS.gold }}
									thumbColor={COLORS.textPrimary}
									onValueChange={() => void setNotificationsEnabled(!notificationsEnabled)}
									value={notificationsEnabled}
								/>
							</View>
						</View>
					</View>

					<View style={styles.sectionWrap}>
						<Text style={styles.sectionTitle}>{translateText("settings.dailyReportCalculations")}</Text>
						<View style={styles.card}>
							<ReportCalculationSettingsForm
								errors={reportSettingErrors}
								loading={reportSettingsLoading}
								onBlurField={onBlurReportSettingField}
								onFieldChange={setReportSettingField}
								onReset={() => void handleResetReportSettings()}
								onSave={() => void handleSaveReportSettings()}
								touched={reportSettingTouched}
								values={reportSettingValues}
							/>
						</View>
					</View>

					{isAdmin ? (
						<View style={styles.sectionWrap}>
							<Text style={styles.sectionTitle}>{translateText("settings.manageApplicationUsers")}</Text>
							<View style={styles.card}>
								<Pressable
									onPress={() => void handleOpenManageUsers()}
									style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.8 }]}
								>
									<Text style={styles.btnPrimaryText}>{translateText("settings.addApplicationUser")}</Text>
								</Pressable>
							</View>
						</View>
					) : null}

					<View style={styles.card}>
						<Text style={styles.aboutEyebrow}>{translateText("settings.about")}</Text>
						<Text style={styles.aboutTitle}>Barber Flow Mobile</Text>
						<Text style={styles.aboutSubtitle}>{translateText("settings.aboutSubtitle")}</Text>

						<View style={styles.aboutInfoRow}>
							<Text style={styles.aboutLabel}>{translateText("settings.version")}</Text>
							<Text style={styles.aboutValue}>{APP_VERSION}</Text>
						</View>

						<View style={styles.aboutInfoRowLast}>
							<Text style={styles.aboutLabel}>{translateText("settings.developer")}</Text>
							<Text style={styles.aboutValue}>{DEVELOPER_NAME}</Text>
						</View>
					</View>
				</KeyboardAwareScrollView>

				{isAdmin ? (
					<ApplicationUsersModal
						visible={isManageUsersModalVisible}
						onClose={() => {
							setIsManageUsersModalVisible(false);
						}}
						errors={errors}
						isFormValid={isFormValid}
						loading={applicationUserLoading}
						mode={mode}
						onBlurField={onBlurField}
						onDelete={handleApplicationUserDelete}
						onFieldChange={setField}
						onReset={() => void handleResetApplicationUser()}
						onSearch={() => void handleApplicationUserSearch()}
						onSearchQueryChange={setSearchQuery}
						onSelectResult={handleSelectApplicationUserResult}
						onSubmit={() => void handleApplicationUserSubmit()}
						searchQuery={searchQuery}
						searchResults={applicationUserResults}
						touched={touched}
						values={values}
					/>
				) : null}
			</ScreenLayout>
		</ImageBackground>
	);
};

const styles = StyleSheet.create({
	screenBg: {
		flex: 1,
	},
	screenOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: COLORS.overlay,
	},
	flex: {
		flex: 1,
	},
	scrollContent: {
		gap: 18,
		paddingBottom: 36,
		paddingTop: 18,
	},
	sectionWrap: {
		gap: 10,
	},
	sectionTitle: {
		color: COLORS.textSecondary,
		fontSize: 13,
		fontWeight: "700",
		letterSpacing: 0.8,
		marginLeft: 2,
		textTransform: "uppercase",
	},
	card: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.border,
		borderRadius: 24,
		borderWidth: 1,
		paddingHorizontal: 18,
		paddingVertical: 20,
	},
	eyebrow: {
		color: COLORS.gold,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		marginBottom: 8,
		textTransform: "uppercase",
	},
	heroTitle: {
		color: COLORS.textPrimary,
		fontSize: 28,
		fontWeight: "700",
		marginBottom: 8,
	},
	heroTitleUltraCompact: {
		fontSize: 22,
	},
	heroSubtitle: {
		color: COLORS.textSecondary,
		fontSize: 14,
		lineHeight: 21,
	},
	heroMetrics: {
		flexDirection: "row",
		gap: 10,
		marginTop: 18,
	},
	metricPill: {
		backgroundColor: COLORS.surfaceElevated,
		borderRadius: 12,
		flex: 1,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	metricValue: {
		color: COLORS.textPrimary,
		fontSize: 16,
		fontWeight: "700",
	},
	metricLabel: {
		color: COLORS.textSecondary,
		fontSize: 12,
		marginTop: 2,
	},
	settingRow: {
		alignItems: "center",
		borderBottomColor: COLORS.border,
		borderBottomWidth: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		paddingBottom: 14,
		paddingTop: 6,
	},
	settingCopy: {
		flex: 1,
		paddingRight: 14,
	},
	settingLabel: {
		color: COLORS.textPrimary,
		fontSize: 15,
		fontWeight: "600",
	},
	settingBody: {
		color: COLORS.textSecondary,
		fontSize: 13,
		lineHeight: 19,
		marginTop: 4,
	},
	languageOptions: {
		backgroundColor: COLORS.bg,
		borderColor: COLORS.border,
		borderRadius: 12,
		borderWidth: 1,
		flexDirection: "row",
		gap: 8,
		marginBottom: 12,
		marginTop: 12,
		padding: 6,
	},
	languageOptionsDisabled: {
		opacity: 0.55,
	},
	languageOption: {
		alignItems: "center",
		borderRadius: 8,
		flex: 1,
		justifyContent: "center",
		minHeight: 38,
		paddingHorizontal: 10,
	},
	languageOptionActive: {
		backgroundColor: COLORS.gold,
	},
	languageOptionInactive: {
		backgroundColor: COLORS.surface,
	},
	languageOptionTextActive: {
		color: COLORS.bg,
		fontSize: 13,
		fontWeight: "700",
	},
	languageOptionTextInactive: {
		color: COLORS.textSecondary,
		fontSize: 13,
		fontWeight: "600",
	},
	btnPrimary: {
		alignItems: "center",
		backgroundColor: COLORS.gold,
		borderRadius: 12,
		justifyContent: "center",
		minHeight: 46,
		paddingHorizontal: 16,
	},
	btnPrimaryText: {
		color: COLORS.bg,
		fontSize: 15,
		fontWeight: "700",
	},
	aboutEyebrow: {
		color: COLORS.textSecondary,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		marginBottom: 6,
		textTransform: "uppercase",
	},
	aboutTitle: {
		color: COLORS.textPrimary,
		fontSize: 22,
		fontWeight: "700",
		marginBottom: 8,
	},
	aboutSubtitle: {
		color: COLORS.textSecondary,
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 16,
 	},
	aboutInfoRow: {
		borderBottomColor: COLORS.border,
		borderBottomWidth: 1,
		paddingVertical: 14,
	},
	aboutInfoRowLast: {
		paddingTop: 14,
	},
	aboutLabel: {
		color: COLORS.textSecondary,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 0.8,
		marginBottom: 6,
		textTransform: "uppercase",
	},
	aboutValue: {
		color: COLORS.textPrimary,
		fontSize: 16,
		fontWeight: "600",
	},
});

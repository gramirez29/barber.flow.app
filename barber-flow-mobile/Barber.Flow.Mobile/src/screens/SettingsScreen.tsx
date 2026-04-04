import React, { useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button, SegmentedButtons, Text } from "react-native-paper";
import { ReportCalculationSettingsForm } from "../components/settings/ReportCalculationSettingsForm";
import { ScreenLayout } from "../components/ScreenLayout";
import { ManageApplicationUsersForm } from "../components/settings/ManageApplicationUsersForm";
import { SettingItem } from "../components/settings/SettingItem";
import { SettingSection } from "../components/settings/SettingSection";
import { useNotification } from "../context/NotificationContext";
import { useReportCalculationSettingsForm } from "../features/settings/reportCalculationsForm";
import {
  mapBarberResponseToForm,
  useApplicationUsersForm,
} from "../features/settings/settingsForm";
import { settingsService } from "../services/apis/settingsService";
import { useAuthStore } from "../store/auth.store";
import { useLanguage, useTranslation } from "../context/LanguageContext";
import { useAppTheme } from "../theme/ThemeContext";
import { FormCard } from "../components/ui/FormCard";
import {
  DEFAULT_REPORT_CALCULATION_SETTINGS,
  type BarberApiResponse,
  type Language,
  type ThemeMode,
} from "../types/settings";

const APP_VERSION = "1.0.0";
const DEVELOPER_NAME = "Guillermo Ramirez";

export const SettingsScreen = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "Admin";
  const { notificationsEnabled, setNotificationsEnabled, unreadCount } = useNotification();
  const { resolvedThemeMode, setThemeMode, theme, themeMode } = useAppTheme();
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

  // Note: we no longer prefetch next barber id on mount. The id
  // will be fetched exactly once immediately before creating a barber.

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

  const handleThemeModeChange = async (value: string) => {
    await setThemeMode(value as ThemeMode);
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
      nextErrors.userPhone ||
      nextErrors.userEmail ||
      nextErrors.barberName ||
      nextErrors.barberPhone
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
        // Fetch a one-time barber id immediately before creating so
        // we don't prefetch on mount or after other actions.
        const nextId = await settingsService.getNextBarberId();
        setField("barberId", nextId);

        const created = await settingsService.createApplicationUser({ ...values, barberId: nextId });
        Alert.alert(
          translateText("common.save"),
          translateText("settings.alerts.applicationUserCreated", { id: created.id }),
        );
        // Clear the form after successful create; do not prefetch another id.
        resetValues();
      }

      setApplicationUserResults([]);
      setSearchQuery("");
    } catch (error: any) {
      Alert.alert(
        translateText("common.delete"),
        error?.message ?? translateText("settings.alerts.saveFailed"),
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
    } catch (error: any) {
      Alert.alert(
        translateText("common.search"),
        error?.message ?? translateText("settings.alerts.searchFailed"),
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
                // Reset the form after delete; do not prefetch a new id.
                resetValues();
            setApplicationUserResults([]);
            setSearchQuery("");
          } catch (error: any) {
            Alert.alert(
              translateText("common.delete"),
              error?.message ?? translateText("settings.alerts.deleteFailed"),
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
    <ScreenLayout title={translateText("settings.title")} backgroundColor={theme.colors.background}>
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        keyboardOpeningTime={0}
        extraScrollHeight={Platform.OS === "android" ? 120 : 20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FormCard style={styles.heroCard}>
          <Text style={[styles.heroEyebrow, { color: theme.colors.textSecondary }]}>{translateText("settings.workspaceSettings")}</Text>
          <Text style={[styles.heroTitle, { color: theme.colors.textPrimary }]}>{translateText("settings.settingsAndPreferences")}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}> 
            {translateText("settings.heroSubtitle")}
          </Text>

          <View style={styles.heroActions}>
            <Button mode="contained" onPress={() => void setThemeMode("system")}>{translateText("settings.followSystem")}</Button>
            <Button mode="text" onPress={() => void setThemeMode(resolvedThemeMode === "dark" ? "light" : "dark")}>{translateText("settings.quickToggle")}</Button>
          </View>
        </FormCard>

        <SettingSection title={translateText("settings.preferences")}>
          <View style={styles.preferenceBlock}>
            <Text style={[styles.preferenceTitle, { color: theme.colors.textPrimary }]}>{translateText("settings.preferencesPanel.darkModeTitle")}</Text>
            <Text style={[styles.preferenceBody, { color: theme.colors.textSecondary }]}> 
              {translateText("settings.preferencesPanel.darkModeBody")}
            </Text>
            <SegmentedButtons
              density="small"
              onValueChange={handleThemeModeChange}
              style={styles.segmentedButtons}
              value={themeMode}
              buttons={[
                { label: translateText("settings.preferencesPanel.system"), value: "system" },
                { label: translateText("settings.preferencesPanel.light"), value: "light" },
                { label: translateText("settings.preferencesPanel.dark"), value: "dark" },
              ]}
            />
          </View>

          <SettingItem
            icon="language-outline"
            label={translateText("settings.preferencesPanel.followDeviceLanguage")}
            onToggle={() => void handleLanguageModeToggle()}
            value={isUsingSystemLanguage}
          />

          <View style={styles.preferenceBlock}>
            <Text style={[styles.preferenceTitle, { color: theme.colors.textPrimary }]}>{translateText("settings.preferencesPanel.languageTitle")}</Text>
            <Text style={[styles.preferenceBody, { color: theme.colors.textSecondary }]}>
              {isUsingSystemLanguage
                ? translateText("settings.preferencesPanel.languageSystemBody", {
                    language: currentSystemLanguageLabel,
                  })
                : translateText("settings.preferencesPanel.languageManualBody")}
            </Text>
            <SegmentedButtons
              density="small"
              onValueChange={handleLanguageChange}
              style={styles.segmentedButtons}
              value={language}
              buttons={[
                {
                  disabled: isUsingSystemLanguage,
                  label: translateText("settings.preferencesPanel.spanish"),
                  value: "es",
                },
                {
                  disabled: isUsingSystemLanguage,
                  label: translateText("settings.preferencesPanel.english"),
                  value: "en",
                },
              ]}
            />
          </View>

          <SettingItem
            icon="notifications-outline"
            label={translateText("settings.preferencesPanel.notifications", { count: unreadCount })}
            onToggle={() => void setNotificationsEnabled(!notificationsEnabled)}
            value={notificationsEnabled}
          />
        </SettingSection>

        <SettingSection title={translateText("settings.dailyReportCalculations")}>
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
        </SettingSection>

        {isAdmin ? (
          <SettingSection title={translateText("settings.manageApplicationUsers")}>
            <ManageApplicationUsersForm
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
          </SettingSection>
        ) : null}

        <FormCard style={styles.aboutCard}>
          <Text style={[styles.aboutEyebrow, { color: theme.colors.textSecondary }]}>{translateText("settings.about")}</Text>
          <Text style={[styles.aboutTitle, { color: theme.colors.textPrimary }]}>Barber Flow Mobile</Text>
          <Text style={[styles.aboutSubtitle, { color: theme.colors.textSecondary }]}> 
            {translateText("settings.aboutSubtitle")}
          </Text>

          <View
            style={[
              styles.aboutInfoRow,
              {
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View>
              <Text style={[styles.aboutLabel, { color: theme.colors.textSecondary }]}>{translateText("settings.version")}</Text>
              <Text style={[styles.aboutValue, { color: theme.colors.textPrimary }]}>{APP_VERSION}</Text>
            </View>
          </View>

          <View style={styles.aboutInfoRow}>
            <View>
              <Text style={[styles.aboutLabel, { color: theme.colors.textSecondary }]}>{translateText("settings.developer")}</Text>
              <Text style={[styles.aboutValue, { color: theme.colors.textPrimary }]}>{DEVELOPER_NAME}</Text>
            </View>
          </View>
        </FormCard>
      </KeyboardAwareScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingTop: 18,
  },
  heroCard: {
    marginBottom: 16,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  preferenceBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  preferenceBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  aboutCard: {
    marginTop: 8,
  },
  aboutEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  aboutTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  aboutSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  aboutInfoRow: {
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  aboutLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  aboutValue: {
    fontSize: 16,
    fontWeight: "600",
  },
});

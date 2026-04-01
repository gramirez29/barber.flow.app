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
import { useAppTheme } from "../theme/ThemeContext";
import { FormCard } from "../components/ui/FormCard";
import {
  DEFAULT_REPORT_CALCULATION_SETTINGS,
  type BarberApiResponse,
  type ThemeMode,
} from "../types/settings";

const APP_VERSION = "1.0.0";
const DEVELOPER_NAME = "Guillermo Ramirez";

export const SettingsScreen = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "Admin";
  const { notificationsEnabled, setNotificationsEnabled, unreadCount } = useNotification();
  const { resolvedThemeMode, setThemeMode, theme, themeMode } = useAppTheme();
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

  const loadNextBarberId = async () => {
    const nextBarberId = await settingsService.getNextBarberId();
    resetValues(nextBarberId);
  };

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    void loadNextBarberId();
  }, [isAdmin]);

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

  const handleApplicationUserSubmit = async () => {
    const nextErrors = validateBeforeSubmit();

    if (
      nextErrors.userName ||
      nextErrors.userPhone ||
      nextErrors.userEmail ||
      nextErrors.barberName ||
      nextErrors.barberPhone
    ) {
      Alert.alert("Validation", "Please fix the required fields.");
      return;
    }

    setApplicationUserLoading(true);

    try {
      if (mode === "edit" && values.barberId) {
        const updated = await settingsService.updateApplicationUser(values.barberId, values);
        Alert.alert("Updated", `Application user ${updated.id} updated successfully.`);
        loadValues(mapBarberResponseToForm(updated), "edit");
      } else {
        const created = await settingsService.createApplicationUser(values);
        Alert.alert("Saved", `Application user ${created.id} created successfully.`);
        await loadNextBarberId();
      }

      setApplicationUserResults([]);
      setSearchQuery("");
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Save failed");
    } finally {
      setApplicationUserLoading(false);
    }
  };

  const handleApplicationUserSearch = async () => {
    const query = searchQuery.trim() || (mode === "edit" ? values.barberId?.trim() : "");

    if (!query) {
      Alert.alert("Search", "Enter a Barber ID, email, or phone to search.");
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
          Alert.alert("Not found", "No application user found for that search.");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Search failed");
    } finally {
      setApplicationUserLoading(false);
    }
  };

  const handleApplicationUserDelete = async () => {
    if (!values.barberId || mode !== "edit") {
      Alert.alert("Info", "No application user selected.");
      return;
    }

    const barberId = values.barberId;

    Alert.alert("Confirm", `Remove ${barberId}?`, [
      { text: "Cancel", style: "cancel" },
      {
        onPress: async () => {
          setApplicationUserLoading(true);

          try {
            await settingsService.deleteApplicationUser(barberId);
            Alert.alert("Deleted", `Application user ${barberId} removed successfully.`);
            await loadNextBarberId();
            setApplicationUserResults([]);
            setSearchQuery("");
          } catch (error: any) {
            Alert.alert("Error", error?.message ?? "Delete failed");
          } finally {
            setApplicationUserLoading(false);
          }
        },
        style: "destructive",
        text: "Delete",
      },
    ]);
  };

  const handleResetApplicationUser = async () => {
    await loadNextBarberId();
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
      Alert.alert("Validation", "Please review the daily report calculation values.");
      return;
    }

    await settingsService.setReportCalculationSettings(reportSettingValues);
    Alert.alert("Saved", "Daily report calculations updated successfully.");
  };

  const handleResetReportSettings = async () => {
    resetReportSettingValues(DEFAULT_REPORT_CALCULATION_SETTINGS);
    await settingsService.setReportCalculationSettings(DEFAULT_REPORT_CALCULATION_SETTINGS);
    Alert.alert("Reset", "Daily report calculations were reset to defaults.");
  };

  return (
    <ScreenLayout title="Settings" backgroundColor={theme.colors.background}>
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
          <Text style={[styles.heroEyebrow, { color: theme.colors.textSecondary }]}>Workspace settings</Text>
          <Text style={[styles.heroTitle, { color: theme.colors.textPrimary }]}>Settings & Preferences</Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}> 
            Configure application preferences, manage admin-only application users, and keep the experience aligned with your workflow.
          </Text>

          <View style={styles.heroActions}>
            <Button mode="contained" onPress={() => void setThemeMode("system")}>Follow system</Button>
            <Button mode="text" onPress={() => void setThemeMode(resolvedThemeMode === "dark" ? "light" : "dark")}>Quick toggle</Button>
          </View>
        </FormCard>

        <SettingSection title="Preferencias">
          <View style={styles.preferenceBlock}>
            <Text style={[styles.preferenceTitle, { color: theme.colors.textPrimary }]}>Dark Mode</Text>
            <Text style={[styles.preferenceBody, { color: theme.colors.textSecondary }]}> 
              Choose a manual theme or let the app follow system preferences across the full experience.
            </Text>
            <SegmentedButtons
              density="small"
              onValueChange={handleThemeModeChange}
              style={styles.segmentedButtons}
              value={themeMode}
              buttons={[
                { label: "System", value: "system" },
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
              ]}
            />
          </View>

          <SettingItem
            icon="notifications-outline"
            label={`Notifications (${unreadCount})`}
            onToggle={() => void setNotificationsEnabled(!notificationsEnabled)}
            value={notificationsEnabled}
          />
        </SettingSection>

        <SettingSection title="Daily Report Calculations">
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
          <SettingSection title="Manage Application Users">
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
          <Text style={[styles.aboutEyebrow, { color: theme.colors.textSecondary }]}>Acerca de</Text>
          <Text style={[styles.aboutTitle, { color: theme.colors.textPrimary }]}>Barber Flow Mobile</Text>
          <Text style={[styles.aboutSubtitle, { color: theme.colors.textSecondary }]}> 
            Application information and development credits presented with the same polished card treatment as the rest of the settings workspace.
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
              <Text style={[styles.aboutLabel, { color: theme.colors.textSecondary }]}>Version</Text>
              <Text style={[styles.aboutValue, { color: theme.colors.textPrimary }]}>{APP_VERSION}</Text>
            </View>
          </View>

          <View style={styles.aboutInfoRow}>
            <View>
              <Text style={[styles.aboutLabel, { color: theme.colors.textSecondary }]}>Developer</Text>
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

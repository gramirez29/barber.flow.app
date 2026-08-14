import type { DrawerNavigationProp } from "@react-navigation/drawer";
import type { DrawerParamList } from "../navigation/DrawerNavigator";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
	useNavigation,
	DrawerActions,
	useFocusEffect,
} from "@react-navigation/native";
import { format } from "date-fns";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ScreenLayout } from "../components/ScreenLayout";
import { useDialog } from "../context/DialogContext";
import { getAppointmentPaymentMethodLabel } from "../features/appointments/appointments.types";
import { useAppointmentStore } from "../features/appointments/appointment.store";
import { calculateDailyReportSummary } from "../features/reports/dailyReport";
import { useTranslation } from "../context/LanguageContext";
import { getIntlLocale } from "../localization/i18n";
import { settingsService } from "../services/settingsService";
import {
	DEFAULT_REPORT_CALCULATION_SETTINGS,
	type ReportCalculationSettings,
} from "../types/settings";

import { AppTheme } from "../theme/themes";
import { useAppTheme } from "../theme/ThemeContext";

const formatCurrency = (value: number, locale: string) =>
	new Intl.NumberFormat(locale, {
		currency: "CRC",
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
		style: "currency",
	}).format(value);

const formatLongDate = (date: string, locale: string) =>
	new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "long",
		weekday: "long",
		year: "numeric",
	}).format(new Date(`${date}T12:00:00`));

export const DailyReportScreen = () => {
	const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
	const { language, translateText } = useTranslation();
	const { theme } = useAppTheme();
	const { showAlert } = useDialog();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const appointments = useAppointmentStore((state) => state.appointments);
	const isLoading = useAppointmentStore((state) => state.isLoading);
	const fetchError = useAppointmentStore((state) => state.error);
	const clearFetchError = useAppointmentStore((state) => state.clearError);
	const fetchAppointmentsByDateRange = useAppointmentStore((state) => state.fetchAppointmentsByDateRange);

	useEffect(() => {
		if (!fetchError) return;
		showAlert(translateText("common.somethingWentWrong"), fetchError);
		clearFetchError();
	}, [fetchError, showAlert, clearFetchError, translateText]);
	const [selectedDate, setSelectedDate] = useState(
		format(new Date(), "yyyy-MM-dd"),
	);
	const [reportSettings, setReportSettings] =
		useState<ReportCalculationSettings>(DEFAULT_REPORT_CALCULATION_SETTINGS);
	const [isDatePickerVisible, setDatePickerVisible] = useState(false);

	useFocusEffect(
		useCallback(() => {
			let active = true;

			const load = async () => {
				const [nextSettings] = await Promise.all([
					settingsService.getReportCalculationSettings(),
					fetchAppointmentsByDateRange(selectedDate, selectedDate, "completed"),
				]);
				if (active) {
					setReportSettings(nextSettings);
				}
			};

			void load();

			return () => {
				active = false;
			};
		}, [selectedDate, fetchAppointmentsByDateRange]),
	);

	const report = useMemo(
		() =>
		calculateDailyReportSummary(appointments, selectedDate, reportSettings),
		[appointments, reportSettings, selectedDate],
	);
	const locale = getIntlLocale(language);

	const metricCards = [
		{
			label: translateText("dailyReport.metrics.customersServed"),
			value: String(report.totalCustomersServed),
		},
		{
			label: translateText("dailyReport.metrics.grossRevenue"),
			value: formatCurrency(report.grossRevenue, locale),
		},
		{
			label: translateText("dailyReport.metrics.netProfit"),
			value: formatCurrency(report.netProfit, locale),
		},
	];

	return (
		<ImageBackground
			source={require("../../assets/images/barber-flow-background-image.jpg")}
			style={styles.screenBg}
			resizeMode="cover"
		>
			<StatusBar style="light" translucent backgroundColor="transparent" />
			<View style={styles.screenOverlay} />
			<ScreenLayout
				title={translateText("dailyReport.title")}
				backgroundColor="transparent"
				onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
			>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					{/* ─── Hero card ─────────────────────────────────────── */}
					<View style={styles.card}>
						<Text style={styles.eyebrow}>
							{translateText("dailyReport.heroEyebrow")}
						</Text>
						<Text style={styles.heroTitle}>
							{translateText("dailyReport.heroTitle")}
						</Text>
						<Text style={styles.heroSubtitle}>
							{translateText("dailyReport.heroSubtitle")}
						</Text>

						<View style={styles.heroActions}>
							<Pressable
								onPress={() => setDatePickerVisible(true)}
								style={styles.dateSelector}
							>
								<Text style={styles.dateSelectorLabel}>
									{translateText("dailyReport.selectedDay")}
								</Text>
								<Text style={styles.dateSelectorValue}>
									{formatLongDate(selectedDate, locale)}
								</Text>
							</Pressable>

							<View style={styles.heroButtons}>
								<Pressable
									onPress={() => setDatePickerVisible(true)}
									style={styles.btnPrimary}
								>
									<Text style={styles.btnPrimaryText}>
										{translateText("dailyReport.changeDay")}
									</Text>
								</Pressable>
								<Pressable
									onPress={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
									style={styles.btnSecondary}
								>
									<Text style={styles.btnSecondaryText}>
										{translateText("common.today")}
									</Text>
								</Pressable>
							</View>
						</View>

						<View style={styles.formulaRow}>
							<View style={styles.formulaPill}>
								<Text style={styles.formulaLabel}>
									{translateText("dailyReport.commission")}
								</Text>
								<Text style={styles.formulaValue}>
									{reportSettings.commissionPercentage}%
								</Text>
							</View>
							<View style={styles.formulaPill}>
								<Text style={styles.formulaLabel}>
									{translateText("dailyReport.dailyExpense")}
								</Text>
								<Text style={styles.formulaValue}>
									{formatCurrency(reportSettings.fixedDailyExpense, locale)}
								</Text>
							</View>
						</View>
					</View>

					{/* ─── Metrics grid ───────────────────────────────────── */}
					<View style={styles.metricsGrid}>
						{metricCards.map((card) => (
							<View key={card.label} style={styles.metricCard}>
								<Text style={styles.metricLabel}>{card.label}</Text>
								{isLoading ? (
									<ActivityIndicator size="small" color={theme.colors.accent} style={styles.metricLoader} />
								) : (
									<Text style={styles.metricValue}>{card.value}</Text>
								)}
							</View>
						))}
					</View>

					{/* ─── Formula breakdown ──────────────────────────────── */}
					<View style={styles.card}>
						<Text style={styles.eyebrow}>
							{translateText("dailyReport.formulaEyebrow")}
						</Text>
						<Text style={styles.sectionTitle}>
							{translateText("dailyReport.formulaTitle")}
						</Text>
						<Text style={styles.sectionSubtitle}>
							{translateText("dailyReport.formulaSubtitle")}
						</Text>

						<View style={styles.breakdownRow}>
							<View style={styles.breakdownItem}>
								<Text style={styles.breakdownLabel}>
									{translateText("dailyReport.commissionAmount")}
								</Text>
								<Text style={styles.breakdownValue}>
									{formatCurrency(report.commissionAmount, locale)}
								</Text>
							</View>
							<View style={styles.breakdownItem}>
								<Text style={styles.breakdownLabel}>
									{translateText("dailyReport.dailyExpenseBreakdown")}
								</Text>
								<Text style={styles.breakdownValue}>
									{formatCurrency(report.fixedDailyExpense, locale)}
								</Text>
							</View>
						</View>
					</View>

					{/* ─── Collections ────────────────────────────────────── */}
					<View style={styles.card}>
						<Text style={styles.eyebrow}>
							{translateText("dailyReport.collectionsEyebrow")}
						</Text>
						<Text style={styles.sectionTitle}>
							{translateText("dailyReport.collectionsTitle")}
						</Text>
						<Text style={styles.sectionSubtitle}>
							{translateText("dailyReport.collectionsSubtitle")}
						</Text>

						<View style={styles.paymentList}>
							{report.paymentBreakdown.map((item) => (
								<View key={item.paymentMethod} style={styles.paymentRow}>
									<View>
										<Text style={styles.paymentMethod}>
											{getAppointmentPaymentMethodLabel(
												item.paymentMethod,
												translateText,
											)}
										</Text>
										<Text style={styles.paymentMeta}>
											{translateText(
												item.appointmentCount === 1
													? "dailyReport.completedAppointmentMeta_one"
													: "dailyReport.completedAppointmentMeta_other",
												{ count: item.appointmentCount },
											)}
										</Text>
									</View>
									<Text style={styles.paymentTotal}>
										{formatCurrency(item.total, locale)}
									</Text>
								</View>
							))}
						</View>
					</View>

					{/* ─── Attendance ledger ──────────────────────────────── */}
					<View style={styles.card}>
						<Text style={styles.eyebrow}>
							{translateText("dailyReport.attendanceEyebrow")}
						</Text>
						<Text style={styles.sectionTitle}>
							{translateText("dailyReport.attendanceTitle")}
						</Text>
						<Text style={styles.sectionSubtitle}>
							{translateText("dailyReport.attendanceSubtitle")}
						</Text>

						{report.completedAppointments.length === 0 ? (
							<View style={styles.emptyState}>
								<Text style={styles.emptyTitle}>
									{translateText("dailyReport.noCompletedAppointments")}
								</Text>
								<Text style={styles.emptySubtitle}>
									{translateText("dailyReport.noCompletedAppointmentsBody")}
								</Text>
							</View>
						) : (
							<View style={styles.ledgerList}>
								{report.completedAppointments.map((appointment) => (
									<View key={appointment.id} style={styles.ledgerRow}>
										<View style={styles.ledgerCopy}>
											<Text style={styles.ledgerTitle}>
												{appointment.clientName}
											</Text>
											<Text style={styles.ledgerMeta}>
												{appointment.time} •{" "}
												{appointment.serviceName ?? translateText("dailyReport.generalService")}
											</Text>
											<Text style={styles.ledgerMeta}>
												{appointment.paymentMethodUsed
													? getAppointmentPaymentMethodLabel(
														appointment.paymentMethodUsed,
														translateText,
													)
													: translateText("dailyReport.paymentMethodNotSet")}
											</Text>
										</View>
										<Text style={styles.ledgerAmount}>
											{formatCurrency(appointment.servicePrice ?? 0, locale)}
										</Text>
									</View>
								))}
							</View>
						)}
					</View>
				</ScrollView>

				<DateTimePickerModal
					isVisible={isDatePickerVisible}
					mode="date"
					date={new Date(`${selectedDate}T12:00:00`)}
					themeVariant="dark"
					accentColor={theme.colors.accent}
					onConfirm={(nextDate) => {
						setSelectedDate(format(nextDate, "yyyy-MM-dd"));
						setDatePickerVisible(false);
					}}
					onCancel={() => setDatePickerVisible(false)}
				/>
			</ScreenLayout>
		</ImageBackground>
	);
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
	screenBg: {
		flex: 1,
	},
	screenOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: theme.colors.overlay,
	},
	scrollContent: {
		gap: 16,
		paddingBottom: 32,
		paddingTop: 18,
	},
	// ─── Cards ───────────────────────────────────────────────────────
	card: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderRadius: 24,
		borderWidth: 1,
		gap: 6,
		paddingHorizontal: 18,
		paddingVertical: 20,
	},
	// ─── Hero typography ─────────────────────────────────────────────
	eyebrow: {
		color: theme.colors.accent,
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.4,
		marginBottom: 2,
		textTransform: "uppercase",
	},
	heroTitle: {
		color: theme.colors.textPrimary,
		fontSize: 28,
		fontWeight: "700",
		letterSpacing: -0.3,
	},
	heroSubtitle: {
		color: theme.colors.textSecondary,
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 4,
	},
	sectionTitle: {
		color: theme.colors.textPrimary,
		fontSize: 20,
		fontWeight: "700",
		letterSpacing: -0.2,
	},
	sectionSubtitle: {
		color: theme.colors.textSecondary,
		fontSize: 13,
		lineHeight: 18,
		marginBottom: 4,
	},
	// ─── Hero actions ─────────────────────────────────────────────────
	heroActions: {
		gap: 12,
		marginTop: 8,
	},
	dateSelector: {
		backgroundColor: theme.colors.surfaceElevated,
		borderColor: theme.colors.border,
		borderRadius: 18,
		borderWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	dateSelectorLabel: {
		color: theme.colors.textSecondary,
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 0.8,
		marginBottom: 4,
		textTransform: "uppercase",
	},
	dateSelectorValue: {
		color: theme.colors.textPrimary,
		fontSize: 17,
		fontWeight: "700",
		textTransform: "capitalize",
	},
	heroButtons: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
	},
	btnPrimary: {
		alignItems: "center",
		backgroundColor: theme.colors.accent,
		borderRadius: 14,
		paddingHorizontal: 20,
		paddingVertical: 11,
	},
	btnPrimaryText: {
		color: "#0F172A",
		fontSize: 14,
		fontWeight: "700",
	},
	btnSecondary: {
		alignItems: "center",
		backgroundColor: theme.colors.surfaceElevated,
		borderColor: theme.colors.border,
		borderRadius: 14,
		borderWidth: 1,
		paddingHorizontal: 20,
		paddingVertical: 11,
	},
	btnSecondaryText: {
		color: theme.colors.textPrimary,
		fontSize: 14,
		fontWeight: "600",
	},
	// ─── Formula pills ────────────────────────────────────────────────
	formulaRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		marginTop: 6,
	},
	formulaPill: {
		backgroundColor: theme.colors.surfaceElevated,
		borderColor: theme.colors.border,
		borderRadius: 16,
		borderWidth: 1,
		flex: 1,
		minWidth: 140,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	formulaLabel: {
		color: theme.colors.textSecondary,
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 0.6,
		textTransform: "uppercase",
	},
	formulaValue: {
		color: theme.colors.accent,
		fontSize: 20,
		fontWeight: "700",
		marginTop: 4,
	},
	// ─── Metrics grid ─────────────────────────────────────────────────
	metricsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	metricCard: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderRadius: 22,
		borderWidth: 1,
		flexGrow: 1,
		minWidth: 140,
		paddingHorizontal: 16,
		paddingVertical: 16,
	},
	metricLabel: {
		color: theme.colors.textSecondary,
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 0.8,
		marginBottom: 10,
		textTransform: "uppercase",
	},
	metricValue: {
		color: theme.colors.textPrimary,
		fontSize: 24,
		fontWeight: "700",
	},
	metricLoader: {
		alignSelf: "flex-start",
		marginTop: 4,
	},
	// ─── Breakdown ────────────────────────────────────────────────────
	breakdownRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		marginTop: 12,
	},
	breakdownItem: {
		flex: 1,
		minWidth: 140,
	},
	breakdownLabel: {
		color: theme.colors.textSecondary,
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 0.6,
		marginBottom: 6,
		textTransform: "uppercase",
	},
	breakdownValue: {
		color: theme.colors.textPrimary,
		fontSize: 20,
		fontWeight: "700",
	},
	// ─── Payment list ─────────────────────────────────────────────────
	paymentList: {
		gap: 10,
		marginTop: 12,
	},
	paymentRow: {
		alignItems: "center",
		backgroundColor: theme.colors.surfaceElevated,
		borderColor: theme.colors.border,
		borderRadius: 18,
		borderWidth: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	paymentMethod: {
		color: theme.colors.textPrimary,
		fontSize: 15,
		fontWeight: "700",
		marginBottom: 4,
	},
	paymentMeta: {
		color: theme.colors.textSecondary,
		fontSize: 13,
	},
	paymentTotal: {
		color: theme.colors.accent,
		fontSize: 16,
		fontWeight: "700",
	},
	// ─── Empty state ──────────────────────────────────────────────────
	emptyState: {
		alignItems: "center",
		backgroundColor: theme.colors.surfaceElevated,
		borderColor: theme.colors.border,
		borderRadius: 18,
		borderWidth: 1,
		marginTop: 12,
		paddingHorizontal: 20,
		paddingVertical: 26,
	},
	emptyTitle: {
		color: theme.colors.textPrimary,
		fontSize: 17,
		fontWeight: "700",
		marginBottom: 8,
	},
	emptySubtitle: {
		color: theme.colors.textSecondary,
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
	},
	// ─── Ledger ───────────────────────────────────────────────────────
	ledgerList: {
		gap: 10,
		marginTop: 12,
	},
	ledgerRow: {
		alignItems: "center",
		backgroundColor: theme.colors.surfaceElevated,
		borderColor: theme.colors.border,
		borderRadius: 18,
		borderWidth: 1,
		flexDirection: "row",
		gap: 14,
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	ledgerCopy: {
		flex: 1,
	},
	ledgerTitle: {
		color: theme.colors.textPrimary,
		fontSize: 15,
		fontWeight: "700",
		marginBottom: 4,
	},
	ledgerMeta: {
		color: theme.colors.textSecondary,
		fontSize: 13,
		marginTop: 2,
	},
	ledgerAmount: {
		color: theme.colors.accent,
		fontSize: 16,
		fontWeight: "700",
	},
});


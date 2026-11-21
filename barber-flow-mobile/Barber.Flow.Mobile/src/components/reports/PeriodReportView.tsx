import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../../context/LanguageContext";
import { formatDayLabel } from "../../features/reports/reportPeriods";
import { getIntlLocale } from "../../localization/i18n";
import type { AppTheme } from "../../theme/themes";
import { useAppTheme } from "../../theme/ThemeContext";
import type { PeriodReport, PeriodReportDay, ReportPeriodType } from "../../types/reports";
import { formatCurrency } from "../../utils/currency";

type Props = {
	error: string | null;
	isLoading: boolean;
	onRetry: () => void;
	/** Opens the daily report of the tapped day. */
	onSelectDay: (date: string) => void;
	period: ReportPeriodType;
	report: PeriodReport | null;
};

/**
 * Weekly / monthly report body: the same cards as the daily report (totals, formula, collections) and a
 * "Ver detalle" button that expands the per-day table. The hero (period chips and date navigation) lives in
 * DailyReportScreen.
 */
export const PeriodReportView = ({ error, isLoading, onRetry, onSelectDay, period, report }: Props) => {
	const { language, translateText } = useTranslation();
	const { theme } = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const locale = getIntlLocale(language);

	if (error && !isLoading) {
		return (
			<View style={[styles.card, styles.errorCard]}>
				<Text style={styles.errorTitle}>{translateText("dailyReport.loadErrorTitle")}</Text>
				<Text style={styles.sectionSubtitle}>{error}</Text>
				<Pressable onPress={onRetry} style={styles.btnSecondary}>
					<Text style={styles.btnSecondaryText}>{translateText("dailyReport.retry")}</Text>
				</Pressable>
			</View>
		);
	}

	const metricCards = [
		{ label: translateText("dailyReport.metrics.customersServed"), value: String(report?.totalCustomersServed ?? 0) },
		{ label: translateText("dailyReport.metrics.grossRevenue"), value: formatCurrency(report?.grossRevenue ?? 0, locale) },
		{ label: translateText("dailyReport.metrics.netProfit"), value: formatCurrency(report?.netProfit ?? 0, locale) },
	];

	const countedDays = report?.countedDays ?? 0;
	const paymentRows = (report?.paymentMethodBreakdown ?? []).filter(
		(item) => item.paymentMethod !== "none" || item.appointmentCount > 0,
	);

	const paymentLabel = (paymentMethod: string) =>
		paymentMethod === "none"
			? translateText("dailyReport.paymentMethodNotSet")
			: translateText(`appointments.paymentMethods.${paymentMethod}`);

	return (
		<>
			{/* ─── Totals ─────────────────────────────────────────── */}
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

			{/* ─── Formula ────────────────────────────────────────── */}
			<View style={styles.card}>
				<Text style={styles.eyebrow}>{translateText("dailyReport.formulaEyebrow")}</Text>
				<Text style={styles.sectionTitle}>
					{translateText(period === "weekly" ? "dailyReport.formulaTitleWeekly" : "dailyReport.formulaTitleMonthly")}
				</Text>
				<Text style={styles.sectionSubtitle}>{translateText("dailyReport.formulaSubtitlePeriod")}</Text>

				<View style={styles.breakdownRow}>
					<View style={styles.breakdownItem}>
						<Text style={styles.breakdownLabel}>{translateText("dailyReport.commissionAmount")}</Text>
						<Text style={styles.breakdownValue}>{formatCurrency(report?.commissionAmount ?? 0, locale)}</Text>
					</View>
					<View style={styles.breakdownItem}>
						<Text style={styles.breakdownLabel}>{translateText("dailyReport.fixedExpensePeriod")}</Text>
						<Text style={styles.breakdownValue}>{formatCurrency(report?.fixedExpenseTotal ?? 0, locale)}</Text>
						<Text style={styles.breakdownNote}>
							{translateText(
								countedDays === 1 ? "dailyReport.fixedExpenseCalc_one" : "dailyReport.fixedExpenseCalc_other",
								{ amount: formatCurrency(report?.fixedDailyExpense ?? 0, locale), count: countedDays },
							)}
						</Text>
					</View>
				</View>
			</View>

			{/* ─── Collections ────────────────────────────────────── */}
			<View style={styles.card}>
				<Text style={styles.eyebrow}>{translateText("dailyReport.collectionsEyebrow")}</Text>
				<Text style={styles.sectionTitle}>{translateText("dailyReport.collectionsTitle")}</Text>
				<Text style={styles.sectionSubtitle}>
					{translateText(
						period === "weekly" ? "dailyReport.collectionsSubtitleWeekly" : "dailyReport.collectionsSubtitleMonthly",
					)}
				</Text>

				<View style={styles.paymentList}>
					{paymentRows.map((item) => (
						<View key={item.paymentMethod} style={styles.paymentRow}>
							<View>
								<Text style={styles.paymentMethod}>{paymentLabel(item.paymentMethod)}</Text>
								<Text style={styles.paymentMeta}>
									{translateText(
										item.appointmentCount === 1
											? "dailyReport.completedAppointmentMeta_one"
											: "dailyReport.completedAppointmentMeta_other",
										{ count: item.appointmentCount },
									)}
								</Text>
							</View>
							<Text style={styles.paymentTotal}>{formatCurrency(item.total, locale)}</Text>
						</View>
					))}
				</View>
			</View>

			{/* ─── Per-day detail (hidden until "Ver detalle") ────── */}
			{report ? (
				<DaysDetailCard
					days={report.days}
					key={`${report.periodType}-${report.from}`}
					locale={locale}
					onSelectDay={onSelectDay}
				/>
			) : null}
		</>
	);
};

type DaysDetailCardProps = {
	days: PeriodReportDay[];
	locale: string;
	onSelectDay: (date: string) => void;
};

const DaysDetailCard = ({ days, locale, onSelectDay }: DaysDetailCardProps) => {
	const { translateText } = useTranslation();
	const { theme } = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const [open, setOpen] = useState(false);

	return (
		<View style={styles.card}>
			<Text style={styles.eyebrow}>{translateText("dailyReport.detailEyebrow")}</Text>
			<Text style={styles.sectionTitle}>{translateText("dailyReport.detailTitle")}</Text>
			<Text style={styles.sectionSubtitle}>{translateText("dailyReport.detailSubtitle")}</Text>

			<Pressable
				accessibilityRole="button"
				accessibilityState={{ expanded: open }}
				onPress={() => setOpen((current) => !current)}
				style={styles.detailButton}
			>
				<Text style={styles.detailButtonText}>
					{translateText(open ? "dailyReport.hideDetail" : "dailyReport.viewDetail")}
				</Text>
				<Ionicons color={theme.colors.accent} name={open ? "chevron-up" : "chevron-down"} size={18} />
			</Pressable>

			{open ? (
				<View style={styles.dayList}>
					<View style={styles.dayHeaderRow}>
						<Text style={[styles.dayHeaderText, styles.dayColName]}>{translateText("dailyReport.columnDay")}</Text>
						<Text style={[styles.dayHeaderText, styles.dayColCustomers]}>{translateText("dailyReport.columnCustomers")}</Text>
						<Text style={[styles.dayHeaderText, styles.dayColMoney]}>{translateText("dailyReport.columnGross")}</Text>
						<Text style={[styles.dayHeaderText, styles.dayColMoney]}>{translateText("dailyReport.columnNet")}</Text>
					</View>

					{days.map((day) => {
						const hasSales = day.totalCustomersServed > 0;
						return (
							<Pressable key={day.date} onPress={() => onSelectDay(day.date)} style={styles.dayRow}>
								<Text style={[styles.dayText, styles.dayName, styles.dayColName, !hasSales && styles.dayMuted]}>
									{formatDayLabel(day.date, locale)}
								</Text>
								<Text style={[styles.dayText, styles.dayColCustomers, !hasSales && styles.dayMuted]}>
									{day.totalCustomersServed}
								</Text>
								<Text style={[styles.dayText, styles.dayColMoney, !hasSales && styles.dayMuted]}>
									{formatCurrency(day.grossRevenue, locale)}
								</Text>
								<Text
									style={[
										styles.dayText,
										styles.dayNet,
										styles.dayColMoney,
										day.netProfit < 0 && styles.dayNegative,
										!hasSales && day.netProfit >= 0 && styles.dayMuted,
									]}
								>
									{formatCurrency(day.netProfit, locale)}
								</Text>
							</Pressable>
						);
					})}
				</View>
			) : null}
		</View>
	);
};

// Same look as the daily report cards in DailyReportScreen (same tokens, radii and spacing).
const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
		card: {
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderRadius: 24,
			borderWidth: 1,
			gap: 6,
			paddingHorizontal: 18,
			paddingVertical: 20,
		},
		errorCard: {
			alignItems: "center",
			borderColor: theme.colors.error,
		},
		errorTitle: {
			color: theme.colors.textPrimary,
			fontSize: 17,
			fontWeight: "700",
			textAlign: "center",
		},
		eyebrow: {
			color: theme.colors.accent,
			fontSize: 11,
			fontWeight: "700",
			letterSpacing: 1.4,
			marginBottom: 2,
			textTransform: "uppercase",
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
		btnSecondary: {
			alignItems: "center",
			backgroundColor: theme.colors.surfaceElevated,
			borderColor: theme.colors.border,
			borderRadius: 14,
			borderWidth: 1,
			marginTop: 8,
			paddingHorizontal: 20,
			paddingVertical: 11,
		},
		btnSecondaryText: {
			color: theme.colors.textPrimary,
			fontSize: 14,
			fontWeight: "600",
		},
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
		breakdownNote: {
			color: theme.colors.textSecondary,
			fontSize: 12,
			marginTop: 2,
		},
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
		detailButton: {
			alignItems: "center",
			borderColor: theme.colors.accent,
			borderRadius: 14,
			borderWidth: 1,
			flexDirection: "row",
			gap: 6,
			justifyContent: "center",
			marginTop: 8,
			paddingVertical: 12,
		},
		detailButtonText: {
			color: theme.colors.accent,
			fontSize: 14,
			fontWeight: "700",
		},
		dayList: {
			gap: 8,
			marginTop: 12,
		},
		dayHeaderRow: {
			alignItems: "center",
			flexDirection: "row",
			paddingHorizontal: 14,
		},
		dayHeaderText: {
			color: theme.colors.textSecondary,
			fontSize: 11,
			fontWeight: "700",
			letterSpacing: 0.6,
			textTransform: "uppercase",
		},
		dayRow: {
			alignItems: "center",
			backgroundColor: theme.colors.surfaceElevated,
			borderColor: theme.colors.border,
			borderRadius: 14,
			borderWidth: 1,
			flexDirection: "row",
			paddingHorizontal: 14,
			paddingVertical: 12,
		},
		dayText: {
			color: theme.colors.textPrimary,
			fontSize: 13,
		},
		dayName: {
			fontWeight: "700",
		},
		dayNet: {
			color: theme.colors.accent,
			fontWeight: "700",
		},
		dayNegative: {
			color: theme.colors.error,
		},
		dayMuted: {
			color: theme.colors.textSecondary,
		},
		dayColName: {
			flex: 1.4,
			textAlign: "left",
		},
		dayColCustomers: {
			flex: 0.9,
			textAlign: "right",
		},
		dayColMoney: {
			flex: 1.4,
			textAlign: "right",
		},
	});

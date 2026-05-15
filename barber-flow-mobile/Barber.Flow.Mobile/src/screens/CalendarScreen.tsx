import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ImageBackground, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { addDays, endOfMonth, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { DrawerActions } from "@react-navigation/core";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppointmentCard } from "../components/calendar/AppointmentCard";
import { ScreenLayout } from "../components/ScreenLayout";
import { useTranslation } from "../context/LanguageContext";
import { useAppointmentStore } from "../features/appointments/appointment.store";
import type { Appointment } from "../features/appointments/appointments.types";
import { getIntlLocale } from "../localization/i18n";
import type { RouteProp } from "@react-navigation/native";
import type { CalendarStackParamList } from "../navigation/CalendarNavigator";

const COLORS = {
	bg: "#0D0D0D",
	surface: "#1A1A1A",
	surfaceElevated: "#252525",
	gold: "#C9A84C",
	goldLight: "#E5C878",
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
	border: "#3A3A3A",
	overlay: "rgba(0,0,0,0.58)",
	error: "#F87171",
	errorBg: "rgba(248,113,113,0.10)",
} as const;

LocaleConfig.locales.en = {
	monthNames: [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	],
	monthNamesShort: [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	],
	dayNames: [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	],
	dayNamesShort: ["S", "M", "T", "W", "T", "F", "S"],
	today: "Today",
};
LocaleConfig.locales.es = {
	monthNames: [
		"Enero",
		"Febrero",
		"Marzo",
		"Abril",
		"Mayo",
		"Junio",
		"Julio",
		"Agosto",
		"Septiembre",
		"Octubre",
		"Noviembre",
		"Diciembre",
	],
	monthNamesShort: [
		"Ene",
		"Feb",
		"Mar",
		"Abr",
		"May",
		"Jun",
		"Jul",
		"Ago",
		"Sep",
		"Oct",
		"Nov",
		"Dic",
	],
	dayNames: [
		"Domingo",
		"Lunes",
		"Martes",
		"Miercoles",
		"Jueves",
		"Viernes",
		"Sabado",
	],
	dayNamesShort: ["D", "L", "M", "M", "J", "V", "S"],
	today: "Hoy",
};
type ViewMode = "month" | "week" | "day";

const DATE_FORMAT = "yyyy-MM-dd";

const toDate = (dateString: string) => new Date(`${dateString}T12:00:00`);

	const getWeekDates = (dateString: string) => {
	const startDate = startOfWeek(toDate(dateString), { weekStartsOn: 1 });

	return Array.from({ length: 7 }, (_, index) =>
		format(addDays(startDate, index), DATE_FORMAT),
	);
};

	const formatLongDate = (dateString: string, locale: string) =>
	new Intl.DateTimeFormat(locale, {
		weekday: "short",
		month: "long",
		day: "numeric",
	}).format(toDate(dateString));

	const formatWeekday = (dateString: string, locale: string) =>
	new Intl.DateTimeFormat(locale, {
		weekday: "narrow",
	}).format(toDate(dateString));

	const formatDayNumber = (dateString: string, locale: string) =>
	new Intl.DateTimeFormat(locale, {
		day: "numeric",
	}).format(toDate(dateString));

export const CalendarScreen: React.FC = () => {
	const navigation = useNavigation<NativeStackNavigationProp<CalendarStackParamList, "CalendarHome">>();
	const route = useRoute<RouteProp<CalendarStackParamList, "CalendarHome">>();
	const { language, translateText } = useTranslation();
	const {
		appointments,
		isLoading,
		getAppointmentsByDate,
		fetchAppointmentsByDateRange,
	} = useAppointmentStore();

	const today = format(new Date(), DATE_FORMAT);
	const [viewMode, setViewMode] = useState<ViewMode>("month");
	const [selectedDate, setSelectedDate] = useState(today);
	const [visibleMonth, setVisibleMonth] = useState(today);
	const locale = getIntlLocale(language);

	const lastFetchedMonthRef = useRef("");
	const lastFetchedWeekRef = useRef("");
	const lastFetchedDayRef = useRef("");

	const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

	useEffect(() => {
		if (viewMode !== "month") return;
		const monthStart = format(startOfMonth(parseISO(visibleMonth)), DATE_FORMAT);
		if (lastFetchedMonthRef.current === monthStart) return;
		lastFetchedMonthRef.current = monthStart;
		const monthEnd = format(endOfMonth(parseISO(visibleMonth)), DATE_FORMAT);
		void fetchAppointmentsByDateRange(monthStart, monthEnd);
	}, [viewMode, visibleMonth, fetchAppointmentsByDateRange]);

	useEffect(() => {
		if (viewMode !== "week") return;
		const weekStart = weekDates[0];
		if (lastFetchedWeekRef.current === weekStart) return;
		lastFetchedWeekRef.current = weekStart;
		void fetchAppointmentsByDateRange(weekStart, weekDates[6]);
	}, [viewMode, weekDates, fetchAppointmentsByDateRange]);

	useEffect(() => {
		if (viewMode !== "day") return;
		if (lastFetchedDayRef.current === selectedDate) return;
		lastFetchedDayRef.current = selectedDate;
		void fetchAppointmentsByDateRange(selectedDate, selectedDate);
	}, [viewMode, selectedDate, fetchAppointmentsByDateRange]);

	useEffect(() => {
		LocaleConfig.defaultLocale = language;
	}, [language]);

	useEffect(() => {
		if (!route.params?.source) {
			return;
		}

		if (route.params.source !== "notification" && route.params.source !== "clientSaved") {
			return;
		}

		if (route.params.date) {
			setSelectedDate(route.params.date);
			setVisibleMonth(route.params.date);
		}

		setViewMode(route.params.initialView ?? "day");

		navigation.setParams?.({
			date: undefined,
			initialView: undefined,
			source: undefined,
		});
	}, [navigation, route.params, today]);

	const selectedAppointments = getAppointmentsByDate(selectedDate);
	const weekAgenda = weekDates.map((date) => ({
		date,
		appointments: getAppointmentsByDate(date),
	}));

	const appointmentDates = new Set(appointments.map((appointment) => appointment.date));
	const datesToRender = new Set([today, selectedDate, ...appointmentDates]);
	const markedDates: Record<string, any> = {};

	datesToRender.forEach((date) => {
		const hasAppointments = appointmentDates.has(date);
		const isSelected = date === selectedDate;
		const isToday = date === today;

		markedDates[date] = {
		marked: hasAppointments,
		dotColor: COLORS.gold,
		customStyles: {
			container: {
				backgroundColor: isSelected ? COLORS.gold : "transparent",
				borderColor: isToday ? COLORS.gold : COLORS.border,
				borderRadius: 16,
				borderWidth: isToday ? 1 : 0,
			},
			text: {
				color: isSelected ? COLORS.bg : COLORS.textPrimary,
				fontWeight: isSelected || isToday ? "700" : "500",
			},
		},
		};
	});

	const openCreateModal = (date: string) => {
		setSelectedDate(date);
		setVisibleMonth(date);
		navigation.navigate("AppointmentForm", {
			mode: "create",
			date,
			afterSave: "goBack",
		});
	};

	const handleSelectDay = (date: string) => {
		setSelectedDate(date);
		setViewMode("day");
	};

	const openEditModal = (appointment: Appointment) => {
		setSelectedDate(appointment.date);
		setVisibleMonth(appointment.date);
		navigation.navigate("AppointmentForm", {
			mode: "edit",
			date: appointment.date,
			appointmentId: appointment.id,
			afterSave: "goBack",
		});
	};

	const renderAppointmentList = (
		dayAppointments: Appointment[],
		emptyMessage: string,
	) => {
		if (dayAppointments.length === 0) {
			return (
				<View style={styles.emptyState}>
					<Text style={styles.emptyTitle}>{translateText("calendar.emptyTitle")}</Text>
					<Text style={styles.emptySubtitle}>{emptyMessage}</Text>
				</View>
			);
		}

		return (
			<View style={styles.listContent}>
				{dayAppointments.map((appointment) => (
				<AppointmentCard
					key={appointment.id}
					appointment={appointment}
					onPress={() => openEditModal(appointment)}
				/>
				))}
			</View>
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
				title={translateText("calendar.title")}
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
				{/* ─── Summary card ─────────────────────────────────────── */}
				<View style={styles.summaryCard}>
					<View style={styles.summaryTopRow}>
						<View style={styles.summaryTextBlock}>
							<Text style={styles.summaryLabel}>
								{translateText("calendar.selectedDate")}
							</Text>
							<Text style={styles.summaryDate}>
								{formatLongDate(selectedDate, locale)}
							</Text>
							<Text style={styles.summaryCount}>
								{translateText(
									selectedAppointments.length === 1
										? "calendar.appointmentCountForDay_one"
										: "calendar.appointmentCountForDay_other",
									{ count: selectedAppointments.length },
								)}
							</Text>
						</View>

						<View style={styles.summaryActions}>
							<Pressable
								style={({ pressed }) => [styles.goldBtn, pressed && styles.goldBtnPressed]}
								onPress={() => openCreateModal(selectedDate)}
							>
								<Text style={styles.goldBtnText}>{translateText("calendar.newAppointment")}</Text>
							</Pressable>
							<Pressable
								onPress={() => setSelectedDate(today)}
								style={({ pressed }) => [styles.textBtn, pressed && { opacity: 0.6 }]}
							>
								<Text style={styles.textBtnLabel}>{translateText("common.today")}</Text>
							</Pressable>
						</View>
					</View>

					{/* View mode pills */}
					<View style={styles.viewModeRow}>
						{(["month", "week", "day"] as ViewMode[]).map((mode) => {
							const active = viewMode === mode;
							return (
								<Pressable
									key={mode}
									onPress={() => setViewMode(mode)}
									style={[styles.viewModeBtn, active && styles.viewModeBtnActive]}
								>
									<Text style={[styles.viewModeBtnText, active && styles.viewModeBtnTextActive]}>
										{mode === "month"
											? translateText("calendar.monthView")
											: mode === "week"
											? translateText("calendar.viewWeek")
											: translateText("calendar.viewDay")}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</View>

				{/* ─── Month view ───────────────────────────────────────── */}
				{viewMode === "month" ? (
					<View style={styles.calendarCard}>
						<View style={styles.sectionHeader}>
							<View>
								<Text style={styles.sectionLabel}>{translateText("calendar.monthView")}</Text>
								<Text style={styles.sectionTitle}>{formatLongDate(visibleMonth, locale)}</Text>
							{isLoading && <ActivityIndicator size="small" color={COLORS.gold} style={{ marginTop: 4 }} />}
						</View>
						<Pressable onPress={() => openCreateModal(selectedDate)}>
							<Text style={styles.goldLink}>{translateText("calendar.schedule")}</Text>
						</Pressable>
						</View>

						<Calendar
							current={selectedDate}
							markingType="custom"
							markedDates={markedDates}
							onDayPress={(day) => handleSelectDay(day.dateString)}
							onDayLongPress={(day) => openCreateModal(day.dateString)}
							onMonthChange={(month) => setVisibleMonth(month.dateString)}
							theme={{
								backgroundColor: COLORS.surface,
								calendarBackground: COLORS.surface,
								dayTextColor: COLORS.textPrimary,
								monthTextColor: COLORS.textPrimary,
								textDisabledColor: COLORS.textSecondary,
								todayTextColor: COLORS.gold,
								arrowColor: COLORS.gold,
								textSectionTitleColor: COLORS.textSecondary,
							}}
							style={styles.calendar}
						/>

						<Text style={styles.calendarHint}>{translateText("calendar.hint")}</Text>

						<View style={styles.divider} />

						<View style={styles.sectionHeader}>
							<View>
								<Text style={styles.sectionLabel}>{translateText("calendar.agendaDay")}</Text>
								<Text style={styles.sectionTitle}>{formatLongDate(selectedDate, locale)}</Text>
							</View>
						</View>

						{renderAppointmentList(
							selectedAppointments,
							translateText("calendar.emptyBodyMonth"),
						)}
					</View>
				) : null}

				{/* ─── Week view ────────────────────────────────────────── */}
				{viewMode === "week" ? (
					<View style={styles.calendarCard}>
						<View style={styles.sectionHeader}>
							<View>
								<Text style={styles.sectionLabel}>{translateText("calendar.viewWeek")}</Text>
								<Text style={styles.sectionTitle}>
									{translateText("calendar.weekOf", { date: formatLongDate(selectedDate, locale) })}
								</Text>
								{isLoading && <ActivityIndicator size="small" color={COLORS.gold} style={{ marginTop: 4 }} />}
							</View>
							<Pressable onPress={() => openCreateModal(selectedDate)}>
								<Text style={styles.goldLink}>{translateText("calendar.schedule")}</Text>
							</Pressable>
						</View>

						<View style={styles.weekRow}>
							{weekAgenda.map(({ date, appointments: dayAppointments }) => {
								const isSelected = date === selectedDate;
								return (
									<Pressable
										key={date}
										onPress={() => setSelectedDate(date)}
										style={[
											styles.weekDayChip,
											isSelected && styles.weekDayChipActive,
										]}
									>
										<Text style={[styles.weekDayWeekday, isSelected && styles.weekDayTextActive]}>
											{formatWeekday(date, locale)}
										</Text>
										<Text style={[styles.weekDayNumber, isSelected && styles.weekDayTextActive]}>
											{formatDayNumber(date, locale)}
										</Text>
										<Text style={[styles.weekDayCount, isSelected && styles.weekDayTextActive]}>
											{translateText(
												dayAppointments.length === 1
													? "calendar.weekSummary_one"
													: "calendar.weekSummary_other",
												{ count: dayAppointments.length },
											)}
										</Text>
									</Pressable>
								);
							})}
						</View>

						<View style={styles.divider} />

						{renderAppointmentList(
							selectedAppointments,
							translateText("calendar.emptyBodyWeek"),
						)}
					</View>
				) : null}

				{/* ─── Day view ─────────────────────────────────────────── */}
				{viewMode === "day" ? (
					<View style={styles.calendarCard}>
						<View style={styles.sectionHeader}>
							<View>
								<Text style={styles.sectionLabel}>{translateText("calendar.viewDay")}</Text>
								<Text style={styles.sectionTitle}>{formatLongDate(selectedDate, locale)}</Text>
								{isLoading && <ActivityIndicator size="small" color={COLORS.gold} style={{ marginTop: 4 }} />}
							</View>
							<Pressable
								style={({ pressed }) => [styles.goldBtn, pressed && styles.goldBtnPressed]}
								onPress={() => openCreateModal(selectedDate)}
							>
								<Text style={styles.goldBtnText}>{translateText("calendar.newAppointment")}</Text>
							</Pressable>
						</View>

						{renderAppointmentList(
							selectedAppointments,
							translateText("calendar.emptyBodyDay"),
						)}
					</View>
				) : null}

				</KeyboardAwareScrollView>
			</ScreenLayout>
		</ImageBackground>
	);
};

const styles = StyleSheet.create({
	flex: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 32,
		gap: 16,
	},
	// ─── Summary card
	summaryCard: {
		backgroundColor: COLORS.surface,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: COLORS.border,
		padding: 20,
		shadowColor: COLORS.gold,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 4,
	},
	summaryTopRow: {
		gap: 16,
	},
	summaryTextBlock: {
		gap: 4,
	},
	summaryLabel: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.2,
		textTransform: "uppercase",
		color: COLORS.gold,
	},
	summaryDate: {
		fontSize: 26,
		fontWeight: "700",
		textTransform: "capitalize",
		color: COLORS.textPrimary,
	},
	summaryCount: {
		fontSize: 14,
		color: COLORS.textSecondary,
	},
	summaryActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		flexWrap: "wrap",
	},
	// ─── Gold button
	goldBtn: {
		backgroundColor: COLORS.gold,
		borderRadius: 14,
		height: 44,
		paddingHorizontal: 18,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: COLORS.gold,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 8,
		elevation: 6,
	},
	goldBtnPressed: {
		opacity: 0.85,
	},
	goldBtnText: {
		color: COLORS.bg,
		fontWeight: "800",
		fontSize: 14,
		letterSpacing: 0.3,
	},
	// ─── Text link button
	textBtn: {
		paddingHorizontal: 8,
		paddingVertical: 6,
	},
	textBtnLabel: {
		color: COLORS.gold,
		fontWeight: "600",
		fontSize: 14,
	},
	// ─── View mode pills
	viewModeRow: {
		flexDirection: "row",
		marginTop: 16,
		backgroundColor: COLORS.surfaceElevated,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: COLORS.border,
		padding: 4,
		gap: 4,
	},
	viewModeBtn: {
		flex: 1,
		paddingVertical: 8,
		borderRadius: 10,
		alignItems: "center",
	},
	viewModeBtnActive: {
		backgroundColor: COLORS.gold,
	},
	viewModeBtnText: {
		fontSize: 11,
		fontWeight: "600",
		color: COLORS.textSecondary,
		letterSpacing: 0.4,
	},
	viewModeBtnTextActive: {
		color: COLORS.bg,
		fontWeight: "800",
	},
	// ─── Calendar / section card
	calendarCard: {
		backgroundColor: COLORS.surface,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: COLORS.border,
		padding: 20,
		shadowColor: COLORS.gold,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 4,
	},
	calendar: {
		marginTop: 8,
	},
	calendarHint: {
		fontSize: 13,
		marginTop: 12,
		color: COLORS.textSecondary,
	},
	// ─── Section header
	sectionHeader: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 16,
		marginBottom: 4,
	},
	sectionLabel: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.2,
		textTransform: "uppercase",
		color: COLORS.gold,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "700",
		marginTop: 4,
		textTransform: "capitalize",
		color: COLORS.textPrimary,
	},
	goldLink: {
		color: COLORS.gold,
		fontWeight: "700",
		fontSize: 14,
	},
	// ─── Divider
	divider: {
		height: 1,
		backgroundColor: COLORS.border,
		marginVertical: 20,
	},
	// ─── Week chips
	weekRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 16,
	},
	weekDayChip: {
		alignItems: "center",
		borderRadius: 14,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surfaceElevated,
		gap: 4,
		minWidth: 68,
		paddingHorizontal: 10,
		paddingVertical: 10,
	},
	weekDayChipActive: {
		backgroundColor: COLORS.gold,
		borderColor: COLORS.gold,
		shadowColor: COLORS.gold,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.4,
		shadowRadius: 6,
		elevation: 4,
	},
	weekDayWeekday: {
		fontSize: 11,
		fontWeight: "600",
		color: COLORS.textSecondary,
	},
	weekDayNumber: {
		fontSize: 18,
		fontWeight: "700",
		color: COLORS.textPrimary,
	},
	weekDayCount: {
		fontSize: 10,
		color: COLORS.textSecondary,
	},
	weekDayTextActive: {
		color: COLORS.bg,
	},
	// ─── Screen background
	screenBg: {
		flex: 1,
	},
	screenOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(13,13,13,0.65)",
	},
	// ─── Appointment list
	listContent: {
		marginTop: 16,
	},
	// ─── Empty state
	emptyState: {
		alignItems: "center",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surfaceElevated,
		marginTop: 16,
		paddingHorizontal: 20,
		paddingVertical: 28,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 8,
		color: COLORS.textPrimary,
	},
	emptySubtitle: {
		fontSize: 14,
		textAlign: "center",
		color: COLORS.textSecondary,
	},
});
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../utils/errors";
import { isPastDateTime } from "../utils/formatUtil";
import { Platform, Pressable, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CalendarStackParamList } from "../navigation/CalendarNavigator";
import type { AppTabParamList } from "../navigation/AppNavigator";
import { Text, View } from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";
import { AppointmentForm } from "../components/calendar/AppointmentForm";
import { ClientSearchModal } from "../components/clients/ClientSearchModal";
import { ClientSelectorModal } from "../components/appointments/ClientSelectorModal";
import { useTranslation } from "../context/LanguageContext";
import { clientsService } from "../services/clientService";
import type { Client } from "../types/clients";

import { useAppointmentStore } from "../features/appointments/appointment.store";
import type {
  Appointment,
  AppointmentDraft,
  AppointmentStatus,
} from "../features/appointments/appointments.types";
import { mapClientPaymentMethodToAppointment } from "../features/appointments/appointments.types";
import { useAppointmentForm } from "../features/appointments/useAppointmentForm";
import { useDialog } from "../context/DialogContext";
import { useAuthStore } from "../store/auth.store";
import { settingsService } from "../services/settingsService";
import type { RecurrenceFrequency, RecurringAppointmentsResult } from "../features/appointments/appointments.types";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";
import { AppTheme } from "../theme/themes";
import { useAppTheme } from "../theme/ThemeContext";

export type AppointmentFormParams = {
  mode: "create" | "edit";
  date: string;
  appointmentId?: string;
  initialDraft?: Partial<AppointmentDraft>;
  afterSave?: "goBack" | "goToCalendarDay";
};

type AppointmentFormRoute = RouteProp<
  {
    AppointmentForm: AppointmentFormParams;
  },
  "AppointmentForm"
>;

export const AppointmentFormScreen = () => {
	const navigation = useNavigation<CompositeNavigationProp<NativeStackNavigationProp<CalendarStackParamList>, BottomTabNavigationProp<AppTabParamList>>>();
	const route = useRoute<AppointmentFormRoute>();
	const insets = useSafeAreaInsets();
	const { translateText } = useTranslation();
	const { showAlert } = useDialog();
	const { theme } = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const { appointments, addAppointment, addRecurringAppointments, updateAppointment, removeAppointment, moveAppointment } =
		useAppointmentStore();
	const user = useAuthStore((state) => state.user);

	// Recurrence is opt-in per barber: the admin sets how many appointments a series has (0 = hidden).
	const [maxRecurringAppointments, setMaxRecurringAppointments] = useState(0);
	const [isRecurring, setIsRecurring] = useState(false);
	const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>("weekly");

	const params = route.params;
	const afterSave = params.afterSave ?? "goBack";

	const editingAppointment: Appointment | null = useMemo(() => {
		if (params.mode !== "edit") {
			return null;
		}

		if (!params.appointmentId) {
			return null;
		}

		return (
			appointments.find(
				(appointment) => appointment.id === params.appointmentId,
			) ?? null
		);
	}, [appointments, params.appointmentId, params.mode]);

	const effectiveDate = editingAppointment?.date ?? params.date;

	const { draft, errors, touched, onBlurField, setField, setTouched, submit } =
		useAppointmentForm({
			date: effectiveDate,
			editingAppointment,
			initialDraft: params.initialDraft,
			enabled: true,
		});

	const [isSaving, setIsSaving] = useState(false);
	const [clientSearchVisible, setClientSearchVisible] = useState(false);
	const [clientSearchQuery, setClientSearchQuery] = useState("");
	const [clientSearchResults, setClientSearchResults] = useState<Client[]>([]);
	const [clientSearchLoading, setClientSearchLoading] = useState(false);
	const [clientSelectorVisible, setClientSelectorVisible] = useState(false);
	const [movePickerStep, setMovePickerStep] = useState<"date" | "time" | null>(null);
	const [pendingMoveDate, setPendingMoveDate] = useState<string | null>(null);

	const fetchClientSearchResults = useCallback(async (query: string) => {
		setClientSearchLoading(true);
		try {
			const results = await clientsService.find(query.trim() || undefined);
			setClientSearchResults(results ?? []);
		} catch {
			setClientSearchResults([]);
		} finally {
			setClientSearchLoading(false);
		}
	}, []);

	const handleOpenClientSearch = useCallback(() => {
		setClientSearchQuery("");
		setClientSearchResults([]);
		setClientSearchVisible(true);
	}, []);

	const handleClientSearchChange = useCallback((value: string) => {
		setClientSearchQuery(value);
	}, []);

	useEffect(() => {
		if (!clientSearchVisible) return;
		const timer = setTimeout(() => {
			void fetchClientSearchResults(clientSearchQuery);
		}, 300);
		return () => clearTimeout(timer);
	}, [clientSearchQuery, clientSearchVisible, fetchClientSearchResults]);

	const handleApplyClientSearch = useCallback(() => {
		void fetchClientSearchResults(clientSearchQuery);
	}, [clientSearchQuery, fetchClientSearchResults]);

	const handleSelectClient = useCallback((client: Client) => {
		const fullName = `${client.firstName} ${client.lastName}`.trim();
		setField("clientName", fullName);
		setField("phone", client.phone);
		const mappedPaymentMethod = mapClientPaymentMethodToAppointment(client.paymentMethod);
		if (mappedPaymentMethod) {
			setField("paymentMethodUsed", mappedPaymentMethod);
		}
		setClientSearchVisible(false);
	}, [setField]);

	const handleClientSelected = useCallback((client: Client | null) => {
		if (client) {
			const fullName = `${client.firstName} ${client.lastName}`.trim();
			setField("clientName", fullName);
			setField("phone", client.phone);
			const mappedPaymentMethod = mapClientPaymentMethodToAppointment(client.paymentMethod);
			if (mappedPaymentMethod) {
				setField("paymentMethodUsed", mappedPaymentMethod);
			}
		}
		// Store clientId in draft if needed for backend
		setClientSelectorVisible(false);
	}, [setField]);

	const title = useMemo(
		() =>
		params.mode === "edit"
			? translateText("calendar.appointmentModal.editTitle")
			: translateText("calendar.appointmentModal.title"),
		[params.mode, translateText],
	);

	const isReadOnly =
		params.mode === "edit" &&
		(draft.status === "completed" || draft.status === "cancelled");

	const handleStatusChange = useCallback((next: AppointmentStatus) => {
		const current = draft.status ?? "scheduled";

		var title = translateText("appointments.alerts.appointmentAlertTitle");

		if (next === "confirmed") {
			const appointmentDateTime = new Date(`${draft.date}T${draft.time || "00:00"}:00`);
			const hoursUntilAppointment = (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
			if (hoursUntilAppointment > 24) {
				showAlert(title, translateText("appointments.alerts.hoursUntilAppointmentIsConfirmed"));
				return;
			}

			if (current === "completed") {
				showAlert(title, translateText("appointments.alerts.noConfirmedIfCompleted"));
				return;
			}

			if (current === "cancelled") {
				showAlert(title, translateText("appointments.alerts.noConfirmedIfCancelled"));
				return;
			}
		}

		if (next === "scheduled") {
			if (current === "completed") {
				showAlert(title, translateText("appointments.alerts.noScheduledIfCompleted"));
				return;
			}

			if (current === "cancelled") {
				showAlert(title, translateText("appointments.alerts.noScheduledIfCancelled"));
				return;
			}
		}

		if (next === "completed" && current !== "confirmed") {
			showAlert(title, translateText("appointments.alerts.noCompletedIfNotConfirmed"));
			return;
		}

		if (next === "cancelled") {
			if (current === "completed") {
				showAlert(title, translateText("appointments.alerts.noCancelledIfCompleted"));
				return;
			}
			showAlert(
				title,
				translateText("appointments.alerts.areYouSureCancelAppointment"),
				[
					{ text: translateText("appointments.alerts.yesAlertResponse"), onPress: () => setField("status", "cancelled") },
					{ text: translateText("appointments.alerts.noAlertResponse"), style: "cancel" },
				],
			);
			return;
		}

		setField("status", next);
	}, [draft.status, draft.date, draft.time, showAlert, setField, translateText]);

	const handleMovePress = useCallback(() => {
		const current = draft.status ?? "scheduled";
		if (current === "completed" || current === "cancelled") {
			showAlert(
				translateText("appointments.alerts.moveAppointmentDialogTitle"),
				translateText("appointments.alerts.noMoveAppointmentConfirmation"),
			);
			return;
		}
		showAlert(
			translateText("appointments.alerts.moveAppointmentDialogTitle"),
			translateText("appointments.alerts.areYouSureMoveAppointment"),
			[
				{ text: translateText("appointments.alerts.yesAlertResponse"), onPress: () => setMovePickerStep("date") },
				{ text: translateText("appointments.alerts.noAlertResponse"), style: "cancel" },
			],
		);
	}, [draft.status, showAlert, translateText]);

	const handleMoveDateConfirm = useCallback((date: Date) => {
		setPendingMoveDate(format(date, "yyyy-MM-dd"));
		setMovePickerStep("time");
	}, []);

	// Unlike the old flow (which only prefilled the form and relied on "Guardar cambios"), moving now
	// runs the real PATCH right away with date AND time, same as web.
	const performMove = useCallback(async (newDate: string, newTime: string) => {
		if (!params.appointmentId) return;
		const moveTitle = translateText("appointments.alerts.moveAppointmentDialogTitle");
		setIsSaving(true);
		try {
			await moveAppointment(params.appointmentId, newDate, newTime);
		} catch (error) {
			setIsSaving(false);
			showAlert(moveTitle, getErrorMessage(error) || translateText("common.somethingWentWrong"));
			return;
		}
		setIsSaving(false);
		setField("date", newDate);
		setField("time", newTime);
		showAlert(moveTitle, translateText("appointments.alerts.moveSuccess"));
	}, [params.appointmentId, moveAppointment, setField, showAlert, translateText]);

	const handleMoveTimeConfirm = useCallback((time: Date) => {
		const newDate = pendingMoveDate;
		const newTime = format(time, "HH:mm");
		setPendingMoveDate(null);
		setMovePickerStep(null);
		if (!newDate) return;

		if (isPastDateTime(newDate, newTime)) {
			showAlert(
				translateText("appointments.alerts.moveAppointmentDialogTitle"),
				translateText("appointments.alerts.pastDateTimeMoveMessage"),
				[
					{ text: translateText("appointments.alerts.pastDateTimeMoveConfirm"), onPress: () => void performMove(newDate, newTime) },
					{ text: translateText("appointments.alerts.pastDateTimeReview"), style: "cancel" },
				],
			);
			return;
		}
		void performMove(newDate, newTime);
	}, [pendingMoveDate, performMove, showAlert, translateText]);

	useEffect(() => {
		if (params.mode === "edit" || !user?.userName) {
			return;
		}

		let mounted = true;
		void settingsService.getMaxRecurringAppointments(user.userName).then((max) => {
			if (mounted) {
				setMaxRecurringAppointments(max);
			}
		});

		return () => {
			mounted = false;
		};
	}, [params.mode, user?.userName]);

	const showRecurringResult = (result: RecurringAppointmentsResult) => {
		const title = translateText("appointments.alerts.appointmentAlertTitle");
		if (result.conflicts.length > 0) {
			const dates = result.conflicts.map((c) => c.date.split("-").reverse().join("/")).join(", ");
			showAlert(
				title,
				translateText("appointments.alerts.recurringPartial", {
					created: String(result.created.length),
					requested: String(result.requestedCount),
					dates,
				}),
			);
			return;
		}

		showAlert(
			title,
			translateText("appointments.alerts.recurringCreated", { created: String(result.created.length) }),
		);
	};

	const handleCancel = () => {
		navigation.goBack();
	};

const handleSubmit = async () => {
		if (params.mode === "edit") {
			if (!params.appointmentId) {
				showAlert(title, translateText("common.somethingWentWrong"));
				return;
			}

			if (!editingAppointment) {
				showAlert(title, translateText("common.somethingWentWrong"));
				navigation.goBack();
				return;
			}
		}

		const normalizedDraft = submit({ editingAppointment });

		if (!normalizedDraft) {
			return;
		}

		// Logging past appointments is legitimate (walk-ins recorded after the fact), so we
		// only ask for confirmation. When editing, only ask if the date/time actually changed.
		const scheduleChanged =
			params.mode !== "edit" ||
			!editingAppointment ||
			editingAppointment.date !== normalizedDraft.date ||
			editingAppointment.time !== normalizedDraft.time;

		if (scheduleChanged && isPastDateTime(normalizedDraft.date, normalizedDraft.time)) {
			showAlert(
				translateText("appointments.alerts.pastDateTimeTitle"),
				translateText("appointments.alerts.pastDateTimeMessage"),
				[
					{ text: translateText("appointments.alerts.pastDateTimeConfirm"), onPress: () => void saveAppointment(normalizedDraft) },
					{ text: translateText("appointments.alerts.pastDateTimeReview"), style: "cancel" },
				],
			);
			return;
		}

		await saveAppointment(normalizedDraft);
	};

	const handleDeletePress = () => {
		if (!params.appointmentId) return;
		const appointmentId = params.appointmentId;
		showAlert(
			translateText("appointments.alerts.deleteAppointmentTitle"),
			translateText("appointments.alerts.deleteAppointmentMessage"),
			[
				{
					text: translateText("appointments.alerts.deleteAppointmentCta"),
					style: "destructive",
					onPress: async () => {
						setIsSaving(true);
						try {
							await removeAppointment(appointmentId);
						} catch (error) {
							setIsSaving(false);
							showAlert(
								translateText("appointments.alerts.deleteAppointmentTitle"),
								getErrorMessage(error) || translateText("common.somethingWentWrong"),
							);
							return;
						}
						setIsSaving(false);
						navigation.goBack();
					},
				},
				{ text: translateText("appointments.alerts.noAlertResponse"), style: "cancel" },
			],
		);
	};

	const saveAppointment = async (normalizedDraft: NonNullable<ReturnType<typeof submit>>) => {
		setIsSaving(true);
		try {
			if (params.mode === "edit" && params.appointmentId) {
				await updateAppointment(params.appointmentId, normalizedDraft);
			} else if (isRecurring && maxRecurringAppointments > 0) {
				showRecurringResult(await addRecurringAppointments(normalizedDraft, recurrenceFrequency));
			} else {
				await addAppointment(normalizedDraft);
			}
		} catch (error) {
			showAlert(title, getErrorMessage(error) || translateText("common.somethingWentWrong"));
			setIsSaving(false);
			return;
		}
		setIsSaving(false);

		if (afterSave === "goToCalendarDay") {
			const parentTabNavigation = navigation.getParent?.() as
				| BottomTabNavigationProp<AppTabParamList>
				| undefined;

			if (typeof navigation.popToTop === "function") {
				navigation.popToTop();
			} else {
				navigation.goBack();
			}

			parentTabNavigation?.navigate("Calendar", {
				screen: "CalendarHome",
				params: {
					date: normalizedDraft.date,
					initialView: "day",
					source: "clientSaved",
				},
			});

			return;
		}

		navigation.goBack();
	};

	return (
		<ScreenLayout
			title={title}
			backgroundColor={theme.colors.background}
			hideHeaderActions
		>
			<KeyboardAwareScrollView
				style={styles.flex}
				contentContainerStyle={[
				styles.scrollContent,
				{
					paddingBottom: Math.max(24, insets.bottom + 24),
				},
				]}
				enableOnAndroid
				keyboardOpeningTime={0}
				extraScrollHeight={Platform.OS === "android" ? 120 : 20}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.formCard}>
					<Text style={styles.dateText}>
						{translateText("calendar.appointmentModal.dateSelected", {
						date: draft.date,
						})}
					</Text>

					<AppointmentForm
						draft={draft}
						errors={errors}
						touched={touched}
						isEditMode={params.mode === "edit"}
						readOnly={isReadOnly}
						onFieldChange={setField}
						onFieldBlur={onBlurField}
						onSubmit={handleSubmit}
						onCancel={handleCancel}
						isSaving={isSaving}
						onOpenClientSearch={handleOpenClientSearch}
						onStatusChange={handleStatusChange}
						recurrence={
							params.mode === "edit" || maxRecurringAppointments <= 0
								? undefined
								: {
									maxOccurrences: maxRecurringAppointments,
									enabled: isRecurring,
									frequency: recurrenceFrequency,
									onToggle: setIsRecurring,
									onFrequencyChange: setRecurrenceFrequency,
								}
						}
						onPaymentMethodTouched={() =>
						setTouched((currentTouched: Record<string, boolean>) => ({
							...currentTouched,
							paymentMethodUsed: true,
						}))
						}
					/>
				</View>
				{params.mode === "edit" && (draft.status === "scheduled" || draft.status === "confirmed") && (
					<View style={styles.moveCard}>
						<Text style={styles.moveCardEyebrow}>{translateText("appointments.alerts.moveAppointmentDialogTitle")}</Text>
						<Text style={styles.moveCardTitle}>{translateText("appointments.alerts.reassignDateTimeAppointment")}</Text>
						<Text style={styles.moveCardSubtitle}>
							{translateText("appointments.alerts.moveThisAppointmentToOtherSchedule").toLocaleLowerCase()}.
						</Text>
						<Pressable
							style={({ pressed }) => [styles.goldBtn, pressed && styles.goldBtnPressed]}
							onPress={handleMovePress}
						>
							<Text style={styles.goldBtnText}>{translateText("appointments.alerts.moveAppointmentCta")}</Text>
						</Pressable>
					</View>
				)}
				{params.mode === "edit" && !isReadOnly && (
					<Pressable
						style={({ pressed }) => [styles.deleteBtn, (pressed || isSaving) && styles.deleteBtnDim]}
						onPress={isSaving ? undefined : handleDeletePress}
						disabled={isSaving}
					>
						<Text style={styles.deleteBtnText}>{translateText("appointments.alerts.deleteAppointmentCta")}</Text>
					</Pressable>
				)}
			</KeyboardAwareScrollView>
			<ClientSearchModal
				clients={clientSearchResults}
				loading={clientSearchLoading}
				search={clientSearchQuery}
				visible={clientSearchVisible}
				onApplyFilter={handleApplyClientSearch}
				onClose={() => setClientSearchVisible(false)}
				onSearchChange={handleClientSearchChange}
				onSelectClient={handleSelectClient}
			/>
			<ClientSelectorModal
				visible={clientSelectorVisible}
				onClose={() => setClientSelectorVisible(false)}
				onClientSelected={handleClientSelected}
				initialPhone={draft.phone}
			/>
			<DateTimePickerModal
				isVisible={movePickerStep === "date"}
				mode="date"
				themeVariant="dark"
				accentColor={theme.colors.accent}
				onConfirm={handleMoveDateConfirm}
				onCancel={() => setMovePickerStep(null)}
			/>
			<DateTimePickerModal
				isVisible={movePickerStep === "time"}
				mode="time"
				themeVariant="dark"
				accentColor={theme.colors.accent}
				onConfirm={handleMoveTimeConfirm}
				onCancel={() => { setPendingMoveDate(null); setMovePickerStep(null); }}
			/>
		</ScreenLayout>
	);
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
	flex: {
		flex: 1,
	},
	scrollContent: {
		paddingTop: 10,
	},
	formCard: {
		backgroundColor: theme.colors.surface,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: 20,
		shadowColor: theme.colors.accent,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 4,
	},
	dateText: {
		fontSize: 14,
		marginBottom: 14,
		color: theme.colors.textSecondary,
	},
	moveCard: {
		backgroundColor: theme.colors.surface,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: 20,
		marginTop: 12,
		shadowColor: theme.colors.accent,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 4,
	},
	moveCardEyebrow: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: theme.colors.accent,
		marginBottom: 6,
	},
	moveCardTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.textPrimary,
		marginBottom: 4,
	},
	moveCardSubtitle: {
		fontSize: 13,
		color: theme.colors.textSecondary,
		marginBottom: 16,
	},
	goldBtn: {
		backgroundColor: theme.colors.accent,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: "center",
	},
	goldBtnPressed: {
		opacity: 0.85,
	},
	deleteBtn: {
		marginTop: 12,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: theme.colors.error,
		paddingVertical: 14,
		alignItems: "center",
	},
	deleteBtnDim: {
		opacity: 0.6,
	},
	deleteBtnText: {
		color: theme.colors.error,
		fontWeight: "700",
		fontSize: 15,
	},
	goldBtnText: {
		color: "#0F172A",
		fontWeight: "700",
		fontSize: 15,
	},
});


import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../utils/errors";
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
import { useTranslation } from "../context/LanguageContext";
import { clientsService } from "../services/clientService";
import type { Client } from "../types/clients";

const COLORS = {
	bg: "#0D0D0D",
	surface: "#1A1A1A",
	surfaceElevated: "#252525",
	gold: "#C9A84C",
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
	border: "#3A3A3A",
} as const;
import { useAppointmentStore } from "../features/appointments/appointment.store";
import type {
  Appointment,
  AppointmentDraft,
  AppointmentStatus,
} from "../features/appointments/appointments.types";
import { useAppointmentForm } from "../features/appointments/useAppointmentForm";
import { useDialog } from "../context/DialogContext";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";

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
	const { appointments, addAppointment, updateAppointment } =
		useAppointmentStore();

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
		setClientSearchVisible(false);
	}, [setField]);

	const title = useMemo(
		() =>
		params.mode === "edit"
			? translateText("calendar.appointmentModal.editTitle")
			: translateText("calendar.appointmentModal.title"),
		[params.mode, translateText],
	);

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
				showAlert(title, translateText("appointments.alerts.noCompletedIfNotConfirmed"));
				return;
			}
		}

		if (next === "scheduled") {
				if (current === "completed") {
				showAlert(title, translateText("appointments.alerts.noScheduledIfCompleted"));
				return;
			}
		}

		if (next === "completed" || next === "confirmed") {
			if (current === "cancelled") {
				showAlert(title, translateText("appointments.alerts.noCancelledIfCompleted"));
				return;
			}
		}

		if (next === "completed" && current !== "confirmed") {
			showAlert(title, translateText("appointments.alerts.noCompletedIfNotConfirmed"));
			return;
		}

		if (next === "cancelled") {
			//if (current === "confirmed" || current === "completed") { 
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

	const handleMoveTimeConfirm = useCallback((time: Date) => {
		if (pendingMoveDate) {
			setField("date", pendingMoveDate);
			setField("time", format(time, "HH:mm"));
		}
		setPendingMoveDate(null);
		setMovePickerStep(null);
	}, [pendingMoveDate, setField]);

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

		setIsSaving(true);
		try {
			if (params.mode === "edit" && params.appointmentId) {
				await updateAppointment(params.appointmentId, normalizedDraft);
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
			backgroundColor={COLORS.bg}
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
						onFieldChange={setField}
						onFieldBlur={onBlurField}
						onSubmit={handleSubmit}
						onCancel={handleCancel}
						isSaving={isSaving}
						onOpenClientSearch={handleOpenClientSearch}
						onStatusChange={handleStatusChange}
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
			<DateTimePickerModal
				isVisible={movePickerStep === "date"}
				mode="date"
				themeVariant="dark"
				accentColor="#C9A84C"
				onConfirm={handleMoveDateConfirm}
				onCancel={() => setMovePickerStep(null)}
			/>
			<DateTimePickerModal
				isVisible={movePickerStep === "time"}
				mode="time"
				themeVariant="dark"
				accentColor="#C9A84C"
				onConfirm={handleMoveTimeConfirm}
				onCancel={() => { setPendingMoveDate(null); setMovePickerStep(null); }}
			/>
		</ScreenLayout>
	);
};

const styles = StyleSheet.create({
	flex: {
		flex: 1,
	},
	scrollContent: {
		paddingTop: 10,
	},
	formCard: {
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
	dateText: {
		fontSize: 14,
		marginBottom: 14,
		color: COLORS.textSecondary,
	},
	moveCard: {
		backgroundColor: COLORS.surface,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: COLORS.border,
		padding: 20,
		marginTop: 12,
		shadowColor: COLORS.gold,
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
		color: COLORS.gold,
		marginBottom: 6,
	},
	moveCardTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: COLORS.textPrimary,
		marginBottom: 4,
	},
	moveCardSubtitle: {
		fontSize: 13,
		color: COLORS.textSecondary,
		marginBottom: 16,
	},
	goldBtn: {
		backgroundColor: COLORS.gold,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: "center",
	},
	goldBtnPressed: {
		opacity: 0.85,
	},
	goldBtnText: {
		color: COLORS.bg,
		fontWeight: "700",
		fontSize: 15,
	},
});

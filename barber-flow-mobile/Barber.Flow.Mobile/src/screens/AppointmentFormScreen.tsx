import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, StyleSheet } from "react-native";
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
} from "../features/appointments/appointments.types";
import { useAppointmentForm } from "../features/appointments/useAppointmentForm";

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

	const [clientSearchVisible, setClientSearchVisible] = useState(false);
	const [clientSearchQuery, setClientSearchQuery] = useState("");
	const [clientSearchResults, setClientSearchResults] = useState<Client[]>([]);
	const [clientSearchLoading, setClientSearchLoading] = useState(false);

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

	const handleCancel = () => {
		navigation.goBack();
	};

	const handleSubmit = () => {
		if (params.mode === "edit") {
			if (!params.appointmentId) {
				Alert.alert(title, translateText("common.somethingWentWrong"));
				return;
			}

			if (!editingAppointment) {
				Alert.alert(title, translateText("common.somethingWentWrong"));
				navigation.goBack();
				return;
			}
		}

		const normalizedDraft = submit({ editingAppointment });

		if (!normalizedDraft) {
			return;
		}

		if (params.mode === "edit" && params.appointmentId) {
			updateAppointment(params.appointmentId, normalizedDraft);
		} else {
			addAppointment(normalizedDraft);
		}

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
						date: effectiveDate,
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
						onOpenClientSearch={handleOpenClientSearch}
						onPaymentMethodTouched={() =>
						setTouched((currentTouched: Record<string, boolean>) => ({
							...currentTouched,
							paymentMethodUsed: true,
						}))
						}
					/>
				</View>
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
});

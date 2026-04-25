import React, { useMemo } from "react";
import { Alert, Platform, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Text } from "react-native-paper";
import { ScreenLayout } from "../components/ScreenLayout";
import { AppointmentForm } from "../components/calendar/AppointmentForm";
import { FormCard } from "../components/ui/FormCard";
import { useTranslation } from "../context/LanguageContext";
import { useAppTheme } from "../theme/ThemeContext";
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
	const navigation = useNavigation<any>();
	const route = useRoute<AppointmentFormRoute>();
	const insets = useSafeAreaInsets();
	const { theme } = useAppTheme();
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
			| BottomTabNavigationProp<any>
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
				<FormCard>
					<Text
						style={[styles.dateText, { color: theme.colors.textSecondary }]}
					>
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
						onPaymentMethodTouched={() =>
						setTouched((currentTouched: Record<string, boolean>) => ({
							...currentTouched,
							paymentMethodUsed: true,
						}))
						}
					/>
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
		paddingTop: 10,
	},
	dateText: {
		fontSize: 14,
		marginBottom: 14,
	},
});

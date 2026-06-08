import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ImageBackground, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { ClientForm } from "../components/clients/ClientForm";
import { ClientStatsCard } from "../components/clients/ClientStatsCard";
import { ClientAppointmentHistory } from "../components/clients/ClientAppointmentHistory";
import { useTranslation } from "../context/LanguageContext";
import { useClientForm } from "../features/clients/clientForm";
import { clientHistoryService } from "../services/clientHistoryService";
import type { ClientStats } from "../types/clients";
import type { ClientsStackParamList } from "../navigation/ClientsNavigator";
import { clientsService } from "../services/clientService";
import { ScreenLayout } from "../components/ScreenLayout";
import { getErrorMessage } from '../utils/errors';
import { useDialog } from '../context/DialogContext';
import type { Client } from "../types/clients";
import { formatPhoneNumber } from "../utils/formatUtil";
import { AppTheme } from "../theme/themes";
import { useAppTheme } from "../theme/ThemeContext";

type ClientFormScreenNavigation = NativeStackNavigationProp<ClientsStackParamList, "ClientForm">;
type ClientFormScreenRoute = RouteProp<ClientsStackParamList, "ClientForm">;

const createStyles = (theme: AppTheme) => StyleSheet.create({
	screenBg: {
		flex: 1,
	},
	screenOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: theme.colors.overlay,
	},
	actions: {
		gap: 10,
		marginTop: 18,
	},
	flex: {
		flex: 1,
	},
	scrollContent: {
		paddingTop: 18,
	},
	btnPrimary: {
		alignItems: "center",
		backgroundColor: theme.colors.accent,
		borderRadius: 14,
		justifyContent: "center",
		paddingVertical: 15,
	},
	btnPrimaryText: {
		color: "#0F172A",
		fontSize: 16,
		fontWeight: "700",
		letterSpacing: 0.3,
	},
	btnSecondary: {
		alignItems: "center",
		backgroundColor: theme.colors.surfaceElevated,
		borderColor: theme.colors.border,
		borderRadius: 14,
		borderWidth: 1,
		justifyContent: "center",
		paddingVertical: 15,
	},
	btnSecondaryText: {
		color: theme.colors.textPrimary,
		fontSize: 16,
		fontWeight: "600",
	},
	btnDanger: {
		alignItems: "center",
		backgroundColor: theme.colors.errorBg,
		borderColor: theme.colors.error,
		borderRadius: 14,
		borderWidth: 1,
		justifyContent: "center",
		paddingVertical: 15,
	},
	btnDangerText: {
		color: theme.colors.error,
		fontSize: 16,
		fontWeight: "600",
	},
	btnDisabled: {
		opacity: 0.45,
	},
});

export const ClientFormScreen = () => {
	const { showAlert } = useDialog();
	const navigation = useNavigation<ClientFormScreenNavigation>();
	const route = useRoute<ClientFormScreenRoute>();
	const { translateText } = useTranslation();
	const insets = useSafeAreaInsets();
	const { theme } = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const {
		client,
		errors,
		touched,
		isFormValid,
		loadClient,
		onBlurField,
		resetForm,
		setField,
		validateBeforeSubmit,
	} = useClientForm();

	const [loading, setLoading] = useState(false);
	const [stats, setStats] = useState<ClientStats | null>(null);
	const [loadingStats, setLoadingStats] = useState(false);
	const isEditMode = route.params.mode === "edit";

	useEffect(() => {
		const client = route.params?.client;

		if (client) {
			loadClient(client);
			
			// Load stats for existing client
			if (client.id) {
				const clientId = client.id;
				const loadClientStats = async () => {
					setLoadingStats(true);
					try {
						const clientStats = await clientHistoryService.getStats(clientId);
						setStats(clientStats);
					} catch {
						// Stats loading is non-critical
					} finally {
						setLoadingStats(false);
					}
				};
				void loadClientStats();
			}
			return;
		}

		resetForm();
	}, [loadClient, resetForm, route.params.client]);

	const screenTitle = useMemo(
		() => (isEditMode
			? translateText("clients.form.editScreenTitle")
			: translateText("clients.form.createScreenTitle")),
		[isEditMode, translateText],
	);

	const handleFieldChange = <K extends keyof Client>(key: K, value: Client[K]) => {
		if (key === "phone") {
			setField(key, formatPhoneNumber(String(value ?? "")) as Client[K]);
			return;
		}

		setField(key, value);
	};

	const openDatePicker = () => {
		if (Platform.OS !== "android") {
			return;
		}

    const current = client.birthday ? new Date(client.birthday) : new Date();

    DateTimePickerAndroid.open({
		mode: "date",
		onChange: (_event, selectedDate) => {
			if (selectedDate) {
			setField("birthday", selectedDate.toISOString());
			}
		},
		value: current,
		});
	};

	const handleSave = async () => {
		const nextErrors = validateBeforeSubmit();

		if (
			nextErrors.firstName ||
			nextErrors.lastName ||
			nextErrors.phone ||
			nextErrors.email
		) {
			showAlert(
				translateText("common.save"),
				translateText("clients.alerts.validation"),
			);
			return;
		}
			setLoading(true);

			try {
				if (isEditMode && client.id) {
					await clientsService.update(client.id, client);
					showAlert(
					translateText("common.update"),
					translateText("clients.alerts.clientUpdated"),
					);
				} else {
					await clientsService.create(client);
					showAlert(
					translateText("common.create"),
					translateText("clients.alerts.clientCreated"),
					);
				}

			navigation.goBack();
			} catch (error: unknown) {
				showAlert(
					translateText("common.save"),
					getErrorMessage(error) || translateText("clients.alerts.saveFailed"),
				);
			} finally {
				setLoading(false);
			}
	};

	const handleDelete = async () => {
		if (!client.id) {
			showAlert(translateText("common.delete"), translateText("clients.alerts.noClientSelected"));
			return;
		}

		showAlert(translateText("common.delete"), translateText("clients.alerts.removeClientMessage"), [

			{ text: translateText("common.cancel"), style: "cancel" },
			{

				onPress: async () => {
					setLoading(true);

					try {
						await clientsService.delete(client.id as string);
						showAlert(translateText("common.delete"), translateText("clients.alerts.clientRemoved"));
						navigation.goBack();
					} catch (error: unknown) {
						showAlert(translateText("common.delete"), getErrorMessage(error) || translateText("clients.alerts.removeFailed"));
					} finally {
							setLoading(false);
					}
				},
				style: "destructive",
				text: translateText("common.delete"),
			},
		]);
	};

	const handleCancel = () => {
		resetForm();
		navigation.goBack();
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
			title={screenTitle}
			backgroundColor="transparent"
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
				showsVerticalScrollIndicator={false}>

				{isEditMode && client.id && stats && !loadingStats && (
					<ClientStatsCard stats={stats} />
				)}

				<ClientForm
					client={client}
					errors={errors}
					touched={touched}
					loading={loading}
					onFieldChange={handleFieldChange}
					onFieldBlur={onBlurField}
					onOpenDatePicker={openDatePicker}
					onPhotoChange={(uri) => setField("photoUrl", uri)}
				/>

				{isEditMode && client.id && (
					<ClientAppointmentHistory clientId={client.id} />
				)}

				<View style={styles.actions}>
					<Pressable
						style={[styles.btnPrimary, (!isFormValid || loading) && styles.btnDisabled]}
						onPress={() => void handleSave()}
						disabled={!isFormValid || loading}
					>
						{loading ? (
							<ActivityIndicator color="#0F172A" size="small" />
						) : (
							<Text style={styles.btnPrimaryText}>
								{isEditMode
									? translateText("clients.buttons.saveChanges")
									: translateText("clients.buttons.createClient")}
							</Text>
						)}
					</Pressable>

					<Pressable
						style={[styles.btnSecondary, loading && styles.btnDisabled]}
						onPress={handleCancel}
						disabled={loading}
					>
						<Text style={styles.btnSecondaryText}>{translateText("common.cancel")}</Text>
					</Pressable>

					{isEditMode ? (
						<Pressable
							style={[styles.btnDanger, loading && styles.btnDisabled]}
							onPress={() => void handleDelete()}
							disabled={loading}
						>
							<Text style={styles.btnDangerText}>{translateText("clients.buttons.delete")}</Text>
						</Pressable>
					) : null}
				</View>
			</KeyboardAwareScrollView>
			</ScreenLayout>
		</ImageBackground>
	);
	};

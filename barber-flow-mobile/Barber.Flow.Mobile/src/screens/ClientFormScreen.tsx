import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { ClientForm } from "../components/clients/ClientForm";
import { useTranslation } from "../context/LanguageContext";
import { useClientForm } from "../features/clients/clientForm";
import type { ClientsStackParamList } from "../navigation/ClientsNavigator";
import { clientsService } from "../services/clientService";
import { ScreenLayout } from "../components/ScreenLayout";import { getErrorMessage } from '../utils/errors';import { useAppTheme } from "../theme/ThemeContext";
import type { Client } from "../types/clients";
import { formatPhoneNumber } from "../utils/formatUtil";

type ClientFormScreenNavigation = NativeStackNavigationProp<ClientsStackParamList, "ClientForm">;
type ClientFormScreenRoute = RouteProp<ClientsStackParamList, "ClientForm">;

export const ClientFormScreen = () => {
	const navigation = useNavigation<ClientFormScreenNavigation>();
	const route = useRoute<ClientFormScreenRoute>();
	const { theme } = useAppTheme();
	const { translateText } = useTranslation();
	const insets = useSafeAreaInsets();
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
	const isEditMode = route.params.mode === "edit";

	useEffect(() => {
		if (route.params.client) {
			loadClient(route.params.client);
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
			Alert.alert(
			translateText("common.save"),
			translateText("clients.alerts.validation"),
			);
			return;
		}
			setLoading(true);

			try {
				if (isEditMode && client.id) {
					await clientsService.update(client.id, client);
					Alert.alert(
					translateText("common.update"),
					translateText("clients.alerts.clientUpdated"),
					);
				} else {
					await clientsService.create(client);
					Alert.alert(
					translateText("common.create"),
					translateText("clients.alerts.clientCreated"),
					);
				}

			navigation.goBack();
			} catch (error: unknown) {
				Alert.alert(
					translateText("common.save"),
					getErrorMessage(error) || translateText("clients.alerts.saveFailed"),
				);
			} finally {
				setLoading(false);
			}
	};

	const handleDelete = async () => {
		if (!client.id) {
			Alert.alert(translateText("common.delete"), translateText("clients.alerts.noClientSelected"));
			return;
		}

		Alert.alert(translateText("common.delete"), translateText("clients.alerts.removeClientMessage"), [

			{ text: translateText("common.cancel"), style: "cancel" },
			{

				onPress: async () => {
					setLoading(true);

					try {
						await clientsService.delete(client.id as string);
						Alert.alert(translateText("common.delete"), translateText("clients.alerts.clientRemoved"));
						navigation.goBack();
					} catch (error: unknown) {
						Alert.alert(translateText("common.delete"), getErrorMessage(error) || translateText("clients.alerts.removeFailed"));
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
		<ScreenLayout
		title={screenTitle}
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
			showsVerticalScrollIndicator={false}>

			<ClientForm
				client={client}
				errors={errors}
				touched={touched}
				loading={loading}
				onFieldChange={handleFieldChange}
				onFieldBlur={onBlurField}
				onOpenDatePicker={openDatePicker}
			/>

			<View style={styles.actions}>

			<Button
				mode="contained"
				onPress={() => void handleSave()}
				disabled={!isFormValid || loading}
				loading={loading}
			>
				{isEditMode
				? translateText("clients.buttons.saveChanges")
				: translateText("clients.buttons.createClient")}
			</Button>

			<Button
				mode="contained"
				onPress={handleCancel}
				disabled={loading}
			>
				{translateText("common.cancel")}
			</Button>

			{isEditMode ? (
				<Button
					mode="outlined"
					onPress={() => void handleDelete()}
					disabled={loading}
					textColor={theme.colors.error}
					>
					{translateText("clients.buttons.delete")}
				</Button>
			) : null}
			</View>
		</KeyboardAwareScrollView>
		</ScreenLayout>
	);
	};

const styles = StyleSheet.create({
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
});
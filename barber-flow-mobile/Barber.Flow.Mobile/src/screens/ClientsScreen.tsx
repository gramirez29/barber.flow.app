import React, { useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import { ClientForm } from "../components/clients/ClientForm";
import { ClientSearchModal } from "../components/clients/ClientSearchModal";
import { FormCard } from "../components/ui/FormCard";
import {
    useClientForm,
} from "../features/clients/clientForm";
import { useTranslation } from "../context/LanguageContext";
import { clientsService } from "../services/clientService";
import { ScreenLayout } from "../components/ScreenLayout";
import { useAppTheme } from "../theme/ThemeContext";
import type { Client } from "../types/clients";
import { formatPhoneNumber } from "../utils/formatUtil";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { AppTabParamList } from "../navigation/AppNavigator";

export const ClientsScreen: React.FC = () => {
    const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList, "Calendar">>();
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
    const [modalVisible, setModalVisible] = useState(false);
    const [search, setSearch] = useState("");
    const [clients, setClients] = useState<Client[]>([]);

    const handleFieldChange = <K extends keyof Client>(key: K, value: Client[K]) => {
        if (key === "phone") {
            setField(key, formatPhoneNumber(String(value ?? "")) as Client[K]);
            return;
        }

        setField(key, value);
    };

    const openDatePicker = () => {
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

        if (nextErrors.firstName || nextErrors.lastName || nextErrors.phone || nextErrors.email) {
            Alert.alert(translateText("common.save"), translateText("clients.alerts.validation"));
            return;
        }

        setLoading(true);

        try {
            if (client.id) {
                await clientsService.update(client.id, client);
                Alert.alert(translateText("common.update"), translateText("clients.alerts.clientUpdated"));
            } else {
                await clientsService.create(client);
                Alert.alert(translateText("common.create"), translateText("clients.alerts.clientCreated"));
            }

            if (modalVisible && search.trim()) {
                const list = await clientsService.find(search);
                setClients(list ?? []);
            }

            resetForm();
        } catch (error: any) {
            Alert.alert(translateText("common.save"), error?.message ?? translateText("clients.alerts.saveFailed"));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!client.id) {
            Alert.alert(translateText("common.delete"), translateText("clients.alerts.noClientSelected"));
            return;
        }

        const clientId = client.id;

        Alert.alert(translateText("common.delete"), translateText("clients.alerts.removeClientMessage"), [
            { text: translateText("common.cancel"), style: "cancel" },
            {
                onPress: async () => {
                    setLoading(true);

                    try {
                        await clientsService.delete(clientId);
                        Alert.alert(translateText("common.delete"), translateText("clients.alerts.clientRemoved"));

                        if (modalVisible && search.trim()) {
                            const list = await clientsService.find(search);
                            setClients(list ?? []);
                        }

                        resetForm();
                    } catch (error: any) {
                        Alert.alert(translateText("common.delete"), error?.message ?? translateText("clients.alerts.removeFailed"));
                    } finally {
                        setLoading(false);
                    }
                },
                style: "destructive",
                text: translateText("common.delete"),
            },
        ]);
    };

    const applyFilter = async () => {
        setLoading(true);

        try {
            const list = await clientsService.find(search);
            setClients(list ?? []);
        } catch (error: any) {
            Alert.alert(translateText("common.search"), error?.message ?? translateText("clients.alerts.searchFailed"));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectClient = (selectedClient: Client) => {
        loadClient(selectedClient);
        setModalVisible(false);
    };

    const fullName = `${client.firstName} ${client.lastName}`.trim()
        || translateText("clients.screen.noClientSelectedTitle");

    // Drawer is added in the ClientsScreen to allow quick access to other sections of the app
    // while managing clients, as this screen is likely to involve multiple interactions and
    // users may want to switch contexts without going back to the main menu.
    // TODO: Verify functioanlity
    return (
        <ScreenLayout
            title={translateText("clients.screen.title")}
            backgroundColor={theme.colors.background}
            onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
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
                <View style={styles.contentWrap}>
                    <FormCard style={styles.summaryCard}>
                        <Text style={[styles.summaryEyebrow, { color: theme.colors.textSecondary }]}>{translateText("clients.screen.heroEyebrow")}</Text>
                        <Text style={[styles.summaryTitle, { color: theme.colors.textPrimary }]}>
                            {fullName}
                        </Text>
                        <Text style={[styles.summaryBody, { color: theme.colors.textSecondary }]}> 
                            {client.id
                                ? translateText("clients.screen.existingClientBody")
                                : translateText("clients.screen.newClientBody")}
                        </Text>

                        <View style={styles.summaryActions}>
                            <Button
                                mode="contained"
                                onPress={handleSave}
                                disabled={!isFormValid || loading}
                                loading={loading}
                            >
                                {client.id
                                    ? translateText("clients.buttons.saveChanges")
                                    : translateText("clients.buttons.createClient")}
                            </Button>
                            <Button mode="outlined" onPress={resetForm} disabled={loading}>
                                {translateText("clients.buttons.resetForm")}
                            </Button>
                            <Button mode="text" onPress={() => setModalVisible(true)} disabled={loading}>
                                {translateText("clients.buttons.findClient")}
                            </Button>
                            <Button
                                mode="text"
                                onPress={handleDelete}
                                disabled={!client.id || loading}
                                textColor={client.id ? theme.colors.error : theme.colors.textSecondary}
                            >
                                {translateText("clients.buttons.delete")}
                            </Button>
                        </View>
                    </FormCard>

                    <ClientForm
                        client={client}
                        errors={errors}
                        touched={touched}
                        loading={loading}
                        onFieldChange={handleFieldChange}
                        onFieldBlur={onBlurField}
                        onOpenDatePicker={openDatePicker}
                    />
                </View>
            </KeyboardAwareScrollView>

            <ClientSearchModal
                clients={clients}
                loading={loading}
                search={search}
                visible={modalVisible}
                onApplyFilter={applyFilter}
                onClose={() => setModalVisible(false)}
                onSearchChange={setSearch}
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
        paddingTop: 18,
    },
    contentWrap: {
        alignItems: "center",
        width: "100%",
    },
    summaryCard: {
        marginBottom: 16,
    },
    summaryEyebrow: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 8,
        textTransform: "uppercase",
    },
    summaryTitle: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 8,
    },
    summaryBody: {
        fontSize: 14,
        lineHeight: 21,
    },
    summaryActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 20,
    },
});
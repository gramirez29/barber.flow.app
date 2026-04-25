import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { DrawerActions, useIsFocused, useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { format } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator, FAB, Searchbar, Text } from "react-native-paper";
import { ClientListItem } from "../components/clients/ClientListItem";
import { ClientsListEmptyState } from "../components/clients/ClientsListEmptyState";
import { FormCard } from "../components/ui/FormCard";
import { useTranslation } from "../context/LanguageContext";
import type { AppointmentDraft, AppointmentPaymentMethod } from "../features/appointments/appointments.types";
import { clientsService } from "../services/clientService";import { getErrorMessage } from '../utils/errors';import { ScreenLayout } from "../components/ScreenLayout";
import { useAppTheme } from "../theme/ThemeContext";
import type { Client } from "../types/clients";
import type { AppTabParamList } from "../navigation/AppNavigator";
import type { ClientsStackParamList } from "../navigation/ClientsNavigator";

type ClientsScreenNavigation = CompositeNavigationProp<
    NativeStackNavigationProp<ClientsStackParamList, "ClientsList">,
    BottomTabNavigationProp<AppTabParamList, "Clients">
>;

const DATE_FORMAT = "yyyy-MM-dd";

const mapClientPaymentMethod = (
    paymentMethod?: Client["paymentMethod"],
): AppointmentPaymentMethod | undefined => {
    switch (paymentMethod) {
        case "Cash":
            return "cash";
        case "Sinpe Movil":
            return "sinpeMovil";
        case "Transfer":
            return "transfer";
        default:
            return undefined;
    }
};

export const ClientsScreen: React.FC = () => {
    const navigation = useNavigation<ClientsScreenNavigation>();
    const isFocused = useIsFocused();
    const { theme } = useAppTheme();
    const { translateText } = useTranslation();
    const insets = useSafeAreaInsets();
    const [clients, setClients] = useState<Client[]>([]);
    const [fabOpen, setFabOpen] = useState(false);
    const fabBackdropColor = theme.colors.background;
    const fabShadowStyle = {
        borderColor: theme.mode === "dark" ? "rgba(148, 163, 184, 0.18)" : "rgba(255, 255, 255, 0.92)",
        borderWidth: 1,
        elevation: 12,
        shadowColor: "#020617",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: theme.mode === "dark" ? 0.34 : 0.95,
        shadowRadius: 18,
    } as const;
    const actionSurfaceStyle = {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        elevation: 10,
        shadowColor: "#020617",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: theme.mode === "dark" ? 0.28 : 0.14,
        shadowRadius: 16,
    } as const;

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!isFocused) {
            return;
        }

        let isActive = true;
        const timeoutId = setTimeout(() => {
            const fetchClients = async () => {
                setLoading(true);

                try {
                    const nextClients = await clientsService.find(searchQuery.trim() || undefined);

                    if (isActive) {
                        setClients(nextClients ?? []);
                    }
                } catch (error: unknown) {
                    if (isActive) {
                        Alert.alert(
                            translateText("common.search"),
                            getErrorMessage(error) || translateText("clients.alerts.listLoadFailed"),
                        );
                    }
                } finally {
                    if (isActive) {
                        setLoading(false);
                    }
                }
            };

            void fetchClients();
        }, 250);

        return () => {
            isActive = false;
            clearTimeout(timeoutId);
        };
    }, [isFocused, searchQuery, translateText]);

    const handleSelectClient = (selectedClient: Client) => {
        navigation.navigate("ClientForm", {
            client: selectedClient,
            mode: "edit",
        });
    };

    const handleCreateClient = () => {
        setFabOpen(false);
        navigation.navigate("ClientForm", { mode: "create" });
    };

    const handleScheduleAppointment = (selectedClient: Client) => {
        const fullName = `${selectedClient.firstName} ${selectedClient.lastName}`.trim();
        const nextScheduleDate = format(new Date(), DATE_FORMAT);

        setFabOpen(false);
        const nextDraft: Partial<AppointmentDraft> = {
            clientName: fullName,
            paymentMethodUsed: mapClientPaymentMethod(selectedClient.paymentMethod),
            phone: selectedClient.phone,
        };

        navigation.navigate("AppointmentForm", {
            mode: "create",
            date: nextScheduleDate,
            initialDraft: nextDraft,
            afterSave: "goToCalendarDay",
        });
    };

    return (
        <ScreenLayout
            title={translateText("clients.screen.title")}
            backgroundColor={theme.colors.background}
            onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <FlatList
                data={clients}
                keyExtractor={(item) => item.id ?? `${item.firstName}-${item.lastName}-${item.phone}`}
                ListHeaderComponent={
                    <FormCard style={styles.heroCard}>
                        <Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>
                            {translateText("clients.list.listTitle")}
                        </Text>
                        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                            {translateText("clients.list.title")}
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                            {translateText("clients.list.subtitle")}
                        </Text>

                        <Searchbar
                            placeholder={translateText("clients.list.searchPlaceholder")}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={styles.searchbar}
                        />

                        <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>
                            {translateText("clients.list.helper")}
                        </Text>
                    </FormCard>
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator color={theme.colors.primary} size="large" />
                        </View>
                    ) : (
                        <ClientsListEmptyState loading={loading} />
                    )
                }
                contentContainerStyle={[
                    styles.contentContainer,
                    {
                        paddingBottom: Math.max(112, insets.bottom + 112),
                    },
                ]}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <ClientListItem
                        client={item}
                        onPress={handleSelectClient}
                        onSchedule={handleScheduleAppointment}
                    />
                )}
                showsVerticalScrollIndicator={false}
            />

            <FAB.Group
                actions={[
                    {
                        icon: "account-plus-outline",
                        label: translateText("clients.buttons.newClient"),
                        onPress: handleCreateClient,
                        style: actionSurfaceStyle,
                        color: theme.colors.textPrimary,
                        labelTextColor: theme.colors.textPrimary,
                    },
                ]}
                backdropColor={fabBackdropColor}
                color={theme.mode === "dark" ? "#0F172A" : "#FFFFFF"}
                fabStyle={[
                    styles.fabButton,
                    fabShadowStyle,
                    { backgroundColor: theme.colors.secondary },
                ]}
                icon={fabOpen ? "close" : "plus"}
                onStateChange={({ open }) => setFabOpen(open)}
                open={fabOpen}
                style={styles.fabGroup}
                visible
            />

        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        paddingBottom: 32,
    },
    eyebrow: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 8,
        textTransform: "uppercase",
    },
    fabGroup: {
        paddingBottom: 16,
    },
    fabButton: {
        borderRadius: 18,
    },
    helper: {
        fontSize: 13,
        lineHeight: 20,
        marginTop: 12,
    },
    heroCard: {
        marginBottom: 14,
    },
    loadingWrap: {
        alignItems: "center",
        paddingVertical: 32,
    },
    searchbar: {
        marginTop: 16,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 21,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 8,
    },
});
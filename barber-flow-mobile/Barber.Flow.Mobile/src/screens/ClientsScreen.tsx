import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, ImageBackground, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { DrawerActions, useIsFocused, useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClientListItem } from "../components/clients/ClientListItem";
import { ClientsListEmptyState } from "../components/clients/ClientsListEmptyState";
import { useTranslation } from "../context/LanguageContext";
import type { AppointmentDraft, AppointmentPaymentMethod } from "../features/appointments/appointments.types";
import { clientsService } from "../services/clientService";
import { getErrorMessage } from '../utils/errors';
import { ScreenLayout } from "../components/ScreenLayout";
import type { Client } from "../types/clients";
import type { AppTabParamList } from "../navigation/AppNavigator";
import type { ClientsStackParamList } from "../navigation/ClientsNavigator";

type ClientsScreenNavigation = CompositeNavigationProp<
    NativeStackNavigationProp<ClientsStackParamList, "ClientsList">,
    BottomTabNavigationProp<AppTabParamList, "Clients">
>;

const DATE_FORMAT = "yyyy-MM-dd";

const COLORS = {
	bg: "#0D0D0D",
	surface: "#1A1A1A",
	surfaceElevated: "#252525",
	gold: "#C9A84C",
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
	border: "#3A3A3A",
} as const;

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
    const { translateText } = useTranslation();
    const insets = useSafeAreaInsets();
    const [clients, setClients] = useState<Client[]>([]);
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
        navigation.navigate("ClientForm", { mode: "create" });
    };

    const handleScheduleAppointment = (selectedClient: Client) => {
        const fullName = `${selectedClient.firstName} ${selectedClient.lastName}`.trim();
        const nextScheduleDate = format(new Date(), DATE_FORMAT);

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
        <ImageBackground
            source={require("../../assets/images/barber-flow-background-image.jpg")}
            style={styles.screenBg}
            resizeMode="cover"
        >
            <StatusBar style="light" translucent backgroundColor="transparent" />
            <View style={styles.screenOverlay} />
            <ScreenLayout
                title={translateText("clients.screen.title")}
                backgroundColor="transparent"
                onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
                <FlatList
                    data={clients}
                    keyExtractor={(item) => item.id ?? `${item.firstName}-${item.lastName}-${item.phone}`}
                    ListHeaderComponent={
                        <View style={styles.heroCard}>
                            <Text style={styles.eyebrow}>
                                {translateText("clients.list.listTitle")}
                            </Text>
                            <Text style={styles.title}>
                                {translateText("clients.list.title")}
                            </Text>
                            <Text style={styles.subtitle}>
                                {translateText("clients.list.subtitle")}
                            </Text>

                            <View style={styles.searchbarWrap}>
                                <Ionicons name="search" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
                                <TextInput
                                    placeholder={translateText("clients.list.searchPlaceholder")}
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    style={styles.searchInput}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="search"
                                />
                            </View>

                            <Text style={styles.helper}>
                                {translateText("clients.list.helper")}
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={
                        loading ? (
                            <View style={styles.loadingWrap}>
                                <ActivityIndicator color={COLORS.gold} size="large" />
                            </View>
                        ) : (
                            <ClientsListEmptyState loading={loading} />
                        )
                    }
                    contentContainerStyle={[
                        styles.contentContainer,
                        { paddingBottom: Math.max(112, insets.bottom + 112) },
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

                {/* ─── Floating Action Button ───────────────────────────── */}
                <Pressable
                    style={[styles.fab, { bottom: Math.max(24, insets.bottom + 24) }]}
                    onPress={handleCreateClient}
                    accessibilityLabel={translateText("clients.buttons.newClient")}
                >
                    <Ionicons name="person-add" size={22} color={COLORS.bg} />
                </Pressable>
            </ScreenLayout>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    // ─── Screen background
    screenBg: {
        flex: 1,
    },
    screenOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(13,13,13,0.65)",
    },
    // ─── Content
    contentContainer: {
        paddingBottom: 32,
    },
    heroCard: {
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 14,
        padding: 20,
    },
    eyebrow: {
        color: COLORS.gold,
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 8,
        textTransform: "uppercase",
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 8,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 21,
    },
    // ─── Custom searchbar
    searchbarWrap: {
        alignItems: "center",
        backgroundColor: COLORS.surfaceElevated,
        borderColor: COLORS.border,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: "row",
        marginTop: 16,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        color: COLORS.textPrimary,
        flex: 1,
        fontSize: 15,
        paddingVertical: Platform.OS === "ios" ? 12 : 8,
    },
    helper: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        marginTop: 12,
    },
    loadingWrap: {
        alignItems: "center",
        paddingVertical: 32,
    },
    // ─── FAB
    fab: {
        alignItems: "center",
        backgroundColor: COLORS.gold,
        borderRadius: 18,
        elevation: 8,
        height: 56,
        justifyContent: "center",
        position: "absolute",
        right: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        width: 56,
    },
});
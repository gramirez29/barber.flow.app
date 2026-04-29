import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, ImageBackground, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { DrawerActions, useIsFocused, useNavigation } from "@react-navigation/native";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
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

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

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
    const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(10);

    // TODO: when backend returns PaginatedResult<Client>, derive totalPages and displayedClients from the response
    const totalPages = Math.ceil(allClients.length / pageSize);
    const displayedClients = allClients.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        if (!isFocused) {
            return;
        }

        let isActive = true;
        const timeoutId = setTimeout(() => {
            const fetchClients = async () => {
                setLoading(true);

                try {
                    // Pagination params are forwarded to the backend already.
                    // TODO: when backend returns PaginatedResult<Client>, update setAllClients to set only the items slice
                    //       and derive totalPages from the response totalCount instead.
                    const nextClients = await clientsService.find(searchQuery.trim() || undefined, { page, pageSize });

                    if (isActive) {
                        setAllClients(nextClients ?? []);
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
    }, [isFocused, page, pageSize, searchQuery, translateText]);

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        if (page !== 1) setPage(1);
    };

    const handlePageSizeChange = (size: PageSizeOption) => {
        setPageSize(size);
        setPage(1);
    };

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
                    data={displayedClients}
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
                                    onChangeText={handleSearchChange}
                                    style={styles.searchInput}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="search"
                                />
                            </View>

                            <Text style={styles.helper}>
                                {translateText("clients.list.helper")}
                            </Text>

                            <View style={styles.pageSizeRow}>
                                <Text style={styles.pageSizeLabel}>
                                    {translateText("clients.list.pageSize")}
                                </Text>
                                <View style={styles.pageSizeChips}>
                                    {PAGE_SIZE_OPTIONS.map(size => (
                                        <Pressable
                                            key={size}
                                            onPress={() => handlePageSizeChange(size)}
                                            style={[styles.pageSizeChip, pageSize === size && styles.pageSizeChipActive]}
                                        >
                                            <Text style={[styles.pageSizeChipText, pageSize === size && styles.pageSizeChipTextActive]}>
                                                {size}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                                {!loading && allClients.length > 0 && (
                                    <Text style={styles.totalCount}>
                                        {translateText("clients.list.totalCount", { count: String(allClients.length) })}
                                    </Text>
                                )}
                            </View>
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
                    renderItem={({ item, index }) => (
                        <ClientListItem
                            client={item}
                            onPress={handleSelectClient}
                            onSchedule={handleScheduleAppointment}
                            isFirst={index === 0}
                            isLast={index === displayedClients.length - 1}
                        />
                    )}
                    ItemSeparatorComponent={() => <View style={styles.listDivider} />}
                    ListFooterComponent={
                        !loading && totalPages > 1 ? (
                            <View style={styles.paginationRow}>
                                <Pressable
                                    onPress={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                                    accessibilityLabel={translateText("clients.list.prevPage")}
                                >
                                    <Ionicons name="chevron-back" size={20} color={page === 1 ? COLORS.textSecondary : COLORS.gold} />
                                </Pressable>
                                <Text style={styles.pageInfo}>
                                    {translateText("clients.list.page", { current: String(page), total: String(totalPages) })}
                                </Text>
                                <Pressable
                                    onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                                    accessibilityLabel={translateText("clients.list.nextPage")}
                                >
                                    <Ionicons name="chevron-forward" size={20} color={page === totalPages ? COLORS.textSecondary : COLORS.gold} />
                                </Pressable>
                            </View>
                        ) : null
                    }
                    showsVerticalScrollIndicator={false}
                />

                {/* ─── Floating Action Button ───────────────────────────── */}
                <Pressable
                    style={[styles.fab, { bottom: Math.max(24, insets.bottom + tabBarHeight + 24) }]}
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
    // ─── Page size selector
    pageSizeRow: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 14,
    },
    pageSizeLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    pageSizeChips: {
        flexDirection: "row",
        gap: 6,
    },
    pageSizeChip: {
        borderColor: COLORS.border,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    pageSizeChipActive: {
        backgroundColor: "rgba(201, 168, 76, 0.12)",
        borderColor: COLORS.gold,
    },
    pageSizeChipText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: "600",
    },
    pageSizeChipTextActive: {
        color: COLORS.gold,
    },
    totalCount: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginLeft: "auto",
        opacity: 0.75,
    },
    loadingWrap: {
        alignItems: "center",
        paddingVertical: 32,
    },
    // ─── List divider
    listDivider: {
        backgroundColor: "#3A3A3A",
        height: 1,
        marginLeft: 78,
    },
    // ─── Pagination controls
    paginationRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: 20,
        justifyContent: "center",
        marginBottom: 8,
        marginTop: 16,
    },
    pageBtn: {
        alignItems: "center",
        borderColor: COLORS.border,
        borderRadius: 10,
        borderWidth: 1,
        height: 40,
        justifyContent: "center",
        width: 40,
    },
    pageBtnDisabled: {
        opacity: 0.35,
    },
    pageInfo: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
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
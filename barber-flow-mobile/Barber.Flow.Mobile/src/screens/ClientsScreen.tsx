    import React, { useState, useEffect } from "react";
    import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Modal,
    FlatList,
    TouchableOpacity,
    Alert,
    Switch,
    Platform,
    KeyboardAvoidingView
    } from "react-native";
    import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
    import { useSafeAreaInsets } from "react-native-safe-area-context";
    import { ScreenLayout } from "../components/ScreenLayout";
    import { useAppTheme } from "../theme/ThemeContext";
    import { clientsService } from "../services/clientService";
    import type { Client } from "../types/clients";
    import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
    import { Picker } from "@react-native-picker/picker";

    const PAYMENT_METHODS = ["None", "Sinpe Movil", "Transfer", "Cash"] as const;

    const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D+/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    };

    export const ClientsScreen: React.FC = () => {
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();

    const empty: Client = {
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        birthday: undefined,
        preferences: "",
        paymentMethod: "None",
        active: true,
    };

    const [client, setClient] = useState<Client>(empty);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [search, setSearch] = useState("");
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

    // validation state
    const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; phone?: string }>({});
    const [touched, setTouched] = useState<{ [k: string]: boolean }>({});

    useEffect(() => {
        (async () => {
        try {
            const list = await clientsService.find();
            setClients(list ?? []);
        } catch {
            // ignore silently
        }
        })();
    }, []);

    const validateField = (key: keyof Client, value: any) => {
        if (key === "firstName") {
        if (!value || !String(value).trim()) return "First name is required";
        return undefined;
        }
        if (key === "lastName") {
        if (!value || !String(value).trim()) return "Last name is required";
        return undefined;
        }
        if (key === "phone") {
        if (!value || !String(value).trim()) return "Phone is required";
        if (!/^\d{4}-\d{4}$/.test(String(value))) return "Phone must be 0000-0000";
        return undefined;
        }
        return undefined;
    };

    const setField = <K extends keyof Client>(k: K, v: Client[K]) => {
        setClient((s) => ({ ...s, [k]: v }));
        // validate on change for immediate feedback
        const err = validateField(k, v);
        setErrors((e) => ({ ...e, [k]: err }));
    };

    const onBlurField = (k: keyof Client) => {
        setTouched((t) => ({ ...t, [k]: true }));
        const err = validateField(k, client[k]);
        setErrors((e) => ({ ...e, [k]: err }));
    };

    const isFormValid =
        !validateField("firstName", client.firstName) &&
        !validateField("lastName", client.lastName) &&
        !validateField("phone", client.phone);

    const openDatePicker = () => {
        const current = client.birthday ? new Date(client.birthday) : new Date();
        DateTimePickerAndroid.open({
        value: current,
        onChange: (_ev, d) => {
            if (d) setField("birthday", d.toISOString());
        },
        mode: "date",
        });
    };

    const handleSave = async () => {
        // final validation before submit
        const fErr = validateField("firstName", client.firstName);
        const lErr = validateField("lastName", client.lastName);
        const pErr = validateField("phone", client.phone);
        setErrors({ firstName: fErr, lastName: lErr, phone: pErr });
        setTouched({ firstName: true, lastName: true, phone: true });

        if (fErr || lErr || pErr) {
        Alert.alert("Validation", "Please fix the required fields.");
        return;
        }

        setLoading(true);
        try {
        if (client.id) {
            await clientsService.update(client.id, client);
            Alert.alert("Success", "Client updated.");
        } else {
            const created = await clientsService.create(client);
            setClient(created);
            Alert.alert("Success", "Client created.");
        }
        if (modalVisible) {
            const list = await clientsService.find();
            setClients(list);
        }
        } catch (err: any) {
        Alert.alert("Error", err?.message ?? "Save failed");
        } finally {
        setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!client.id) return Alert.alert("Info", "No client selected to remove.");
        Alert.alert("Confirm", "Remove client?", [
        { text: "Cancel", style: "cancel" },
        {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
            setLoading(true);
            try {
                await clientsService.delete(client.id!);
                setClient(empty);
                setSelectedId(undefined);
                Alert.alert("Removed", "Client removed successfully.");
                if (modalVisible) {
                const list = await clientsService.find();
                setClients(list);
                }
            } catch (err: any) {
                Alert.alert("Error", err?.message ?? "Remove failed");
            } finally {
                setLoading(false);
            }
            },
        },
        ]);
    };

    const handleCancel = () => {
        setClient(empty);
        setSelectedId(undefined);
        setErrors({});
        setTouched({});
    };

    const openFindModal = () => setModalVisible(true);

    const applyFilter = async () => {
        try {
            const list = await clientsService.find(search);
            setClients(list ?? []);
        } catch (err: any) {
            Alert.alert("Error", err?.message ?? "Search failed");
        }
    };

    const selectClient = (c: Client) => {
        setClient(c);
        setSelectedId(c.id);
        setModalVisible(false);
        // reset validation for the loaded client
        setErrors({
        firstName: validateField("firstName", c.firstName),
        lastName: validateField("lastName", c.lastName),
        phone: validateField("phone", c.phone),
        });
        setTouched({});
    };

    const keyboardVerticalOffset = insets.top + (theme.layout.sizes?.headerHeight ?? 64);

    return (
        <ScreenLayout title="Clientes" backgroundColor={theme.colors.background} center>
        <KeyboardAwareScrollView
            contentContainerStyle={[styles.scrollContainer, { paddingBottom: Math.max(24, insets.bottom + 24) }]}
            enableOnAndroid
            keyboardOpeningTime={0}
            extraScrollHeight={Platform.OS === 'android' ? 120 : 20}
            keyboardShouldPersistTaps="handled"
            >
            <View style={[styles.wrapper, { paddingHorizontal: theme.layout.spacing?.md ?? 16 }]}>
                <View style={[styles.card, { backgroundColor: theme.colors.surface ?? "#F3F4F6" }]}>
                {/* First name */}
                <View style={styles.row}>
                    <Text style={[styles.label, { color: theme.colors.textPrimary }]}>* First name</Text>
                    <TextInput
                    value={client.firstName}
                    onChangeText={(t) => setField("firstName", t)}
                    onBlur={() => onBlurField("firstName")}
                    style={[
                        styles.input,
                        {
                        backgroundColor: theme.colors.primaryInput,
                        color: theme.colors.primaryTextInput,
                        borderColor: touched.firstName && errors.firstName ? "#DC2626" : "#E5E7EB",
                        },
                    ]}
                    placeholder="First name"
                    returnKeyType="next"
                    />
                    {touched.firstName && errors.firstName ? (
                    <Text style={[styles.fieldError, { color: theme.colors.error ?? "#DC2626" }]}>{errors.firstName}</Text>
                    ) : null}
                </View>

                {/* Last name */}
                <View style={styles.row}>
                    <Text style={[styles.label, { color: theme.colors.textPrimary }]}>* Last name</Text>
                    <TextInput
                    value={client.lastName}
                    onChangeText={(t) => setField("lastName", t)}
                    onBlur={() => onBlurField("lastName")}
                    style={[
                        styles.input,
                        {
                        backgroundColor: theme.colors.primaryInput,
                        color: theme.colors.primaryTextInput,
                        borderColor: touched.lastName && errors.lastName ? "#DC2626" : "#E5E7EB",
                        },
                    ]}
                    placeholder="Last name"
                    />
                    {touched.lastName && errors.lastName ? (
                    <Text style={[styles.fieldError, { color: theme.colors.error ?? "#DC2626" }]}>{errors.lastName}</Text>
                    ) : null}
                </View>

                {/* Phone */}
                <View style={styles.row}>
                    <Text style={[styles.label, { color: theme.colors.textPrimary }]}>* Phone</Text>
                    <TextInput
                    value={client.phone}
                    onChangeText={(t) => setField("phone", formatPhone(t))}
                    onBlur={() => onBlurField("phone")}
                    style={[
                        styles.input,
                        {
                        backgroundColor: theme.colors.primaryInput,
                        color: theme.colors.primaryTextInput,
                        borderColor: touched.phone && errors.phone ? "#DC2626" : "#E5E7EB",
                        },
                    ]}
                    placeholder="0000-0000"
                    keyboardType="phone-pad"
                    maxLength={9}
                    />
                    {touched.phone && errors.phone ? (
                    <Text style={[styles.fieldError, { color: theme.colors.error ?? "#DC2626" }]}>{errors.phone}</Text>
                    ) : null}
                </View>

                {/* Address */}
                <View style={styles.row}>
                    <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Address</Text>
                    <TextInput
                    value={client.address}
                    onChangeText={(t) => setField("address", t)}
                    style={[styles.input, { backgroundColor: theme.colors.primaryInput, color: theme.colors.primaryTextInput }]}
                    placeholder="Address"
                    />
                </View>

                {/* Birthday */}
                <View style={[styles.row, { alignItems: "center" }]}>
                    <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Birthday</Text>
                    <Pressable onPress={openDatePicker} style={[styles.dateButton, { borderColor: theme.colors.border ?? "#e5e7eb" }]}>
                    <Text style={{ color: theme.colors.textSecondary }}>
                        {client.birthday ? new Date(client.birthday).toLocaleDateString() : "Select date"}
                    </Text>
                    </Pressable>
                </View>

                {/* Preferences */}
                <View style={styles.row}>
                    <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Preferences</Text>
                    <TextInput
                    value={client.preferences}
                    onChangeText={(t) => setField("preferences", t)}
                    style={[styles.input, { backgroundColor: theme.colors.primaryInput, color: theme.colors.primaryTextInput }]}
                    placeholder="Preferences"
                    />
                </View>

                {/* Payment method */}
                <View style={styles.row}>
                    <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Payment method</Text>
                    <View style={[styles.pickerWrap, { backgroundColor: theme.colors.primaryInput }]}>
                    <Picker selectedValue={client.paymentMethod} onValueChange={(v) => setField("paymentMethod", v as any)}>
                        {PAYMENT_METHODS.map((p) => (
                        <Picker.Item key={p} label={p} value={p} />
                        ))}
                    </Picker>
                    </View>
                </View>

                {/* Active */}
                <View style={styles.inlineRow}>
                    <Text style={[styles.labelInline, { color: theme.colors.textPrimary }]}>Active</Text>
                    <Switch value={!!client.active} onValueChange={(v) => setField("active", v)} />
                </View>
                {/* Actions */}
                <View style={styles.actions}>
                    <Pressable
                    onPress={handleSave}
                    style={[styles.primaryButton, { backgroundColor: theme.colors.primary, opacity: isFormValid ? 1 : 0.6 }]}
                    disabled={!isFormValid || loading}
                    >
                    <Text style={[styles.primaryText, { color: "#fff" }]}>{loading ? "Saving..." : client.id ? "Update" : "Save"}</Text>
                    </Pressable>

                    <Pressable onPress={handleCancel} style={[styles.ghostButton]}>
                    <Text style={styles.ghostText}>Cancel</Text>
                    </Pressable>

                    <Pressable onPress={openFindModal} style={[styles.ghostButton]}>
                    <Text style={styles.ghostText}>Find Client</Text>
                    </Pressable>

                    {client.id ? (
                    <Pressable onPress={handleDelete} style={[styles.dangerButton]}>
                        <Text style={[styles.primaryText, { color: "#fff" }]}>Remove</Text>
                    </Pressable>
                    ) : null}
                </View>
                </View>
            </View>
        </KeyboardAwareScrollView>

        {/* Find Modal */}
        <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
            <View style={[styles.modalContainer, { padding: theme.layout.spacing?.md ?? 16 }]}>
            <View style={styles.modalHeader}>
                <TextInput placeholder="Search..." value={search} onChangeText={setSearch} style={[styles.input, { flex: 1, marginRight: 8 }]} />
                <Pressable onPress={applyFilter} style={[styles.primaryButton, { paddingHorizontal: 12 }]}>
                <Text style={[styles.primaryText, { color: "#fff" }]}>Apply</Text>
                </Pressable>
                <Pressable onPress={() => setModalVisible(false)} style={[styles.ghostButton, { marginLeft: 8 }]}>
                <Text style={styles.ghostText}>Close</Text>
                </Pressable>
            </View>

            <FlatList
                data={clients}
                keyExtractor={(i) => i.id ?? `${i.firstName}-${i.lastName}-${i.phone}`}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: "space-between" }}
                renderItem={({ item }) => (
                <TouchableOpacity onPress={() => selectClient(item)} style={[styles.clientCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.clientName, { color: theme.colors.textPrimary }]}>{item.firstName} {item.lastName}</Text>
                    <Text style={{ color: theme.colors.textSecondary }}>{item.phone}</Text>
                </TouchableOpacity>
                )}
            />
            </View>
        </Modal>
        </ScreenLayout>
    );
    };

    const styles = StyleSheet.create({
    flex: { flex: 1 },
    scrollContainer: { alignItems: "center", paddingTop: 18 },
    wrapper: { width: "100%", alignItems: "center" },
    card: {
        width: "100%",
        maxWidth: 760,
        borderRadius: 12,
        padding: 16,
        // subtle floating shadow
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
    },
    row: { marginBottom: 12 },
    label: { fontSize: 14, marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    fieldError: { marginTop: 6, fontSize: 13 },
    dateButton: { padding: 12, borderWidth: 1, borderRadius: 8 },
    pickerWrap: { borderRadius: 8, overflow: "hidden" },
    actions: {
        marginTop: 12,
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
    },
    inlineRow:
    {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginBottom: 12,
    },
    labelInline: {
        fontSize: 14,
        marginBottom: 0,
        marginLeft: 10,
        flex: 1,
    },
    primaryButton:
    {
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 10,
        marginRight: 8,
        minWidth: 96,
        alignItems: "center",
        flexShrink: 0,
    },
    primaryText: { fontWeight: "600" },
    ghostButton:
    {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginRight: 8,
        alignItems: "center",
        flexShrink: 0,
    },
    ghostText: { color: "#374151" },
    dangerButton:
    {
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: "#dc2626",
        flexShrink: 0,
    },
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    clientCard: { flex: 1, padding: 12, borderRadius: 8, marginBottom: 12, marginRight: 8 },
    clientName: { fontWeight: "600", marginBottom: 6 },
    });
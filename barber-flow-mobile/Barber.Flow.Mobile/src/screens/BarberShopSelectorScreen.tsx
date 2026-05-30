import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    FlatList,
    ActivityIndicator,
} from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";
import { useTranslation } from "../context/LanguageContext";
import { useDialog } from "../context/DialogContext";
import { barberShopService } from "../services/barberShopService";
import type { BarberShop, BarberShopDraft } from "../types/barberShop";
import { getErrorMessage } from "../utils/errors";

const COLORS = {
    bg: "#0D0D0D",
    surface: "#1A1A1A",
    surfaceElevated: "#252525",
    gold: "#C9A84C",
    textPrimary: "#FFFFFF",
    textSecondary: "#9B9B9B",
    border: "#3A3A3A",
    ripple: "rgba(201, 168, 76, 0.08)",
} as const;

const RADIUS = 16;

export const BarberShopSelectorScreen = () => {
    const { translateText } = useTranslation();
    const { showAlert } = useDialog();
    
    const [shops, setShops] = useState<BarberShop[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingShop, setEditingShop] = useState<BarberShop | null>(null);
    const [showForm, setShowForm] = useState(false);
    
    const [formData, setFormData] = useState<BarberShopDraft>({
        name: "",
        phone: "",
        address: "",
    });

    const loadShops = useCallback(async () => {
        try {
            setLoading(true);
            const data = await barberShopService.getAll();
            setShops(data);
        } catch (error) {
            showAlert(
                "Error",
                getErrorMessage(error, "Failed to load barber shops")
            );
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        loadShops();
    }, [loadShops]);

    const handleCreate = () => {
        setEditingShop(null);
        setFormData({ name: "", phone: "", address: "" });
        setShowForm(true);
    };

    const handleEdit = (shop: BarberShop) => {
        setEditingShop(shop);
        setFormData({
            name: shop.name,
            phone: shop.phone || "",
            address: shop.address || "",
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showAlert("Error", "Shop name is required");
            return;
        }

        try {
            if (editingShop) {
                await barberShopService.update(editingShop.id, formData);
            } else {
                await barberShopService.create(formData);
            }
            setShowForm(false);
            await loadShops();
        } catch (error) {
            showAlert("Error", getErrorMessage(error, "Failed to save shop"));
        }
    };

    const handleDelete = async (shop: BarberShop) => {
        showAlert(
            "Confirm Delete",
            `Are you sure you want to delete "${shop.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await barberShopService.delete(shop.id);
                            await loadShops();
                        } catch (error) {
                            showAlert(
                                "Error",
                                getErrorMessage(error, "Failed to delete shop")
                            );
                        }
                    },
                },
            ]
        );
    };

    const renderShopItem = ({ item }: { item: BarberShop }) => (
        <View style={styles.shopCard}>
            <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{item.name}</Text>
                {item.phone && (
                    <Text style={styles.shopDetail}>📞 {item.phone}</Text>
                )}
                {item.address && (
                    <Text style={styles.shopDetail}>📍 {item.address}</Text>
                )}
            </View>
            <View style={styles.shopActions}>
                <Pressable
                    onPress={() => handleEdit(item)}
                    style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.actionButtonPressed,
                    ]}
                >
                    <Text style={styles.actionButtonText}>Edit</Text>
                </Pressable>
                <Pressable
                    onPress={() => handleDelete(item)}
                    style={({ pressed }) => [
                        styles.actionButton,
                        styles.deleteButton,
                        pressed && styles.actionButtonPressed,
                    ]}
                >
                    <Text style={styles.actionButtonText}>Delete</Text>
                </Pressable>
            </View>
        </View>
    );

    if (showForm) {
        return (
            <ScreenLayout
                title={editingShop ? "Edit Shop" : "New Shop"}
                showBackButton
                onBackPress={() => setShowForm(false)}
            >
                <View style={styles.formContainer}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) =>
                                setFormData({ ...formData, name: text })
                            }
                            placeholder="Enter shop name"
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Phone</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.phone}
                            onChangeText={(text) =>
                                setFormData({ ...formData, phone: text })
                            }
                            placeholder="Enter phone number"
                            placeholderTextColor={COLORS.textSecondary}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Address</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.address}
                            onChangeText={(text) =>
                                setFormData({ ...formData, address: text })
                            }
                            placeholder="Enter address"
                            placeholderTextColor={COLORS.textSecondary}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <Pressable
                        onPress={handleSave}
                        style={({ pressed }) => [
                            styles.saveButton,
                            pressed && styles.saveButtonPressed,
                        ]}
                    >
                        <Text style={styles.saveButtonText}>Save</Text>
                    </Pressable>
                </View>
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout title="Barber Shops" showBackButton>
            <View style={styles.container}>
                <Pressable
                    onPress={handleCreate}
                    style={({ pressed }) => [
                        styles.createButton,
                        pressed && styles.createButtonPressed,
                    ]}
                >
                    <Text style={styles.createButtonText}>+ New Shop</Text>
                </Pressable>

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.gold} />
                ) : (
                    <FlatList
                        data={shops}
                        renderItem={renderShopItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>
                                No barber shops yet. Create your first one!
                            </Text>
                        }
                    />
                )}
            </View>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    createButton: {
        backgroundColor: COLORS.gold,
        padding: 16,
        borderRadius: RADIUS,
        alignItems: "center",
        marginBottom: 16,
    },
    createButtonPressed: {
        opacity: 0.8,
    },
    createButtonText: {
        color: COLORS.bg,
        fontSize: 16,
        fontWeight: "700",
    },
    listContent: {
        paddingBottom: 16,
    },
    shopCard: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: RADIUS,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    shopInfo: {
        marginBottom: 12,
    },
    shopName: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
    },
    shopDetail: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 4,
    },
    shopActions: {
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        flex: 1,
        backgroundColor: COLORS.surfaceElevated,
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    deleteButton: {
        backgroundColor: "#4A1A1A",
        borderColor: "#8A3A3A",
    },
    actionButtonPressed: {
        opacity: 0.7,
    },
    actionButtonText: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: "600",
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        textAlign: "center",
        marginTop: 32,
    },
    formContainer: {
        padding: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        color: COLORS.textPrimary,
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: COLORS.gold,
        padding: 16,
        borderRadius: RADIUS,
        alignItems: "center",
        marginTop: 16,
    },
    saveButtonPressed: {
        opacity: 0.8,
    },
    saveButtonText: {
        color: COLORS.bg,
        fontSize: 16,
        fontWeight: "700",
    },
});

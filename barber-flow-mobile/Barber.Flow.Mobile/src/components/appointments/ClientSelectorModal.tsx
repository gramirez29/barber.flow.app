import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
    ActivityIndicator,
} from "react-native";
import { clientHistoryService } from "../../services/clientHistoryService";
import type { Client } from "../../types/clients";
import { getErrorMessage } from "../../utils/errors";
import { useTranslation } from "../../context/LanguageContext";

const COLORS = {
    bg: "#0D0D0D",
    surface: "#1A1A1A",
    surfaceElevated: "#252525",
    gold: "#C9A84C",
    textPrimary: "#FFFFFF",
    textSecondary: "#9B9B9B",
    border: "#3A3A3A",
    overlay: "rgba(13, 13, 13, 0.85)",
} as const;

const RADIUS = 16;

interface ClientSelectorModalProps {
    visible: boolean;
    onClose: () => void;
    onClientSelected: (client: Client | null, clientId?: string) => void;
    initialPhone?: string;
}

export const ClientSelectorModal: React.FC<ClientSelectorModalProps> = ({
    visible,
    onClose,
    onClientSelected,
    initialPhone = "",
}) => {
    const { translateText } = useTranslation();
    const [phone, setPhone] = useState(initialPhone);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async () => {
        if (!phone.trim()) {
            setError(translateText("clientHistory.modal.phoneRequired"));
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await clientHistoryService.findByPhone(phone.trim());
            
            if (result.found && result.client) {
                onClientSelected(result.client, result.client.id);
                onClose();
            } else if (!result.found && result.clientName) {
                // Cliente no registrado pero hay citas con este teléfono
                onClientSelected(null);
                onClose();
            } else {
                setError(translateText("clientHistory.modal.noResults"));
            }
        } catch (err) {
            setError(getErrorMessage(err) || translateText("clientHistory.modal.searchFailed"));
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        onClientSelected(null);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>{translateText("clientHistory.modal.title")}</Text>
                    <Text style={styles.description}>
                        {translateText("clientHistory.modal.subtitle")}
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder={translateText("clientHistory.searchPlaceholder")}
                            placeholderTextColor={COLORS.textSecondary}
                            keyboardType="phone-pad"
                            autoFocus
                        />
                    </View>

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    <View style={styles.actions}>
                        <Pressable
                            onPress={handleSkip}
                            style={({ pressed }) => [
                                styles.button,
                                styles.skipButton,
                                pressed && styles.buttonPressed,
                            ]}
                            disabled={loading}
                        >
                            <Text style={styles.skipButtonText}>{translateText("clientHistory.modal.skip")}</Text>
                        </Pressable>

                        <Pressable
                            onPress={handleSearch}
                            style={({ pressed }) => [
                                styles.button,
                                styles.searchButton,
                                pressed && styles.buttonPressed,
                            ]}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={COLORS.bg} />
                            ) : (
                                <Text style={styles.searchButtonText}>{translateText("common.search")}</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modal: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS,
        padding: 24,
        width: "100%",
        maxWidth: 400,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
    },
    description: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: COLORS.surfaceElevated,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        color: COLORS.textPrimary,
        fontSize: 16,
    },
    errorText: {
        color: "#FF6B6B",
        fontSize: 14,
        marginBottom: 16,
    },
    actions: {
        flexDirection: "row",
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 52,
    },
    skipButton: {
        backgroundColor: COLORS.surfaceElevated,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchButton: {
        backgroundColor: COLORS.gold,
    },
    buttonPressed: {
        opacity: 0.7,
    },
    skipButtonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: "600",
    },
    searchButtonText: {
        color: COLORS.bg,
        fontSize: 16,
        fontWeight: "700",
    },
});

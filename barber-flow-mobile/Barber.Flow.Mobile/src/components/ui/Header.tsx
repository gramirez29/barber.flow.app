import { Ionicons } from "@expo/vector-icons";
import {
    TouchableOpacity,
    View,
    StyleSheet,
    Text,
} from "react-native";
import { useAppTheme } from "../../theme/ThemeContext";
import { useNotification } from "../../context/NotificationContext";
import { useAuthStore } from '../../store/auth.store';
import { useTranslation } from "../../context/LanguageContext";
import { ScreenTitle } from "./ScreenTitle";

interface HeaderProps {
    title: string;
    onMenuPress?: () => void;
    onBellPress?: () => void;
}

export const Header = ({ title, onMenuPress, onBellPress }: HeaderProps) => {
    const { theme } = useAppTheme();
    const { unreadCount } = useNotification();
    const { translateText } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const identity = user?.name ?? user?.userName ?? translateText("header.guest");
    const roleLabel = user?.role ?? translateText("header.workspace");
    const initials = identity
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "BF";

    return (
    <View
        style={[
        styles.shell,
            {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            },
            theme.layout.shadows.card,
        ]}
    >
        <View style={styles.container}>
            {onMenuPress ? (
                <TouchableOpacity
                    onPress={onMenuPress}
                    style={[styles.iconButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                    activeOpacity={0.8}
                    accessibilityLabel={translateText("header.openMenu")}
                >
                    <Ionicons name="menu" size={22} color={theme.colors.textPrimary} />
                </TouchableOpacity>
            ) : (
                <View style={styles.iconPlaceholder} />
            )}

            <View style={styles.titleWrap}>
                <ScreenTitle
                    eyebrow="Barber Flow"
                    size="sm"
                    subtitle={roleLabel}
                    title={title}
                />
            </View>

            <View style={styles.actionsWrap}>
                {onBellPress ? (
                    <TouchableOpacity
                        style={[styles.notificationButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                        onPress={onBellPress}
                        activeOpacity={0.8}
                        accessibilityLabel={translateText("header.openNotifications")}
                    >
                        <Ionicons name="notifications-outline" size={20} color={theme.colors.textPrimary} />
                        {unreadCount > 0 ? (
                            <View style={[styles.badge, { backgroundColor: theme.colors.notificationBadge }]}>
                                <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                            </View>
                        ) : null}
                    </TouchableOpacity>
                ) : null}

                <View style={[styles.avatarWrap, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.avatarText, { color: theme.mode === "dark" ? "#0F172A" : "#FFFFFF" }]}>{initials}</Text>
                </View>
            </View>
        </View>

        <Text style={[styles.identityText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {translateText("header.signedInAs", { identity })}
        </Text>
    </View>
    );
};

const styles = StyleSheet.create({
    shell: {
        borderBottomWidth: 1,
        paddingBottom: 12,
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    titleWrap: {
        flex: 1,
        justifyContent: "center",
    },
    badge: {
        position: "absolute",
        top: -5,
        right: -5,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
    },
    badgeText: {
        fontSize: 10,
        color: "#FFFFFF",
        fontWeight: "700",
    },
    iconButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    iconPlaceholder: {
        width: 46,
        height: 46,
    },
    actionsWrap: {
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarWrap: {
        alignItems: "center",
        borderRadius: 20,
        height: 40,
        justifyContent: "center",
        width: 40,
    },
    avatarText: {
        fontSize: 13,
        fontWeight: "700",
    },
    identityText: {
        fontSize: 12,
        marginLeft: 60,
        marginTop: 8,
    },
});
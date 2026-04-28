import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
    const roleLabel = user?.role ?? translateText("header.workspace");

    return (
    <View
        style={[
        styles.shell,
            {
            borderBottomColor: "#2D2D2D",
            },
            theme.layout.shadows.card,
        ]}
    >
        <LinearGradient
            colors={["#080808", "#0F0F0F", "#1E1E1E"]}
            end={{ x: 1, y: 0.5 }}
            start={{ x: 0, y: 0.5 }}
            style={styles.gradient}
        >
            <View style={styles.container}>
                <View style={styles.sideSlot}>
                    {onMenuPress ? (
                        <TouchableOpacity
                            onPress={onMenuPress}
                            style={styles.iconButton}
                            activeOpacity={0.8}
                            accessibilityLabel={translateText("header.openMenu")}
                        >
                            <Ionicons name="grid-outline" size={21} color="#F5F5F5" />
                        </TouchableOpacity>
                    ) : null}
                </View>

                <View style={styles.titleWrap}>
                    <Text style={styles.eyebrow}>Barber Flow</Text>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>{roleLabel}</Text>
                </View>

                <View style={[styles.sideSlot, styles.actionsWrap]}>
                    {onBellPress ? (
                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={onBellPress}
                            activeOpacity={0.8}
                            accessibilityLabel={translateText("header.openNotifications")}
                        >
                            <Ionicons name="notifications-sharp" size={19} color="#F5F5F5" />
                            {unreadCount > 0 ? (
                                <View style={[styles.badge, { backgroundColor: theme.colors.notificationBadge }]}>
                                    <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                                </View>
                            ) : null}
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        </LinearGradient>
    </View>
    );
};

const styles = StyleSheet.create({
    shell: {
        borderBottomWidth: 1,
        overflow: "hidden",
    },
    gradient: {
        paddingBottom: 8,
        paddingHorizontal: 14,
        paddingTop: 10,
    },
    container: {
        alignItems: "center",
        flexDirection: "row",
    },
    titleWrap: {
        flex: 1,
        justifyContent: "center",
        gap: 2,
    },
    eyebrow: {
        color: "#C9A84C",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.9,
        textAlign: "center",
        textTransform: "uppercase",
    },
    title: {
        color: "#FAFAFA",
        fontSize: 19,
        fontWeight: "700",
        lineHeight: 24,
        textAlign: "center",
    },
    subtitle: {
        color: "#B9B9B9",
        fontSize: 11,
        fontWeight: "500",
        textAlign: "center",
    },
    sideSlot: {
        alignItems: "center",
        height: 46,
        justifyContent: "center",
        width: 50,
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
        borderColor: "#3D3D3D",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(20, 20, 20, 0.98)",
    },
    actionsWrap: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "#3D3D3D",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(20, 20, 20, 0.98)",
    },
});
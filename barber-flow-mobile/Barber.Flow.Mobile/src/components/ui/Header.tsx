import { Ionicons } from "@expo/vector-icons";
import {
    TouchableOpacity,
    View,
    StyleSheet,
    Text,
    Button,
    Switch,
} from "react-native";
import { useAppTheme } from "../../theme/ThemeContext";
import { useNotification } from "../../context/NotificationContext";

interface HeaderProps {
    title: string;
    onMenuPress?: () => void;
    onBellPress?: () => void;
}

export const Header = ({ title, onMenuPress, onBellPress }: HeaderProps) => {
    const { toggleTheme, theme } = useAppTheme();
    const isDarkMode = theme.mode === "dark";
    const { clientNotifications } = useNotification();
    return (
    <View
        style={[
        styles.container,
            {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            },
        ]}
    >
        {/* Menu button */}
        <TouchableOpacity onPress={onMenuPress} style={ styles.iconButton } activeOpacity={ 0.7 } >
            <Ionicons name="menu" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {title}
        </Text>

        {/* Notification button */}
        <TouchableOpacity style={ styles.bellContainer } onPress={onBellPress} >
            <Ionicons name="notifications-outline" size={22} color={theme.colors.textPrimary} />
            {
                clientNotifications > 0 && (
                    <View style={ styles.badge }>
                        <Text style={ styles.badgeText }>{ clientNotifications > 9 ? "9+" : clientNotifications }</Text>
                    </View>
                )
            }
        </TouchableOpacity>

      {/* Espaciador para centrar el título */}
        <View style={{ width: 24 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        borderBottomWidth: 0.5,

        // Sombra para iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,

        // Sombra para Android
        elevation: 4,
    },
    container: {
        height: 64,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
    },
    bellContainer: {
        width: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    badge: {
        position: "absolute",
        top: -4,
        right: -6,
        backgroundColor: "#FF0000",
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 3,
    },
    badgeText: {
        fontSize: 10,
        color: "#FFFFFF",
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    side: {
        width: 60, // MISMO ancho a ambos lados → centra el título
        alignItems: "flex-start",
    },
    rightSection: {
        width: 80,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
    },
});

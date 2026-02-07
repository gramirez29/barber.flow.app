import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from "../../theme/ThemeContext";

interface SettingItemProps {
    icon?: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: boolean;
    onPress?: () => void;
    onToggle?: () => void;
    showArrow?: boolean;
    isLast?: boolean;
}

export const SettingItem = ({
    icon,
    label,
    value,
    onPress,
    onToggle,
    showArrow = false,
    isLast = false, 
}: SettingItemProps) => {

    const { theme } = useAppTheme();

    return (
        <TouchableOpacity activeOpacity={onPress ? 0.6 : 1} onPress={onPress} style={[styles.row, !isLast && styles.divider]}>
            <View style={styles.left}>
                <Ionicons name={icon} size={20} style={[{ color: theme.colors.textSecondary }]} />
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
            </View>
            {
                onToggle !== undefined ? (
                    <Switch value={value} onValueChange={onToggle} />
                ) : showArrow ? (
                    <Ionicons name="chevron-forward-outline" size={20} style={[{ color: theme.colors.textSecondary }]} />
                ) : null}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    row: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
        color: "#111827",
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
});
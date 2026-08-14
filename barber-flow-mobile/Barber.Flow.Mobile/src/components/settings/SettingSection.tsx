import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../../theme/ThemeContext";

interface SettingSectionProps {
    title: string;
    children?: React.ReactNode;
}

export const SettingSection = ({ title, children }: SettingSectionProps) => {
    const { theme } = useAppTheme();
    return (
        <View style={styles.section}>
            <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{title}</Text>
            <View style={[styles.card, theme.layout.shadows.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                {children}
            </View>
        </View>
    );  
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    title: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 8,
        marginLeft: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    card: {
        borderWidth: 1,
        borderRadius: 16,
        overflow: "hidden",
    },
});
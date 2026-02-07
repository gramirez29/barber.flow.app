import { View, Text, StyleSheet } from "react-native";

interface SettingSectionProps {
    title: string;
    children?: React.ReactNode;
}

export const SettingSection = ({ title, children }: SettingSectionProps) => {
    return (
        <View style={styles.section}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.card}>
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
        color: "#6B7280",
        marginBottom: 8,
        marginLeft: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        elevation: 4,
    },
});
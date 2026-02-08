import { ScreenLayout } from "../components/ScreenLayout";
import { StyleSheet, Text } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import { useNavigation, DrawerActions } from '@react-navigation/native';

export const NotificationScreen = () => {
    const navigation = useNavigation();
    const { theme } = useAppTheme();
    
    return (
        <ScreenLayout
            title="Notificaciones"
            backgroundColor={theme.colors.background}
            center

        >
            <Text style={[styles.text, { color: theme.colors.textPrimary }]}>
                Pantalla de Notificaciones
            </Text>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    text: {
        justifyContent: "center",
        alignItems: "center",
        fontSize: 18,
    },
});
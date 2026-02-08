import { ScreenLayout } from "../components/ScreenLayout";
import { StyleSheet, Text } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import { useNavigation, DrawerActions } from '@react-navigation/native';

export const ClientsScreen = () => {

    const navigation = useNavigation();
    const { theme } = useAppTheme();

    return (
        <ScreenLayout
            title="Clientes"
            backgroundColor={theme.colors.background}
            center
            onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
                <Text style={[styles.text, { color: theme.colors.textPrimary }]}>
                    Pantalla de Clientes
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

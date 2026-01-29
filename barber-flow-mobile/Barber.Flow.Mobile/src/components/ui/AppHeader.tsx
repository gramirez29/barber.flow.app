import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, StyleSheet, Text } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { typography } from "../../theme";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";

{/* Props for the AppHeader component */}
interface AppHeaderProps {
    title: string;
    showBack?: boolean;
    onBackPress?: () => void;
}

export const AppHeader = ({ 
    title,
    showBack = false,
    onBackPress }: AppHeaderProps) => {

        const { colors } = useTheme();
        const navigation = useNavigation<any>();

        // 🔥 ABRE EL MENU
        const handleMenuPress = () =>
            {
                navigation.openDrawer();
            };

    return (
        <View style={ [styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            {
                showBack ? (
                    <TouchableOpacity onPress={onBackPress}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} /> 
                    </TouchableOpacity>

                ) : (
                    <Ionicons name="menu" size={24} color={colors.textPrimary} />
                )}

                <Text style={[ styles.title, { color: colors.textPrimary }]}>
                    {title}
                </Text>

                {/* Espaciador para centrar el título */}
                <View style={{ width: 24 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    title: {
        flex: 1,
        textAlign: "center",
        ...typography.screenTitle
    }
});
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { Header } from "./ui/Header";
import { useAppTheme } from "../theme/ThemeContext";

interface ScreenLayoutProps {
    children: React.ReactNode;
    title?: string;
    backgroundColor?: string;
    center?: boolean;
    onMenuPress?: () => void;
}

export const ScreenLayout = ({ 
    children,
    title,
    backgroundColor, // establecer color de fondo desde las props si es necesario
    center = false,
    onMenuPress,
    }: ScreenLayoutProps) => {

        const { theme } = useAppTheme();

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }, center && styles.center ]}>
                {title && <Header title={title} onMenuPress={onMenuPress} />}

                <View style={[styles.content, center && styles.center]}>
                    {children}
                </View>
            </SafeAreaView>
        );
    };

    const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
        content: {
        flex: 1,
        padding: 16,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

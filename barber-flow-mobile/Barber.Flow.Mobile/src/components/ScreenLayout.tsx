import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { AppHeader } from "./ui/AppHeader";
import { useTheme } from "../hooks/useTheme";

interface ScreenLayoutProps {
    children: React.ReactNode;
    title?: string;
    backgroundColor?: string;
    center?: boolean;
}

export const ScreenLayout = ({ 
    children,
    title,
    backgroundColor = '#F4F6F8',
    center = false }: ScreenLayoutProps) => {

        const { colors } = useTheme();

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, center && styles.center ]}>

                {/* Si "title" no se recibe AppHeader no se muestra */}
                {title && <AppHeader title={title} />}

                {/* Children corresponde a cada screen que se muestra en la pantalla */}
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

import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { Header } from "./ui/Header";
import { useNavigation } from "@react-navigation/native"; 
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
    backgroundColor,
    center = false,
    onMenuPress,
    }: ScreenLayoutProps) => {

        const navigation = useNavigation<any>();

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: backgroundColor }, center && styles.center ]}>
                {title && <Header title={title} onMenuPress={onMenuPress} onBellPress={() => navigation.navigate("NotificationScreen")} />}

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

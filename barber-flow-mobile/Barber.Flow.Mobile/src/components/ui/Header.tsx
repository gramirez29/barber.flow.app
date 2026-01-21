import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, StyleSheet, Text } from "react-native";


interface HeaderProps {
    title: string;
    onMenuPress?: () => void;
}

export const Header = ({ title, onMenuPress }: HeaderProps) => {
    return (
        <View style={ styles.container }>
            <TouchableOpacity onPress={onMenuPress}>
                <Ionicons name="menu" size={24} color="#111" /> 
            </TouchableOpacity>

            <Text style={ styles.title }>{title}</Text>

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
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    title: {
flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    }
});
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, StyleSheet, Text, Button, Switch } from "react-native";
import { useAppTheme } from "../../theme/ThemeContext";

interface HeaderProps {
    title: string;
    onMenuPress?: () => void;
}

export const Header = ({ title, onMenuPress }: HeaderProps) => {

    const { toggleTheme, theme } = useAppTheme();

    const isDarkMode = theme.mode === 'dark';
    
    return (
        <View style={ [styles.container, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }] }>

            <TouchableOpacity>
                <Ionicons name="menu" size={24} color={theme.colors.textPrimary} /> 
            </TouchableOpacity>

            <Text style={ [styles.title, { color: theme.colors.textPrimary }] }>{title}</Text>

            <View style={ [ styles.side, styles.right ]}>
                <Ionicons
                    name={isDarkMode ? 'moon' : 'sunny'}
                    size={18}
                    color={theme.colors.textPrimary}
                    style={{ marginRight: 6 }}
                />

                <Switch
                    value={isDarkMode}
                    onValueChange={toggleTheme}
                    trackColor={{ false: "#D1D5DB", true: "#6366F1" }}
                    thumbColor="#FFF"
                />
            </View>

            {/* Espaciador para centrar el título */}
            <View style={{ width: 24 }} />
        </View>

    );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingHorizontal: 12,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  side: {
    width: 60, // MISMO ancho a ambos lados → centra el título
    alignItems: "flex-start",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
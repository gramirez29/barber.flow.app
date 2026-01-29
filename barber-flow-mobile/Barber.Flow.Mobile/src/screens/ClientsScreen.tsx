import { ScreenLayout } from "../components/ScreenLayout";
import { StyleSheet, Text } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";

export const ClientsScreen = () => {
  const { theme } = useAppTheme();

  return (
    <ScreenLayout title="Clients" backgroundColor="#659dd6" center>
      <Text style={[styles.text, { color: theme.colors.textPrimary }]}>
        Clients Screen
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

import { ScreenLayout } from "../components/ScreenLayout";
import { StyleSheet, Text } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";

export const SettingsScreen = () => {
  const { theme } = useAppTheme();

  return (
    <ScreenLayout title="Settings" backgroundColor="#943f12" center>
      <Text style={[styles.text, { color: theme.colors.textPrimary }]}>
         Settings Screen
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

import { ScreenLayout } from "../components/ScreenLayout";
import { StyleSheet, Text } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";

export const CreateAppointmentScreen = () => {
  const { theme } = useAppTheme();

  return (
    <ScreenLayout title="Create Appointment" backgroundColor="#659dd6" center>
      <Text style={[styles.text, { color: theme.colors.textPrimary }]}>
         Appointment Screen
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

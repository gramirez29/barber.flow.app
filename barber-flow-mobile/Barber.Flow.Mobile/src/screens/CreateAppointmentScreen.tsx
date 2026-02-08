import { ScreenLayout } from "../components/ScreenLayout";
import { StyleSheet, Text } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import { useNavigation, DrawerActions } from "@react-navigation/core";

export const CreateAppointmentScreen = () => {

  const navigation = useNavigation();
  const { theme } = useAppTheme();

  return (
    <ScreenLayout
        title="Citas"
        backgroundColor = { theme.colors.background }
        center
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      >
      <Text style={[styles.text, { color: theme.colors.textPrimary }]}>
        Pantalla de Citas
      </Text>
    </ScreenLayout>
  );};

const styles = StyleSheet.create({
  text: {
    justifyContent: "center",
    alignItems: "center",
    fontSize: 18,
  },
});

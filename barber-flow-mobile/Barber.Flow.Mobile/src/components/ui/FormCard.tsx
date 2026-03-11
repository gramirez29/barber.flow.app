import React from "react";
import { View, StyleSheet } from "react-native";
import { useAppTheme } from "../../theme/ThemeContext";

type Props = { children: React.ReactNode; style?: any };

export const FormCard: React.FC<Props> = ({ children, style }) => {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.layout.radius.md,
        },
        style,
        theme.layout.shadows?.card,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 520,
    padding: 18,
    marginTop: 6,
  },
});

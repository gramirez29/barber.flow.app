import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../../theme/ThemeContext";

type NotificationEmptyStateProps = {
  body: string;
  title: string;
};

export const NotificationEmptyState = ({
  body,
  title,
}: NotificationEmptyStateProps) => {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Ionicons
        color={theme.colors.textSecondary}
        name="checkmark-done-circle-outline"
        size={24}
      />
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{body}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  container: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
});
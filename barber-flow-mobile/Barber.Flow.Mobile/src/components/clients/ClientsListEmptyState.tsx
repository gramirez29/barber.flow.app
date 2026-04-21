import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "react-native-paper";
import { useTranslation } from "../../context/LanguageContext";
import { useAppTheme } from "../../theme/ThemeContext";

interface ClientsListEmptyStateProps {
  loading: boolean;
}

export const ClientsListEmptyState = ({ loading }: ClientsListEmptyStateProps) => {
  const { theme } = useAppTheme();
  const { translateText } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Ionicons name={loading ? "hourglass-outline" : "people-outline"} size={28} color={theme.colors.textSecondary} />
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        {translateText("clients.list.emptyTitle")}
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        {translateText("clients.list.emptyBody")}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  container: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
});
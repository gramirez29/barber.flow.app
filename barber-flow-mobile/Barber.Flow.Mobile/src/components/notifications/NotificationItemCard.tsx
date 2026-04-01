import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useAppTheme } from "../../theme/ThemeContext";
import type { NotificationItem } from "../../types/notifications";

type NotificationItemCardProps = {
  item: NotificationItem;
  onDismiss: (notificationId: string) => void;
  onPress: (item: NotificationItem) => void;
};

const getNotificationIcon = (type: NotificationItem["type"]) => {
  switch (type) {
    case "delayed-client-summary":
      return "alert-circle-outline";
    default:
      return "calendar-outline";
  }
};

export const NotificationItemCard = ({
  item,
  onDismiss,
  onPress,
}: NotificationItemCardProps) => {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: item.isRead ? theme.colors.background : theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: theme.mode === "dark" ? "rgba(96, 165, 250, 0.16)" : "rgba(59, 130, 246, 0.1)",
            },
          ]}
        >
          <Ionicons
            color={item.type === "delayed-client-summary" ? theme.colors.error : theme.colors.secondary}
            name={getNotificationIcon(item.type)}
            size={18}
          />
        </View>

        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            {item.type === "next-day-summary" ? "Tomorrow" : "Needs follow-up"}
          </Text>
        </View>

        {!item.isRead ? (
          <View style={[styles.unreadDot, { backgroundColor: theme.colors.notificationBadge }]} />
        ) : null}
      </View>

      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{item.message}</Text>

      <View style={styles.actionsRow}>
        <Button compact mode="text" onPress={() => onPress(item)}>
          Open
        </Button>
        <Button compact mode="text" onPress={() => onDismiss(item.id)} textColor={theme.colors.textSecondary}>
          Dismiss
        </Button>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  actionsRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  unreadDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});
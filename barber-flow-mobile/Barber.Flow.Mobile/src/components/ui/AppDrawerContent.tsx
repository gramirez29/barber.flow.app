import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth.store";
import { authService } from "../../services/authService";
import { useAppTheme } from "../../theme/ThemeContext";
import { ScreenTitle } from "./ScreenTitle";
const pkg = require("../../../package.json");

const getInitials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "BF";

export const AppDrawerContent = (props: any) => {
  const clearUser = useAuthStore((s) => s.clearUser);
  const user = useAuthStore((s) => s.user);
  const { theme } = useAppTheme();

  const name = user?.name ?? "Guest";
  const email = user?.email ?? "";
  const userName = user?.userName ?? "";
  const role = user?.role ?? "";
  const avatarUri = "https://i.pravatar.cc/160?img=12";
  const identity = name === "Guest" && userName ? userName : name;
  const initials = getInitials(identity);

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          props.navigation.closeDrawer();
          clearUser();
          await authService.clearStoredUser();
        },
      },
    ]);
  };

  const goToSettings = () => {
    props.navigation.navigate("HomeTabs", { screen: "SettingsScreen" });
    props.navigation.closeDrawer();
  };

  const openHelp = () => {
    Alert.alert(
      "Help",
      "For help, contact support or check the documentation.",
    );
  };

  const year = new Date().getFullYear();
  const version = pkg?.version ?? "0.0.0";

  const renderAction = ({
    destructive = false,
    icon,
    label,
    onPress,
    description,
  }: {
    description: string;
    destructive?: boolean;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      key={label}
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        styles.actionRow,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.actionIconWrap,
          {
            backgroundColor: destructive
              ? theme.mode === "dark"
                ? "rgba(248, 113, 113, 0.16)"
                : "rgba(220, 38, 38, 0.10)"
              : theme.mode === "dark"
                ? "rgba(96, 165, 250, 0.18)"
                : "rgba(59, 130, 246, 0.10)",
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? theme.colors.error : theme.colors.textPrimary}
        />
      </View>

      <View style={styles.actionCopy}>
        <Text
          style={[
            styles.actionLabel,
            { color: destructive ? theme.colors.error : theme.colors.textPrimary },
          ]}
        >
          {label}
        </Text>
        <Text style={[styles.actionDescription, { color: theme.colors.textSecondary }]}>
          {description}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          theme.layout.shadows.card,
        ]}
      >
        <View style={styles.heroTopRow}>
          <View style={[styles.brandPill, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}> 
            <Text style={[styles.brandPillText, { color: theme.colors.textSecondary }]}>Barber Flow</Text>
          </View>
          <View style={[styles.versionPill, { backgroundColor: theme.mode === "dark" ? "rgba(96, 165, 250, 0.18)" : "rgba(59, 130, 246, 0.10)" }]}> 
            <Text style={[styles.versionPillText, { color: theme.colors.secondary }]}>v{version}</Text>
          </View>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatarStack}>
            <Image
              source={{ uri: avatarUri }}
              style={[
                styles.avatar,
                {
                  width: theme.layout.sizes.avatar + 12,
                  height: theme.layout.sizes.avatar + 12,
                  borderRadius: (theme.layout.sizes.avatar + 12) / 2,
                },
              ]}
            />
            <View style={[styles.avatarBadge, { backgroundColor: theme.colors.primary }]}> 
              <Text style={[styles.avatarBadgeText, { color: theme.mode === "dark" ? "#0F172A" : "#FFFFFF" }]}>{initials}</Text>
            </View>
          </View>

          <View style={styles.userInfo}>
            <ScreenTitle
              eyebrow="Studio access"
              size="sm"
              subtitle={email || userName || "No account metadata available"}
              title={identity}
            />
            {role ? (
              <View style={[styles.rolePill, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Text style={[styles.rolePillText, { color: theme.colors.textSecondary }]}>{role}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={[styles.heroBody, { color: theme.colors.textSecondary }]}>Use the drawer to reach settings, support, and account-level actions from one clean workspace surface.</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Workspace</Text>
        {renderAction({
          description: "Theme, notifications, and app preferences",
          icon: "settings-outline",
          label: "Settings",
          onPress: goToSettings,
        })}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Support</Text>
        {renderAction({
          description: "Get help and usage guidance",
          icon: "help-circle-outline",
          label: "Help",
          onPress: openHelp,
        })}
        {renderAction({
          description: "Close the current session on this device",
          destructive: true,
          icon: "log-out-outline",
          label: "Logout",
          onPress: handleLogout,
        })}
      </View>

      <View style={styles.footerWrap} />

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Barber Flow Mobile</Text>
        <Text
          style={[styles.footerMeta, { color: theme.colors.textSecondary }]}
        >
          v{version} • {year}
        </Text>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 16 },
  heroCard: {
    borderRadius: 26,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 18,
  },
  brandPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  brandPillText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  versionPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  versionPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  profileRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  avatarStack: {
    position: "relative",
  },
  avatar: {},
  avatarBadge: {
    alignItems: "center",
    borderRadius: 16,
    bottom: -2,
    height: 32,
    justifyContent: "center",
    position: "absolute",
    right: -6,
    width: 32,
  },
  avatarBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
    gap: 10,
  },
  rolePill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  heroBody: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  actionRow: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actionIconWrap: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  footerWrap: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    gap: 4,
    paddingHorizontal: 4,
    paddingTop: 14,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "700",
  },
  footerMeta: {
    fontSize: 12,
  },
});

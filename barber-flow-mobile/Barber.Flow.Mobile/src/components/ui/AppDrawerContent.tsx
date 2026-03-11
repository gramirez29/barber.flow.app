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
import { useAppTheme } from "../../theme/ThemeContext";
const pkg = require("../../../package.json");

export const AppDrawerContent = (props: any) => {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const username = useAuthStore((s) => s.username);
  const { theme } = useAppTheme();

  const name = username ?? "Guest";
  const email = username ? `${username}@example.com` : "";
  const avatarUri = "https://i.pravatar.cc/160?img=12";

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          props.navigation.closeDrawer();
          clearAuth();
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

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <View style={[styles.section, styles.userSection]}>
        <Image
          source={{ uri: avatarUri }}
          style={[
            styles.avatar,
            {
              width: theme.layout.sizes.avatar,
              height: theme.layout.sizes.avatar,
              borderRadius: theme.layout.sizes.avatar / 2,
            },
          ]}
        />
        <View style={styles.userInfo}>
          <Text
            style={[styles.name, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {email ? (
            <Text
              style={[styles.email, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              {email}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={goToSettings}>
          <Ionicons
            name="settings-outline"
            size={20}
            color={theme.colors.textPrimary}
          />
          <Text style={[styles.rowText, { color: theme.colors.textPrimary }]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={openHelp}>
          <Ionicons
            name="help-circle-outline"
            size={20}
            color={theme.colors.textPrimary}
          />
          <Text style={[styles.rowText, { color: theme.colors.textPrimary }]}>
            Help
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color={theme.colors.textPrimary}
          />
          <Text style={[styles.rowText, { color: theme.colors.textPrimary }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Text
          style={[styles.footerText, { color: theme.colors.textSecondary }]}
        >
          v{version} • {year}
        </Text>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 8 },
  section: { paddingHorizontal: 16, paddingVertical: 12 },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 14,
  },
  avatar: { marginRight: 12 },
  userInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600" },
  email: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, backgroundColor: "#E6E6E6", marginHorizontal: 8 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  rowText: { marginLeft: 12, fontSize: 15 },
  footer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  footerText: { fontSize: 13 },
});

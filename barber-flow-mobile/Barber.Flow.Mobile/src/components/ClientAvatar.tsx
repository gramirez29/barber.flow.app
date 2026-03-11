import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";

interface ClientAvatarProps {
  size?: number;
  uri?: string;
}

export const ClientAvatar: React.FC<ClientAvatarProps> = ({ size = 96, uri }) => {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.avatarWrap, { borderColor: theme.colors.primary, width: size, height: size, borderRadius: size / 2 }]}> 
      <Image
        source={uri ? { uri } : require("../../assets/images/client-default.jpg")}
        style={{ width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 }}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  avatarWrap: {
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
});

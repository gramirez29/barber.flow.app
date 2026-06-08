import React from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";

interface ClientAvatarProps {
	size?: number;
	uri?: string;
	initials?: string;
}

const getInitials = (value?: string) => {
	if (!value) return "CL";
	const parts = value.trim().split(/\s+/).filter(Boolean).slice(0, 2);
	if (parts.length === 0) return "CL";
	return parts.map(p => p[0]?.toUpperCase() ?? "").join("");
};

export const ClientAvatar: React.FC<ClientAvatarProps> = ({ size = 96, uri, initials }) => {
	const { theme } = useAppTheme();
	return (
		<View
			style={[
				styles.avatarWrap,
				{
					backgroundColor: theme.colors.surface,
					width: size,
					height: size,
					borderRadius: size / 2,
					borderColor: theme.colors.accent,
					borderWidth: 2
				},
			]}
		>
		<View
			style={[
				styles.innerCircle,
				{
					backgroundColor: theme.colors.background,
					width: size - 8,
					height: size - 8,
					borderRadius: (size - 8) / 2,
				},
			]}
		>
			{uri ? (
				<Image
					source={{ uri }}
					style={{ width: size - 22, height: size - 22, borderRadius: (size - 22) / 2 }}
					resizeMode="cover"
				/>
			) : (
				<View style={[styles.initialsContainer, { backgroundColor: theme.colors.accent + "20" }]}>
					<Text style={[styles.initialsText, { color: theme.colors.accent, fontSize: size * 0.35 }]}>
						{getInitials(initials)}
					</Text>
				</View>
			)}
		</View>
		</View>
	);
};

const styles = StyleSheet.create({
	avatarWrap: {
		justifyContent: "center",
		alignItems: "center",
	},
	innerCircle: {
		alignItems: "center",
		justifyContent: "center",
	},
	initialsContainer: {
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		height: "100%",
	},
	initialsText: {
		fontWeight: "700",
	},
});

import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../theme/ThemeContext";

interface ClientAvatarProps {
	size?: number;
	uri?: string;
	initials?: string;
}

const getInitials = (value?: string) => {
	if (!value) {
		return "CL";
	}

	const parts = value
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2);

	if (parts.length === 0) {
		return "CL";
	}

	return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};

export const ClientAvatar: React.FC<ClientAvatarProps> = ({ size = 96, uri, initials }) => {
	const { theme } = useAppTheme();
	return (
		<View
			style={[
				styles.avatarWrap,
				{
				backgroundColor: theme.colors.surface,
				borderColor: theme.colors.border,
				width: size,
				height: size,
				borderRadius: size / 2,
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
			<Image
				source={uri ? { uri } : require("../../assets/images/no-image.jpg")}
				style={{ width: size - 22, height: size - 22, borderRadius: (size - 22) / 2 }}
				resizeMode="cover"
			/>
			<View
				style={[
					styles.initialsBadge,
					{
						backgroundColor: theme.colors.badgePrimary,
					},
				]}
				>
				<Text style={styles.initialsText}>
					{getInitials(initials)}
				</Text>
			</View>
		</View>
		</View>
	);
};

const styles = StyleSheet.create({
	avatarWrap: {
		borderWidth: 1,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.08,
		shadowRadius: 16,
		elevation: 4,
	},
	innerCircle: {
		alignItems: "center",
		justifyContent: "center",
	},
	initialsBadge: {
		borderRadius: 999,
		bottom: 0,
		minWidth: 34,
		paddingHorizontal: 8,
		paddingVertical: 5,
		position: "absolute",
		right: -4,
	},
	initialsText: {
		color: "#FFFFFF",
		fontSize: 11,
		fontWeight: "700",
		textAlign: "center",
	},
});

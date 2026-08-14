import React, { useMemo } from "react";
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

export const ClientAvatar = ({ size = 96, uri, initials }: ClientAvatarProps) => {
	const { theme } = useAppTheme();

	const innerSize = size - 8;
	const imageSize = size - 22;

	const dynamicStyles = useMemo(() => {
		return {
			container: {
				backgroundColor: theme.colors.surface,
				width: size,
				height: size,
				borderRadius: size / 2,
				borderColor: theme.colors.accent,
				borderWidth: 2,
			},
			inner: {
				backgroundColor: theme.colors.background,
				width: innerSize,
				height: innerSize,
				borderRadius: innerSize / 2,
			},
			image: {
				width: imageSize,
				height: imageSize,
				borderRadius: imageSize / 2,
			},
			initialsText: {
				color: theme.colors.accent,
				fontSize: size * 0.35,
			},
			initialsContainerStyle: {
				backgroundColor: "transparent",
			},
			containerStyles: [styles.avatarWrap, { 
				backgroundColor: theme.colors.surface,
				width: size,
				height: size,
				borderRadius: size / 2,
				borderColor: theme.colors.accent,
				borderWidth: 2,
			}],
			innerStyles: [styles.innerCircle, {
				backgroundColor: theme.colors.background,
				width: innerSize,
				height: innerSize,
				borderRadius: innerSize / 2,
			}],
		};
	}, [theme, size, innerSize, imageSize]);

	return (
		<View style={dynamicStyles.containerStyles}>
			<View style={dynamicStyles.innerStyles}>
				{uri ? (
					<Image
						source={{ uri }}
						style={dynamicStyles.image}
						resizeMode="cover"
					/>
				) : (
					<View
						style={[
							styles.initialsContainer,
							dynamicStyles.initialsContainerStyle,
						]}
					>
						<Text style={[styles.initialsText, dynamicStyles.initialsText]}>
							{getInitials(initials)}
						</Text>
					</View>
				)}
			</View>
		</View>
	);
};

ClientAvatar.displayName = "ClientAvatar";

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

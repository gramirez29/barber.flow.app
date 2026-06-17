import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { ClientAvatar } from "./ClientAvatar";
import { useTranslation } from "../context/LanguageContext";
import { useDialog } from "../context/DialogContext";

import type { AppTheme } from "../theme/themes";
import { useAppTheme } from "../theme/ThemeContext";

interface AvatarPickerProps {
	/** Current photo URI; falls back to no-image or initials if undefined */
	uri?: string;
	/** Initials for the ClientAvatar fallback */
	initials?: string;
	/** Avatar diameter in pixels (default 88) */
	size?: number;
	/** Disables interaction while an async operation is in progress */
	loading?: boolean;
	/**
	 * "compact" - avatar + two small icon buttons stacked beneath it.
	 *              Fits inside a narrow hero card column (e.g. ClientForm).
	 * "full"    - centered avatar preview + two full-width labeled buttons below.
	 *              Used in standalone photo-card sections (e.g. ManageApplicationUsersForm).
	 */
	variant?: "compact" | "full";
	/** Called with the local file URI after the user successfully picks a photo */
	onChangePhoto: (uri: string) => void;
}

export const AvatarPicker = ({
	uri,
	initials,
	size = 88,
	loading = false,
	variant = "full",
	onChangePhoto,
}: AvatarPickerProps) => {
	const { translateText } = useTranslation();
	const { showAlert } = useDialog();
	const { theme } = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	const handlePickFromGallery = async () => {
		if (loading) return;
		try {
			const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (!permission.granted) {
				showAlert(
					translateText("common.open"),
					translateText("avatarPicker.galleryPermissionRequired"),
				);
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				allowsEditing: true,
				aspect: [1, 1],
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				quality: 0.85,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				onChangePhoto(result.assets[0].uri);
			}
		} catch (error) {
			console.error("Error picking image from gallery:", error);
		}
	};

	const handleTakePhoto = async () => {
		if (loading) return;
		try {
			const permission = await ImagePicker.requestCameraPermissionsAsync();

			if (!permission.granted) {
				showAlert(
					translateText("common.open"),
					translateText("avatarPicker.cameraPermissionRequired"),
				);
				return;
			}

			const result = await ImagePicker.launchCameraAsync({
				allowsEditing: true,
				aspect: [1, 1],
				cameraType: ImagePicker.CameraType.front,
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				quality: 0.85,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				onChangePhoto(result.assets[0].uri);
			}
		} catch (error) {
			console.error("Error taking photo:", error);
		}
	};

	if (variant === "compact") {
		return (
			<View style={styles.compactWrap}>
				<ClientAvatar size={size} uri={uri} initials={initials} />
				<View style={[styles.compactBtns, { width: size }]}>
					<Pressable
						onPress={() => void handleTakePhoto()}
						disabled={loading}
						style={({ pressed }) => [
							styles.compactBtn,
							styles.compactBtnPrimary,
							loading && styles.btnDisabled,
							pressed && { opacity: 0.8 },
						]}
					>
						<Ionicons name="camera" size={14} color={theme.colors.background} />
					</Pressable>
					<Pressable
						onPress={() => void handlePickFromGallery()}
						disabled={loading}
						style={({ pressed }) => [
							styles.compactBtn,
							styles.compactBtnSecondary,
							loading && styles.btnDisabled,
							pressed && { opacity: 0.8 },
						]}
					>
						<Ionicons name="images" size={14} color={theme.colors.textPrimary} />
					</Pressable>
				</View>
			</View>
		);
	}

	// "full" variant
	return (
		<View style={styles.fullWrap}>
			<View style={styles.previewWrap}>
				<ClientAvatar size={size} uri={uri} initials={initials} />
			</View>
			<View style={styles.fullBtns}>
				<Pressable
					onPress={() => void handleTakePhoto()}
					disabled={loading}
					style={({ pressed }) => [
						styles.fullBtnPrimary,
						loading && styles.btnDisabled,
						pressed && { opacity: 0.8 },
					]}
				>
					<Text style={styles.fullBtnPrimaryText}>
						{translateText("avatarPicker.takePhoto")}
					</Text>
				</Pressable>
				<Pressable
					onPress={() => void handlePickFromGallery()}
					disabled={loading}
					style={({ pressed }) => [
						styles.fullBtnSecondary,
						loading && styles.btnDisabled,
						pressed && { opacity: 0.8 },
					]}
				>
					<Text adjustsFontSizeToFit numberOfLines={1} style={styles.fullBtnSecondaryText}>
						{translateText("avatarPicker.fromGallery")}
					</Text>
				</Pressable>
			</View>
		</View>
	);
};

AvatarPicker.displayName = "AvatarPicker";

const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
		// ── Compact variant ────────────────────────────────────────────────────
		compactWrap: {
			alignItems: "center",
			gap: 6,
		},
		compactBtns: {
			flexDirection: "row",
			gap: 5,
		},
		compactBtn: {
			alignItems: "center",
			borderRadius: 8,
			flex: 1,
			justifyContent: "center",
			minHeight: 28,
		},
		compactBtnPrimary: {
			backgroundColor: theme.colors.accent,
		},
		compactBtnSecondary: {
			backgroundColor: theme.colors.surfaceElevated,
			borderColor: theme.colors.border,
			borderWidth: 1,
		},
		// ── Full variant ───────────────────────────────────────────────────────
		fullWrap: {
			gap: 12,
		},
		previewWrap: {
			alignItems: "center",
		},
		fullBtns: {
			flexDirection: "row",
			gap: 8,
		},
		fullBtnPrimary: {
			alignItems: "center",
			backgroundColor: theme.colors.accent,
			borderRadius: 12,
			flex: 1,
			justifyContent: "center",
			minHeight: 42,
			paddingHorizontal: 12,
		},
		fullBtnPrimaryText: {
			color: theme.colors.background,
			fontSize: 14,
			fontWeight: "700",
		},
		fullBtnSecondary: {
			alignItems: "center",
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderRadius: 12,
			borderWidth: 1,
			flex: 1,
			justifyContent: "center",
			minHeight: 42,
			paddingHorizontal: 12,
		},
		fullBtnSecondaryText: {
			color: theme.colors.textPrimary,
			fontSize: 14,
			fontWeight: "600",
			textAlign: "center",
		},
		// ── Shared ────────────────────────────────────────────────────────────
		btnDisabled: {
			opacity: 0.5,
		},
	});

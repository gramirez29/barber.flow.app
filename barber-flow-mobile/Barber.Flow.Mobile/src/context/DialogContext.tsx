import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../theme/themes";
import { useAppTheme } from "../theme/ThemeContext";

export interface DialogButton {
	text: string;
	onPress?: () => void;
	style?: "default" | "cancel" | "destructive";
}

export interface DialogOptions {
	/**
	 * "danger" renders the red "last warning" dialog used before irreversible deletions: red border,
	 * warning icon, red title, the list of what will be lost and a solid red confirm button.
	 */
	variant?: "danger";
	/** Items listed under the message (what will be lost). Only shown with variant "danger". */
	details?: string[];
}

interface DialogState extends DialogOptions {
	title: string;
	message?: string;
	buttons: DialogButton[];
	visible: boolean;
}

interface DialogContextType {
	showAlert: (title: string, message?: string, buttons?: DialogButton[], options?: DialogOptions) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

const DEFAULT_BUTTONS: DialogButton[] = [{ text: "OK" }];

// Imperative bridge so non-component modules (e.g. apiClient.ts, which can't
// use the useDialog hook) can still trigger the app-wide dialog.
let bridgeShowAlert: DialogContextType["showAlert"] = () => {};

export const showGlobalAlert: DialogContextType["showAlert"] = (title, message, buttons, options) =>
	bridgeShowAlert(title, message, buttons, options);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { theme } = useAppTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const [dialog, setDialog] = useState<DialogState>({
		title: "",
		message: undefined,
		buttons: DEFAULT_BUTTONS,
		visible: false,
	});

	const showAlert = useCallback(
		(title: string, message?: string, buttons: DialogButton[] = DEFAULT_BUTTONS, options?: DialogOptions) => {
			setDialog({ title, message, buttons, visible: true, variant: options?.variant, details: options?.details });
		},
		[],
	);

	useEffect(() => {
		bridgeShowAlert = showAlert;
		return () => {
			bridgeShowAlert = () => {};
		};
	}, [showAlert]);

	const dismiss = () => {
		setDialog((prev) => ({ ...prev, visible: false }));
	};

	const handlePress = (onPress?: () => void) => {
		dismiss();
		onPress?.();
	};

	const cancelButton = dialog.buttons.find((b) => b.style === "cancel");
	const otherButtons = dialog.buttons.filter((b) => b.style !== "cancel");
	const isDanger = dialog.variant === "danger";

	return (
		<DialogContext.Provider value={{ showAlert }}>
			{children}
			<Modal
				visible={dialog.visible}
				transparent
				animationType="fade"
				statusBarTranslucent
				onRequestClose={cancelButton ? () => handlePress(cancelButton.onPress) : dismiss}
			>
				<View style={styles.backdrop}>
					<View style={[styles.dialog, isDanger && styles.dialogDanger]}>
						{isDanger ? (
							<View style={styles.dangerIcon}>
								<Ionicons name="warning" size={28} color={theme.colors.error} />
							</View>
						) : null}
						<Text style={[styles.title, isDanger && styles.titleDanger]}>{dialog.title}</Text>
						{dialog.message != null ? (
							<Text style={[styles.message, isDanger && styles.messageDanger]}>{dialog.message}</Text>
						) : null}
						{isDanger && dialog.details && dialog.details.length > 0 ? (
							<View style={styles.details}>
								{dialog.details.map((detail) => (
									<View key={detail} style={styles.detailRow}>
										<Text style={styles.detailBullet}>•</Text>
										<Text style={styles.detailText}>{detail}</Text>
									</View>
								))}
							</View>
						) : null}
						<View style={[styles.actions, isDanger && styles.actionsDanger]}>
							{cancelButton && (
								<Button
									mode={isDanger ? "outlined" : "text"}
									onPress={() => handlePress(cancelButton.onPress)}
									textColor={isDanger ? theme.colors.textPrimary : theme.colors.textSecondary}
									style={[styles.button, isDanger && styles.buttonDanger]}
								>
									{cancelButton.text}
								</Button>
							)}
							{otherButtons.map((btn, index) => (
								<Button
									key={index}
									mode={isDanger && btn.style === "destructive" ? "contained" : "text"}
									onPress={() => handlePress(btn.onPress)}
									buttonColor={isDanger && btn.style === "destructive" ? theme.colors.error : undefined}
									textColor={
										isDanger && btn.style === "destructive"
											? "#FFFFFF"
											: btn.style === "destructive"
												? theme.colors.error
												: theme.colors.accent
									}
									style={[styles.button, isDanger && styles.buttonDanger]}
								>
									{btn.text}
								</Button>
							))}
						</View>
					</View>
				</View>
			</Modal>
		</DialogContext.Provider>
	);
};

export const useDialog = (): DialogContextType => {
	const ctx = useContext(DialogContext);
	if (!ctx) throw new Error("useDialog must be used within DialogProvider");
	return ctx;
};

const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: theme.colors.overlay,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	dialog: {
		backgroundColor: theme.colors.surface,
		borderRadius: 14,
		borderWidth: 0.5,
		borderColor: theme.colors.accent,
		width: "100%",
		maxWidth: 400,
		paddingTop: 24,
		paddingBottom: 8,
		shadowColor: theme.colors.accent,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 12,
		elevation: 8,
	},
	title: {
		color: theme.colors.textPrimary,
		fontWeight: "700",
		fontSize: 17,
		marginBottom: 8,
		paddingHorizontal: 20,
	},
	message: {
		color: theme.colors.textSecondary,
		fontSize: 14,
		lineHeight: 22,
		marginBottom: 8,
		paddingHorizontal: 20,
	},
	actions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		paddingHorizontal: 8,
		paddingTop: 4,
	},
	button: {
		minWidth: 80,
	},
	dialogDanger: {
		backgroundColor: "#2A1515",
		borderColor: theme.colors.error,
		borderWidth: 2,
		shadowColor: theme.colors.error,
	},
	dangerIcon: {
		alignItems: "center",
		justifyContent: "center",
		alignSelf: "flex-start",
		width: 48,
		height: 48,
		borderRadius: 24,
		marginLeft: 20,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: theme.colors.error,
		backgroundColor: "rgba(220, 38, 38, 0.1)",
	},
	titleDanger: {
		color: theme.colors.error,
	},
	messageDanger: {
		color: theme.colors.textPrimary,
	},
	details: {
		paddingHorizontal: 20,
		marginBottom: 12,
		gap: 4,
	},
	detailRow: {
		flexDirection: "row",
		gap: 8,
	},
	detailBullet: {
		color: theme.colors.error,
		fontSize: 14,
		lineHeight: 20,
	},
	detailText: {
		color: theme.colors.textSecondary,
		fontSize: 14,
		lineHeight: 20,
		flex: 1,
	},
	actionsDanger: {
		flexDirection: "column",
		alignItems: "stretch",
		gap: 8,
		paddingHorizontal: 16,
		paddingBottom: 12,
	},
	buttonDanger: {
		minWidth: 0,
	},
});

import React, { createContext, useCallback, useContext, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { AppTheme } from "../theme/themes";
import { useAppTheme } from "../theme/ThemeContext";

export interface DialogButton {
	text: string;
	onPress?: () => void;
	style?: "default" | "cancel" | "destructive";
}

interface DialogState {
	title: string;
	message?: string;
	buttons: DialogButton[];
	visible: boolean;
}

interface DialogContextType {
	showAlert: (title: string, message?: string, buttons?: DialogButton[]) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

const DEFAULT_BUTTONS: DialogButton[] = [{ text: "OK" }];

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
		(title: string, message?: string, buttons: DialogButton[] = DEFAULT_BUTTONS) => {
			setDialog({ title, message, buttons, visible: true });
		},
		[],
	);

	const dismiss = () => {
		setDialog((prev) => ({ ...prev, visible: false }));
	};

	const handlePress = (onPress?: () => void) => {
		dismiss();
		onPress?.();
	};

	const cancelButton = dialog.buttons.find((b) => b.style === "cancel");
	const otherButtons = dialog.buttons.filter((b) => b.style !== "cancel");

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
					<View style={styles.dialog}>
						<Text style={styles.title}>{dialog.title}</Text>
						{dialog.message != null ? (
							<Text style={styles.message}>{dialog.message}</Text>
						) : null}
						<View style={styles.actions}>
							{cancelButton && (
								<Button
									onPress={() => handlePress(cancelButton.onPress)}
									textColor={theme.colors.textSecondary}
									style={styles.button}
								>
									{cancelButton.text}
								</Button>
							)}
							{otherButtons.map((btn, index) => (
								<Button
									key={index}
									onPress={() => handlePress(btn.onPress)}
									textColor={
										btn.style === "destructive" ? theme.colors.error : theme.colors.accent
									}
									style={styles.button}
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
});

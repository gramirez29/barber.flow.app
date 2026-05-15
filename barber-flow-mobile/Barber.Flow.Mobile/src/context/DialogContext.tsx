import React, { createContext, useCallback, useContext, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

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

const DIALOG_COLORS = {
	surface: "#1A1A1A",
	border: "#3A3A3A",
	title: "#FFFFFF",
	message: "#9B9B9B",
	gold: "#C9A84C",
	error: "#E57373",
	cancel: "#9B9B9B",
} as const;

const DEFAULT_BUTTONS: DialogButton[] = [{ text: "OK" }];

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
									textColor={DIALOG_COLORS.cancel}
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
										btn.style === "destructive" ? DIALOG_COLORS.error : DIALOG_COLORS.gold
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

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.55)",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	dialog: {
		backgroundColor: DIALOG_COLORS.surface,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: DIALOG_COLORS.border,
		width: "100%",
		maxWidth: 400,
		paddingTop: 24,
		paddingBottom: 8,
	},
	title: {
		color: DIALOG_COLORS.title,
		fontWeight: "700",
		fontSize: 17,
		marginBottom: 8,
		paddingHorizontal: 20,
	},
	message: {
		color: DIALOG_COLORS.message,
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

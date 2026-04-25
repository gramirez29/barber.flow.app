import React from "react";
import {
	View,
	TextInput,
	Pressable,
	StyleSheet,
	TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../theme/ThemeContext";

type Props = TextInputProps & {
	containerStyle?: any;
	error?: boolean;
	inputRef?: React.RefObject<TextInput>;
	inputStyle?: any;
	onFocusVisible?: () => void;
};

export const PasswordInput: React.FC<Props> = ({
	containerStyle,
	error = false,
	inputRef,
	inputStyle,
	onFocusVisible,
	style,
	...rest
}) => {
	const [visible, setVisible] = React.useState(false);
	const { theme } = useAppTheme();

	return (
		<View style={[styles.wrapper, containerStyle]}>
			<TextInput
				ref={inputRef as any}
				secureTextEntry={!visible}
				style={[
					styles.input,
					{
						borderColor: error ? theme.colors.error : theme.colors.border,
						borderRadius: theme.layout.components.input.radius,
						borderWidth: 1,
						backgroundColor: theme.colors.primaryInput,
						paddingHorizontal: theme.layout.components.input.paddingHorizontal,
						paddingVertical: theme.layout.components.input.paddingVertical,
						color: theme.colors.textPrimary,
					},
					inputStyle,
					style,
				]}
				onFocus={onFocusVisible}
				placeholderTextColor={theme.colors.textSecondary}
				selectionColor={theme.colors.secondary}
				{...rest}
			/>
			<Pressable
				style={styles.eye}
				onPress={() => setVisible((v) => !v)}
				accessibilityLabel={visible ? "Hide password" : "Show password"}
			>
				<Ionicons
				name={visible ? "eye-off" : "eye"}
				size={20}
				color={theme.colors.textSecondary}
				/>
			</Pressable>
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: { position: "relative", width: "100%" },
	input: {
		fontSize: 16,
	},
	eye: {
		position: "absolute",
		right: 12,
		top: 0,
		bottom: 0,
		justifyContent: "center",
		width: 36,
		alignItems: "center",
	},
});

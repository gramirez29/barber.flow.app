import React from "react";
import {
	View,
	TextInput,
	Pressable,
	StyleSheet,
	TextInputProps,
	type StyleProp,
	type ViewStyle,
	type TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../theme/ThemeContext";
import { AppTheme } from "../../theme/themes";

type Props = TextInputProps & {
	containerStyle?: StyleProp<ViewStyle>;
	error?: boolean;
	inputRef?: React.RefObject<TextInput | null>;
	inputStyle?: StyleProp<TextStyle>;
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
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={[styles.wrapper, containerStyle]}>
			<TextInput
				ref={inputRef as any}
				secureTextEntry={!visible}
				style={[
					styles.input,
					{
						borderColor: error ? theme.colors.error : theme.colors.border,
						backgroundColor: theme.colors.primaryInput,
						color: theme.colors.textPrimary,
					},
					inputStyle,
					style,
				]}
				onFocus={onFocusVisible}
				placeholderTextColor={theme.colors.textSecondary}
				selectionColor={theme.colors.accent}
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

const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
		wrapper: { position: "relative", width: "100%" },
		input: {
			fontSize: 16,
			borderRadius: theme.layout.components.input.radius,
			borderWidth: 1,
			paddingHorizontal: theme.layout.components.input.paddingHorizontal,
			paddingVertical: theme.layout.components.input.paddingVertical,
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

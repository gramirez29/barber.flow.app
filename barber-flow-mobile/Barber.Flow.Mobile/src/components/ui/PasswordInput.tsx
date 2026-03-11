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
  inputRef?: React.RefObject<TextInput>;
  onFocusVisible?: () => void;
};

export const PasswordInput: React.FC<Props> = ({
  inputRef,
  onFocusVisible,
  style,
  ...rest
}) => {
  const [visible, setVisible] = React.useState(false);
  const { theme } = useAppTheme();

  return (
    <View style={styles.wrapper}>
      <TextInput
        ref={inputRef as any}
        secureTextEntry={!visible}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.primaryInput,
            color: theme.colors.textPrimary,
          },
          style,
        ]}
        onFocus={onFocusVisible}
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
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 14,
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

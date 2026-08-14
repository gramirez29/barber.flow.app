import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../theme/ThemeContext";

interface ScreenTitleProps {
    align?: "left" | "center";
    children?: React.ReactNode;
    eyebrow?: string;
    size?: "sm" | "md" | "lg";
    subtitle?: string;
    title?: string;
}

const titleSizeMap = {
    sm: 19,
    md: 24,
    lg: 30,
} as const;

export const ScreenTitle = ({ align = "left", children, eyebrow, size = "md", subtitle, title }: ScreenTitleProps) => {

    const { theme } = useAppTheme();
    const resolvedTitle = title ?? children;
    const textAlign = align;

    return (
        <View style={styles.container}>
            {eyebrow ? (
                <Text
                    style={[
                        styles.eyebrow,
                        {
                            color: theme.colors.textSecondary,
                            textAlign,
                        },
                    ]}
                >
                    {eyebrow}
                </Text>
            ) : null}

            {resolvedTitle ? (
                <Text
                    style={[
                        styles.title,
                        {
                            color: theme.colors.textPrimary,
                            fontSize: titleSizeMap[size],
                            lineHeight: size === "sm" ? 26 : size === "md" ? 32 : 38,
                            textAlign,
                        },
                    ]}
                >
                    {resolvedTitle}
                </Text>
            ) : null}

            {subtitle ? (
                <Text
                    style={[
                        styles.subtitle,
                        {
                            color: theme.colors.textSecondary,
                            textAlign,
                        },
                    ]}
                    numberOfLines={1}
                >
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 2,
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.9,
        textTransform: "uppercase",
    },
    title: {
        fontWeight: "700",
    },
    subtitle: {
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
});
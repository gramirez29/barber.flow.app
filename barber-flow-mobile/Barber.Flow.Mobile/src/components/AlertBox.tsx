import { Alert } from "react-native";

interface AlertBoxProps {
    title?: string;
    text?: string;
    cancelText?: string;
    okText?: string;
    onPress?: (() => void) | undefined;
}

export const AlertBox = ({
    title,
    text,
    cancelText,
    okText,
    onPress
}: AlertBoxProps) => {
    Alert.alert(
        title || '',
        text || '',
        [
            {
                text: cancelText || '',
                onPress: () => console.warn('Cancel Pressed'),
                style: 'cancel'
            },
            {text: okText || 'OK', onPress: onPress || (() => console.warn('OK Pressed.'))},
        ]
    );
};
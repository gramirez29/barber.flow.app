import { StyleSheet, Alert } from "react-native"; 

interface AlertBoxProps {
    title?: string;
    text?: string;
    askmeLaterText?: string;
    cancelText?: string;
    onPress?: void;
}

export const AlertBox = ({
    title,
    text,
    askmeLaterText,
    cancelText,
    onPress
}: AlertBoxProps) => {
    Alert.alert(
        title || 'Alert Title',
        text || 'Alert Message',
        [
            {
                text: cancelText || 'Cancel',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel'
            },
            {text: 'OK', onPress: onPress || (() => console.log('OK Pressed.'))},
        ]
    );
};
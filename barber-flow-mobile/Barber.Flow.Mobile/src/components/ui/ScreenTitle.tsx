import { Text, StyleSheet } from 'react-native'

interface Props {
    children?: React.ReactNode;
}

export const ScreenTitle = ({ children }: Props) => {
    return (
        <Text style={styles.title}>{children}</Text>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});
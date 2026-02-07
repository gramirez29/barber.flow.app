import { Text, StyleSheet } from 'react-native'
import { useAppTheme } from '../../theme/ThemeContext';

interface Props {
    children?: React.ReactNode;
    fontSize?: undefined; // validar esto
}

export const ScreenTitle = ({ children, fontSize }: Props) => {

    const { theme } = useAppTheme();

    return (
        <Text style={[styles.title, { color: theme.colors.textPrimary }, fontSize && styles.text ]}>{children}</Text>
    );
}

const styles = StyleSheet.create({
    title: {
        fontWeight: 'bold',
    },
    text: {
        fontSize: 24,
    },
});
import { StyleSheet, Text } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { ScreenTitle } from '../components/ui/ScreenTitle';


export const SettingsScreen = () => {
    return (
        <ScreenLayout title='Settings' backgroundColor='#943f12' center>
            <Text style={{ fontSize: 28 }}>Settings Screen</Text>
        </ScreenLayout>);
}

const styles = StyleSheet.create({
    text: {
        justifyContent: 'center',
        alignItems: 'center',
    }});
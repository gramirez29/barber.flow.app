import { StyleSheet, Text } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { ScreenTitle } from '../components/ui/ScreenTitle';


export const CalendarScreen = () => {
    return (
        <ScreenLayout title='Calendar Screen Menu' backgroundColor='#659dd6' center>
            <Text style={{ fontSize: 28 }}>Calendar Screen</Text>
        </ScreenLayout>);
}

const styles = StyleSheet.create({
    text: {
        justifyContent: 'center',
        alignItems: 'center',
    }});
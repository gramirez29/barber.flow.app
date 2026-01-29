import { StyleSheet, Text } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { useNavigation, DrawerActions } from '@react-navigation/native';

export const CalendarScreen = () => {
    const navigation = useNavigation();

    return (
        <ScreenLayout
            title='Calendar' 
            backgroundColor='#659dd6'
            center
            onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
            <Text style={{ fontSize: 28 }}>Calendar Screen</Text>
        </ScreenLayout>);
}

const styles = StyleSheet.create({
    text: {
        justifyContent: 'center',
        alignItems: 'center',
    }});
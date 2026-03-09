import React, { useState } from 'react';
import { ScreenLayout } from '../components/ScreenLayout';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { CalendarView } from '../components/calendar/CalendarView';
import { AppointmentModal } from '../components/calendar/AppointmentModal';
import { DayAppointments } from '../components/calendar/DayAppointments';

export const CalendarScreen = () => {

    const navigation = useNavigation();
    const { theme } = useAppTheme();

    const [ selectedDate, setSelectedDate ] = useState<string | null>(null);

    return (
        <ScreenLayout
            title='Calendario' 
            backgroundColor = { theme.colors.background }
            center
            onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
            <Text style={[styles.text, { color: theme.colors.textPrimary }]}>Pantalla de Calendario</Text>

            <View style={ { flex: 1 } }>
                <CalendarView onDayPress={ (date) => setSelectedDate(date) } />

                {selectedDate && <DayAppointments date={selectedDate} />}
            </View>

        </ScreenLayout>
    );};

const styles = StyleSheet.create({
    text: {
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 18,
    }});
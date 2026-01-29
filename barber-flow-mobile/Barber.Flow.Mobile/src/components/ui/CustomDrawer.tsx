import { DrawerContentScrollView } from "@react-navigation/drawer";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export const CustomDrawer = (props: any) => {
    const { colors } = useTheme();
    
    return (
        <DrawerContentScrollView {...props} contentContainerStyle={ [styles.container, { backgroundColor: colors.background }]}>

            {/* Perfil */}
            <View style={ styles.profile }>
                <Image
                    source={{uri: "https://i.pravatar.cc/100" }}
                    style={ styles.avatar }
                />

                <Text style={ [styles.name, { color: colors.textPrimary }] }>Guillermo Ramirez</Text>
                <Text style={ { color: colors.textSecondary } }>guillermo.ramirez@example.com</Text>
            </View>

            {/* Opciones */}

            {/* Calendar */}
            <TouchableOpacity style={ styles.item } onPress={() => props.navigation.navigate('HomeStack', { screen: 'Calendar' })}>
                <Text style={ { color: colors.textPrimary } }>Calendar</Text>
            </TouchableOpacity>

            {/* Clients */}
            <TouchableOpacity style={ styles.item } onPress={() => props.navigation.navigate('HomeStack', { screen: 'Clients' })}>
                <Text style={ { color: colors.textPrimary } }>Clients</Text>
            </TouchableOpacity>

            {/* Appointments */}
            <TouchableOpacity style={ styles.item } onPress={() => props.navigation.navigate('HomeStack', { screen: 'CreateAppointment' })}>
                <Text style={ { color: colors.textPrimary } }>Create Appointment</Text>
            </TouchableOpacity>

        </DrawerContentScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    profile: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        marginBottom: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
    },
    item: {
        padding: 16,
    }
})
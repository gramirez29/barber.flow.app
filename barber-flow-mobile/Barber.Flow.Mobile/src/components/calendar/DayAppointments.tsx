import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CalendarStackParamList } from "../../navigation/CalendarNavigator";
import { useAppointmentStore } from "../../features/appointments/appointment.store";
import { Appointment } from "../../features/appointments/appointments.types";
import { useTranslation } from "../../context/LanguageContext";

interface DayAppointmentsProps {
	date: string;
}

export const DayAppointments = ({ date }: DayAppointmentsProps) => {
	const navigation = useNavigation<NativeStackNavigationProp<CalendarStackParamList>>();
	const { appointments } = useAppointmentStore();
	const { translateText } = useTranslation();

	const dayAppointments = appointments.filter(appointment => appointment.date === date);

	const openNew = () => {
		navigation.navigate("AppointmentForm", {
			mode: "create",
			date,
			afterSave: "goBack",
		});
	};

	const openEdit = (appointment: Appointment) => {
		navigation.navigate("AppointmentForm", {
			mode: "edit",
			date: appointment.date,
			appointmentId: appointment.id,
			afterSave: "goBack",
		});
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>
					{`${translateText("calendar.agendaDay")}: ${date}`}
				</Text>
				<Button title={translateText("calendar.newAppointment")} onPress={openNew} />
			</View>

			{dayAppointments.length === 0 ? (
				<Text style={styles.empty}>
					{translateText("calendar.emptyTitle")}
				</Text>
			) : (
				<ScrollView>
					{dayAppointments.map(app => (
						<TouchableOpacity key={app.id} style={styles.card} onPress={() => openEdit(app)}>
							<Text style={styles.time}>
								{app.time}
							</Text>
							<View>
								<Text style={styles.name}>
									{app.clientName}
								</Text>
								<Text style={styles.phone}>
									{app.phone}
								</Text>
							</View>
						</TouchableOpacity>
					))}
				</ScrollView>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: 12,
		backgroundColor: "#f5f7fa",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingHorizontal: 16,
		paddingTop: 14,
	},

	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 14,
	},

	title: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111",
	},

	empty: {
		textAlign: "center",
		marginTop: 40,
		fontSize: 15,
		color: "#777",
	},

	card: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 14,
		borderRadius: 14,
		marginBottom: 10,

		// sombra iOS
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 3 },
		shadowRadius: 6,

		// sombra Android
		elevation: 3,
	},

	time: {
		fontSize: 16,
		fontWeight: "700",
		marginRight: 14,
		color: "#222",
		width: 60,
	},

	name: {
		fontSize: 15,
		fontWeight: "600",
		color: "#111",
	},

	phone: {
		fontSize: 13,
		color: "#666",
		marginTop: 2,
	},
});


import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Button } from "react-native";
import { useAppointmentStore } from "../../features/appointments/appointment.store";
import { AppointmentModal } from "./AppointmentModal";
import { Appointment } from "../../features/appointments/appointments.types";

interface Props {
  date: string;
}

export const DayAppointments = ({ date }: Props) => {
  const { appointments } = useAppointmentStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const dayAppointments = appointments.filter(a => a.date === date);

  const openNew = () => {
    setEditingAppointment(null);
    setModalVisible(true);
  };

  const openEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Citas para {date}</Text>
        <Button title="Nueva Cita" onPress={openNew} />
      </View>

      {dayAppointments.length === 0 ? (
        <Text style={styles.empty}>No hay citas</Text>
      ) : (
        <ScrollView>
          {dayAppointments.map(app => (
            <TouchableOpacity key={app.id} style={styles.card} onPress={() => openEdit(app)}>
              <Text style={styles.time}>{app.time}</Text>
              <View>
                <Text style={styles.name}>{app.clientName}</Text>
                <Text style={styles.phone}>{app.phone}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <AppointmentModal
        visible={modalVisible}
        date={date}
        editingAppointment={editingAppointment}
        onClose={() => setModalVisible(false)}
        onSave={appointment => {
          // handle saving the appointment here
        }}
      />
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


import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Alert,
} from "react-native";
import { useAppointmentStore } from "../../features/appointments/appointment.store";
import { Appointment } from "../../features/appointments/appointments.types";

interface Props {
  visible: boolean;
  date: string;
  onClose: () => void;  
  editingAppointment?: Appointment | null;
}

export const AppointmentModal = ({
  visible,
  date,
  onClose,
  editingAppointment,
}: Props) => {
  const { addAppointment, updateAppointment } = useAppointmentStore();

  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("");

  const isEditing = !!editingAppointment;

  // 👉 cuando abrimos para editar, precargamos datos
  useEffect(() => {
    if (editingAppointment) {
      setClientName(editingAppointment.clientName);
      setPhone(editingAppointment.phone);
      setTime(editingAppointment.time);
    } else {
      setClientName("");
      setPhone("");
      setTime("");
    }
  }, [editingAppointment]);

  const handleSave = () => {
    if (!clientName || !time) {
      Alert.alert("Faltan datos", "Nombre y hora son obligatorios");
      return;
    }

    if (isEditing && editingAppointment) {
      updateAppointment({
        ...editingAppointment,
        clientName,
        phone,
        time,
      });
      Alert.alert("Cita actualizada");
    } else {
      addAppointment({
        id: Date.now().toString(), // 👈 ya no usamos uuid
        clientName,
        phone,
        time,
        date,
      });
      Alert.alert("Cita creada");
    }

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>
          {isEditing ? "Editar Cita" : "Nueva Cita"}
        </Text>

        <TextInput
          placeholder="Nombre del Cliente"
          value={clientName}
          onChangeText={setClientName}
          style={styles.input}
        />
        <TextInput
          placeholder="Teléfono"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
        />
        <TextInput
          placeholder="Hora (14:30)"
          value={time}
          onChangeText={setTime}
          style={styles.input}
        />

        <Button
          title={isEditing ? "Guardar Cambios" : "Guardar Cita"}
          onPress={handleSave}
        />
        <Button title="Cancelar" onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 60 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, marginBottom: 12 },
});

import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Modal, Portal, Text, TextInput, Button } from "react-native-paper";
import { Appointment } from "../../features/appointments/appointments.types";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { formatPhoneNumber } from "../../utils/formatUtil";

interface Props {
  visible: boolean;
  date: string;
  editingAppointment?: Appointment | null;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
}

export const AppointmentModal: React.FC<Props> = ({
  visible,
  date,
  editingAppointment,
  onClose,
  onSave,
}) => {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("");

  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  const showTimePicker = () => setTimePickerVisible(true);
  const hideTimePicker = () => setTimePickerVisible(false);

  const handleTimeConfirm = (date: Date) => {
    setTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    hideTimePicker();
  };

  const handleAlert = () => {
    Alert.alert("Hora seleccionada", time, [{ text: "OK", onPress: () => hideTimePicker() }]);
  }

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
  }, [editingAppointment, visible]);

  const handleSave = () => {
    const appointment: Appointment = {
      id: editingAppointment?.id || Date.now().toString(),
      date,
      time,
      clientName,
      phone,
    };
    onSave(appointment);
    onClose();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modal}>
        <Text style={styles.title}>
          {editingAppointment ? "Editar Cita" : "Nueva Cita"}
        </Text>
        <TextInput
          label="Nombre del Cliente"
          value={clientName}
          onChangeText={setClientName}
          style={styles.input}
        />
        <TextInput
          label="Teléfono"
          value={phone}
          onChangeText={(phone) => setPhone(formatPhoneNumber(phone))}
          style={styles.input}
          keyboardType="phone-pad"
          placeholder="0000-0000"
          maxLength={9}
        />
        <TextInput
          label="Hora"
          value={time}
          style={styles.input}
          placeholder="HH:mm"
          onFocus={showTimePicker}
        />
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleTimeConfirm}
          onCancel={hideTimePicker}
        />
        <Button mode="contained" onPress={handleSave} style={styles.button}>
          Guardar
        </Button>
        <Button onPress={onClose} style={styles.button}>
          Cancelar
        </Button>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: "#fff",
    padding: 24,
    margin: 24,
    borderRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
});
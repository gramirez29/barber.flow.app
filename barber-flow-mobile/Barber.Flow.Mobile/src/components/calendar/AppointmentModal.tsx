import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  HelperText,
  Modal,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
} from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";
import {
  APPOINTMENT_PAYMENT_METHOD_LABELS,
  APPOINTMENT_PAYMENT_METHOD_OPTIONS,
  Appointment,
  AppointmentDraft,
} from "../../features/appointments/appointments.types";
import { useAppTheme } from "../../theme/ThemeContext";
import {
  formatPhoneNumber,
  validateRequiredField,
} from "../../utils/formatUtil";

interface Props {
  visible: boolean;
  date: string;
  editingAppointment?: Appointment | null;
  onClose: () => void;
  onSave: (appointment: AppointmentDraft) => void;
}

interface AppointmentFormErrors {
  clientName?: string;
  paymentMethodUsed?: string;
  phone?: string;
  servicePrice?: string;
  time?: string;
}

const emptyDraft = (date: string): AppointmentDraft => ({
  clientName: "",
  completedAt: undefined,
  phone: "",
  date,
  paymentMethodUsed: undefined,
  servicePrice: undefined,
  time: "",
  serviceName: "",
  notes: "",
  status: "scheduled",
});

const validateAppointmentField = (
  key: keyof AppointmentDraft,
  value: string | number | undefined,
) => {
  if (key === "clientName") {
    return validateRequiredField(String(value ?? ""))
      ? "El nombre del cliente es obligatorio"
      : undefined;
  }

  if (key === "phone") {
    const normalizedPhone = String(value ?? "");

    if (validateRequiredField(normalizedPhone)) {
      return "El telefono es obligatorio";
    }

    if (!/^\d{4}-\d{4}$/.test(normalizedPhone)) {
      return "El telefono debe tener el formato 0000-0000";
    }

    return undefined;
  }

  if (key === "time") {
    return validateRequiredField(String(value ?? "")) ? "La hora es obligatoria" : undefined;
  }

  if (key === "servicePrice") {
    if (value === undefined || value === "") {
      return "El precio del servicio es obligatorio";
    }

    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return "El precio debe ser mayor que 0";
    }

    return undefined;
  }

  if (key === "paymentMethodUsed") {
    return validateRequiredField(String(value ?? "")) ? "Selecciona el metodo de pago" : undefined;
  }

  return undefined;
};

export const AppointmentModal: React.FC<Props> = ({
  visible,
  date,
  editingAppointment,
  onClose,
  onSave,
}) => {
  const { theme } = useAppTheme();
  const [draft, setDraft] = useState<AppointmentDraft>(emptyDraft(date));
  const [errors, setErrors] = useState<AppointmentFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (editingAppointment) {
      setDraft({
        clientName: editingAppointment.clientName,
        completedAt: editingAppointment.completedAt,
        phone: editingAppointment.phone,
        date: editingAppointment.date,
        paymentMethodUsed: editingAppointment.paymentMethodUsed,
        servicePrice: editingAppointment.servicePrice,
        time: editingAppointment.time,
        serviceName: editingAppointment.serviceName ?? "",
        notes: editingAppointment.notes ?? "",
        status: editingAppointment.status,
      });
    } else {
      setDraft(emptyDraft(date));
    }

    setErrors({});
    setTouched({});
  }, [date, editingAppointment, visible]);

  const setField = <K extends keyof AppointmentDraft>(
    key: K,
    value: AppointmentDraft[K],
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));

    if (
      key === "clientName" ||
      key === "phone" ||
      key === "time" ||
      key === "servicePrice" ||
      key === "paymentMethodUsed"
    ) {
      const nextError = validateAppointmentField(key, String(value ?? ""));
      setErrors((currentErrors) => ({
        ...currentErrors,
        [key]: nextError,
      }));
    }
  };

  const onBlurField = (key: keyof AppointmentDraft) => {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [key]: true,
    }));

    if (
      key === "clientName" ||
      key === "phone" ||
      key === "time" ||
      key === "servicePrice" ||
      key === "paymentMethodUsed"
    ) {
      const nextError = validateAppointmentField(key, String(draft[key] ?? ""));
      setErrors((currentErrors) => ({
        ...currentErrors,
        [key]: nextError,
      }));
    }
  };

  const handleTimeConfirm = (selectedTime: Date) => {
    setField("time", format(selectedTime, "HH:mm"));
    setTouched((currentTouched) => ({
      ...currentTouched,
      time: true,
    }));
    setTimePickerVisible(false);
  };

  const handleSubmit = () => {
    const nextErrors: AppointmentFormErrors = {
      clientName: validateAppointmentField("clientName", draft.clientName),
      paymentMethodUsed: validateAppointmentField("paymentMethodUsed", draft.paymentMethodUsed),
      phone: validateAppointmentField("phone", draft.phone),
      servicePrice: validateAppointmentField("servicePrice", draft.servicePrice),
      time: validateAppointmentField("time", draft.time),
    };

    setErrors(nextErrors);
    setTouched({
      clientName: true,
      paymentMethodUsed: true,
      phone: true,
      servicePrice: true,
      time: true,
    });

    if (
      nextErrors.clientName ||
      nextErrors.phone ||
      nextErrors.time ||
      nextErrors.servicePrice ||
      nextErrors.paymentMethodUsed
    ) {
      return;
    }

    onSave({
      ...draft,
      clientName: draft.clientName.trim(),
      completedAt:
        draft.status === "completed"
          ? editingAppointment?.completedAt ?? new Date().toISOString()
          : undefined,
      paymentMethodUsed: draft.paymentMethodUsed,
      serviceName: draft.serviceName?.trim() || undefined,
      servicePrice: draft.servicePrice,
      notes: draft.notes?.trim() || undefined,
      date,
    });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.modal,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>Nueva cita</Text>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {editingAppointment ? "Editar reserva" : "Agendar cita"}
          </Text>
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            Fecha seleccionada: {date}
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Estado de la cita</Text>
            <SegmentedButtons
              density="small"
              onValueChange={(value) => setField("status", value as AppointmentDraft["status"])}
              value={draft.status ?? "scheduled"}
              buttons={[
                { label: "Agendada", value: "scheduled" },
                { label: "Confirm.", value: "confirmed" },
                { label: "Complet.", value: "completed" },
                { label: "Cancel.", value: "cancelled" },
              ]}
            />
            <HelperText type="info" visible={draft.status === "completed"}>
              Las citas completadas apareceran en el reporte diario.
            </HelperText>
          </View>

          <View style={styles.formGroup}>
            <TextInput
              label="Nombre del cliente"
              value={draft.clientName}
              onChangeText={(value) => setField("clientName", value)}
              onBlur={() => onBlurField("clientName")}
              error={Boolean(touched.clientName && errors.clientName)}
              mode="outlined"
            />
            <HelperText type="error" visible={Boolean(touched.clientName && errors.clientName)}>
              {errors.clientName}
            </HelperText>
          </View>

          <View style={styles.formGroup}>
            <TextInput
              label="Telefono"
              value={draft.phone}
              onChangeText={(value) => setField("phone", formatPhoneNumber(value))}
              onBlur={() => onBlurField("phone")}
              error={Boolean(touched.phone && errors.phone)}
              mode="outlined"
              keyboardType="phone-pad"
              placeholder="0000-0000"
              maxLength={9}
            />
            <HelperText type="error" visible={Boolean(touched.phone && errors.phone)}>
              {errors.phone}
            </HelperText>
          </View>

          <View style={styles.formGroup}>
            <TextInput
              label="Servicio"
              value={draft.serviceName ?? ""}
              onChangeText={(value) => setField("serviceName", value)}
              mode="outlined"
              placeholder="Corte clasico, barba, combo..."
            />
          </View>

          <View style={styles.formGroup}>
            <TextInput
              label="Precio del servicio"
              value={draft.servicePrice !== undefined ? String(draft.servicePrice) : ""}
              onChangeText={(value) => {
                const normalized = value.replace(/,/g, ".");
                setField("servicePrice", normalized ? Number(normalized) : undefined);
              }}
              onBlur={() => onBlurField("servicePrice")}
              error={Boolean(touched.servicePrice && errors.servicePrice)}
              mode="outlined"
              keyboardType="decimal-pad"
              placeholder="0.00"
              left={<TextInput.Affix text="CRC" />}
            />
            <HelperText type="error" visible={Boolean(touched.servicePrice && errors.servicePrice)}>
              {errors.servicePrice}
            </HelperText>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Metodo de pago</Text>
            <SegmentedButtons
              density="small"
              onValueChange={(value) => {
                setField("paymentMethodUsed", value as AppointmentDraft["paymentMethodUsed"]);
                setTouched((currentTouched) => ({
                  ...currentTouched,
                  paymentMethodUsed: true,
                }));
              }}
              value={draft.paymentMethodUsed ?? ""}
              buttons={APPOINTMENT_PAYMENT_METHOD_OPTIONS.map((option) => ({
                label: option === "card" ? "Card" : option === "transfer" ? "Transfer" : "Cash",
                value: option,
              }))}
            />
            <HelperText type="info" visible={Boolean(draft.paymentMethodUsed)}>
              {draft.paymentMethodUsed
                ? APPOINTMENT_PAYMENT_METHOD_LABELS[draft.paymentMethodUsed]
                : "Selecciona como se cobro esta cita"}
            </HelperText>
            <HelperText type="error" visible={Boolean(touched.paymentMethodUsed && errors.paymentMethodUsed)}>
              {errors.paymentMethodUsed}
            </HelperText>
          </View>

          <View style={styles.formGroup}>
            <TextInput
              label="Hora"
              value={draft.time}
              onPressIn={() => setTimePickerVisible(true)}
              onBlur={() => onBlurField("time")}
              error={Boolean(touched.time && errors.time)}
              mode="outlined"
              placeholder="HH:mm"
              editable={false}
              right={
                <TextInput.Icon
                  icon="clock-outline"
                  onPress={() => setTimePickerVisible(true)}
                />
              }
            />
            <HelperText type="error" visible={Boolean(touched.time && errors.time)}>
              {errors.time}
            </HelperText>
          </View>

          <View style={styles.formGroup}>
            <TextInput
              label="Notas"
              value={draft.notes ?? ""}
              onChangeText={(value) => setField("notes", value)}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Indicaciones, preferencias o recordatorios"
            />
          </View>

          <View style={styles.actions}>
            <Button mode="text" onPress={onClose}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={handleSubmit}>
              {editingAppointment ? "Guardar cambios" : "Guardar cita"}
            </Button>
          </View>
        </ScrollView>

        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleTimeConfirm}
          onCancel={() => setTimePickerVisible(false)}
        />
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    borderRadius: 24,
    borderWidth: 1,
    margin: 20,
    maxHeight: "88%",
    padding: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  dateText: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
});
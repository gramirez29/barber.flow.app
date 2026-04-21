import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Modal, Portal, Text } from "react-native-paper";
import type {
  Appointment,
  AppointmentDraft,
} from "../../features/appointments/appointments.types";
import { useTranslation } from "../../context/LanguageContext";
import { useAppTheme } from "../../theme/ThemeContext";
import { AppointmentForm } from "./AppointmentForm";
import { useAppointmentForm } from "../../features/appointments/useAppointmentForm";

interface Props {
  visible: boolean;
  date: string;
  editingAppointment?: Appointment | null;
  initialDraft?: Partial<AppointmentDraft>;
  onClose: () => void;
  onSave: (appointment: AppointmentDraft) => void;
}

export const AppointmentModal: React.FC<Props> = ({
  visible,
  date,
  editingAppointment,
  initialDraft,
  onClose,
  onSave,
}) => {
  const { theme } = useAppTheme();
  const { translateText } = useTranslation();
  const {
    draft,
    errors,
    touched,
    onBlurField,
    setField,
    setTouched,
    submit,
  } = useAppointmentForm({
    date,
    editingAppointment,
    initialDraft,
    enabled: visible,
  });

  const handleSubmit = () => {
    const nextDraft = submit({ editingAppointment });

    if (!nextDraft) {
      return;
    }

    onSave(nextDraft);
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
          <Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>{translateText("calendar.appointmentModal.eyebrow")}</Text>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {editingAppointment
              ? translateText("calendar.appointmentModal.editTitle")
              : translateText("calendar.appointmentModal.title")}
          </Text>
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            {translateText("calendar.appointmentModal.dateSelected", { date })}
          </Text>

          <AppointmentForm
            draft={draft}
            errors={errors}
            touched={touched}
            isEditMode={Boolean(editingAppointment)}
            onFieldChange={setField}
            onFieldBlur={onBlurField}
            onSubmit={handleSubmit}
            onCancel={onClose}
            onPaymentMethodTouched={() =>
              setTouched((currentTouched) => ({
                ...currentTouched,
                paymentMethodUsed: true,
              }))
            }
          />
        </ScrollView>
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
});
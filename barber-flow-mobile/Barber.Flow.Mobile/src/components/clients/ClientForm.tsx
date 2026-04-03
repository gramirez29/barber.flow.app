import React from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { HelperText, Text, TextInput } from "react-native-paper";
import { ClientAvatar } from "../ClientAvatar";
import { FormCard } from "../ui/FormCard";
import { useAppTheme } from "../../theme/ThemeContext";
import type { Client } from "../../types/clients";
import {
  ClientFormErrors,
  ClientTouchedFields,
  PAYMENT_METHODS,
} from "../../features/clients/clientForm";

interface ClientFormProps {
  client: Client;
  errors: ClientFormErrors;
  touched: ClientTouchedFields;
  loading: boolean;
  onFieldChange: <K extends keyof Client>(key: K, value: Client[K]) => void;
  onFieldBlur: (key: keyof Client) => void;
  onOpenDatePicker: () => void;
}

const formatBirthday = (birthday?: string) => {
  if (!birthday) {
    return "Select date";
  }

  return new Date(birthday).toLocaleDateString();
};

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  errors,
  touched,
  loading,
  onFieldChange,
  onFieldBlur,
  onOpenDatePicker,
}) => {
  const { theme } = useAppTheme();
  const isEditing = Boolean(client.id);
  const fullName = `${client.firstName} ${client.lastName}`.trim() || "New client";

  return (
    <View style={styles.container}>
      <FormCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <ClientAvatar size={92} initials={fullName} />

          <View style={styles.heroTextWrap}>
            <Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>
              {isEditing ? "Client profile" : "Create client"}
            </Text>
            <Text style={[styles.heroTitle, { color: theme.colors.textPrimary }]}>
              {fullName}
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
              {client.phone || "Add contact details and preferences to save this client."}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: client.active ? theme.colors.secondary : theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.statusPillText, { color: theme.colors.surface }]}> 
                  {client.active ? "Active" : "Inactive"}
                </Text>
              </View>
              {client.id ? (
                <Text style={[styles.helperLine, { color: theme.colors.textSecondary }]}>Editing existing client</Text>
              ) : null}
            </View>
          </View>
        </View>
      </FormCard>

      <FormCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Identity</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>Required information to create or update a client profile.</Text>

        <View style={styles.formGroup}>
          <TextInput
            label="First name *"
            value={client.firstName}
            onChangeText={(value) => onFieldChange("firstName", value)}
            onBlur={() => onFieldBlur("firstName")}
            error={Boolean(touched.firstName && errors.firstName)}
            mode="outlined"
            returnKeyType="next"
            disabled={loading}
          />
          <HelperText type="error" visible={Boolean(touched.firstName && errors.firstName)}>
            {errors.firstName}
          </HelperText>
        </View>

        <View style={styles.formGroup}>
          <TextInput
            label="Last name *"
            value={client.lastName}
            onChangeText={(value) => onFieldChange("lastName", value)}
            onBlur={() => onFieldBlur("lastName")}
            error={Boolean(touched.lastName && errors.lastName)}
            mode="outlined"
            disabled={loading}
          />
          <HelperText type="error" visible={Boolean(touched.lastName && errors.lastName)}>
            {errors.lastName}
          </HelperText>
        </View>

        <View style={styles.formGroup}>
          <TextInput
            label="Phone *"
            value={client.phone}
            onChangeText={(value) => onFieldChange("phone", value)}
            onBlur={() => onFieldBlur("phone")}
            error={Boolean(touched.phone && errors.phone)}
            mode="outlined"
            keyboardType="phone-pad"
            placeholder="0000-0000"
            maxLength={9}
            disabled={loading}
          />
          <HelperText type="error" visible={Boolean(touched.phone && errors.phone)}>
            {errors.phone}
          </HelperText>
        </View>

        <View style={styles.formGroup}>
          <TextInput
            label="Email"
            value={client.email ?? ""}
            onChangeText={(value) => onFieldChange("email", value)}
            onBlur={() => onFieldBlur("email")}
            error={Boolean(touched.email && errors.email)}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={loading}
          />
          <HelperText type="error" visible={Boolean(touched.email && errors.email)}>
            {errors.email}
          </HelperText>
        </View>
      </FormCard>

      <FormCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Profile details</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>Optional information that helps personalize the experience.</Text>

        <View style={styles.formGroup}>
          <TextInput
            label="Address"
            value={client.address ?? ""}
            onChangeText={(value) => onFieldChange("address", value)}
            mode="outlined"
            disabled={loading}
          />
        </View>

        <View style={styles.formGroup}>
          <Pressable
            onPress={onOpenDatePicker}
            style={[
              styles.dateField,
              {
                backgroundColor: theme.colors.primaryInput,
                borderColor: theme.colors.border,
              },
            ]}
            disabled={loading}
          >
            <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>Birthday</Text>
            <Text style={[styles.dateValue, { color: theme.colors.textPrimary }]}>
              {formatBirthday(client.birthday)}
            </Text>
          </Pressable>
        </View>

        <View style={styles.formGroup}>
          <TextInput
            label="Preferences"
            value={client.preferences ?? ""}
            onChangeText={(value) => onFieldChange("preferences", value)}
            mode="outlined"
            multiline
            numberOfLines={3}
            disabled={loading}
          />
        </View>
      </FormCard>

      <FormCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Preferences</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>Set payment preferences and active status.</Text>

        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Payment method</Text>
          <View
            style={[
              styles.pickerWrap,
              {
                backgroundColor: theme.colors.primaryInput,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Picker
              selectedValue={client.paymentMethod}
              onValueChange={(value) => onFieldChange("paymentMethod", value as Client["paymentMethod"])}
              enabled={!loading}
            >
              {PAYMENT_METHODS.map((paymentMethod) => (
                <Picker.Item key={paymentMethod} label={paymentMethod} value={paymentMethod} />
              ))}
            </Picker>
          </View>
        </View>

        <View
          style={[
            styles.switchRow,
            {
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.switchTextWrap}>
            <Text style={[styles.switchTitle, { color: theme.colors.textPrimary }]}>Client active</Text>
            <Text style={[styles.switchDescription, { color: theme.colors.textSecondary }]}>Use this to show whether the client profile is currently active.</Text>
          </View>
          <Switch
            value={Boolean(client.active)}
            onValueChange={(value) => onFieldChange("active", value)}
            disabled={loading}
          />
        </View>
      </FormCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 16,
  },
  heroCard: {
    paddingVertical: 20,
  },
  heroRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  heroTextWrap: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  helperLine: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 8,
  },
  dateField: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  dateValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  pickerWrap: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  switchRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
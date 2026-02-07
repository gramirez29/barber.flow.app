import { ScreenLayout } from "../components/ScreenLayout";
import { Alert, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import { SettingItem } from "../components/settings/SettingItem";
import { SettingSection } from "../components/settings/SettingSection";
import { useNotification } from "../context/NotificationContext";
import { useState } from "react";

export const SettingsScreen = () => {

  const { clientNotifications, setClientNotifications } = useNotification();
  const { toggleTheme, theme } = useAppTheme();
  const isDarkMode = theme.mode === "dark";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Fake function to display an Alert, replace with component
  function OnPressLabel() : void {

    Alert.alert('Mensaje de alerta de prueba', 'Esto mostrará algo importante', [
      {
        text: 'Preguntar luego',
        onPress: () => console.log('Ask me later pressed'),
      },
      {
        text: 'Cancelar',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {text: 'OK', onPress: () => console.log('OK Pressed')},
    ]);
  }

    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <ScreenLayout title="Settings" backgroundColor={theme.colors.background} center>
                  <ScrollView contentContainerStyle={styles.container}>

                    <Image source={{ uri: "https://i.pravatar.cc/160?img=12" }} style={styles.avatar} />

                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                      Settings Screen - Notifications: {clientNotifications}
                    </Text>

                    <SettingSection title="Datos Personales">
                      <SettingItem label="Editar Perfil" icon="person-outline" />
                      <SettingItem label="Nombre de usuario" icon="person-circle-outline" />
                    </SettingSection>

                    <SettingSection title="Fake Section">
                      <SettingItem label="Fake Label 1" icon="airplane-outline" value={true} onPress={OnPressLabel}/>
                      <SettingItem label="Fake Label 2" icon="alarm-outline"/>
                      <SettingItem label="Fake Label 3" icon="add-circle-outline"/>
                      <SettingItem label="Fake Label 4" icon="bag-remove-outline"/>
                    </SettingSection>

                    <SettingSection title="Preferencias">
                      <SettingItem 
                        label="Modo Oscuro"
                        icon={ isDarkMode ? "moon" : "sunny" }
                        value={ isDarkMode }
                        onToggle={ toggleTheme }
                        />
                      <SettingItem
                        label="Notificaciones"
                        icon="notifications-outline"
                        value={clientNotifications > 0} // ver como manejar esto
                        onToggle={() => {}}
                    />
                      </SettingSection>

                  <SettingSection title="ACERCA DE">
                    <SettingItem label="Versión" icon="information-circle-outline" />
                    <SettingItem label="Desarrollado por" icon="code-outline" />
                  </SettingSection>

                  <TextInput
                    placeholder="Nombre Completo"
                    style={[ styles.input, { backgroundColor: theme.colors.primaryInput, color: theme.colors.primaryTextInput } ]}
                    placeholderTextColor="#888"
                    value={name}
                    onChangeText={setName}
                    
                  />

                  <TextInput
                    placeholder="Telefono"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                    style={[ styles.input, { backgroundColor: theme.colors.primaryInput, color: theme.colors.primaryTextInput } ]}
                    value={phone}
                    onChangeText={setPhone}
                  />


              </ScrollView>
          </ScreenLayout>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      
    );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: "center",
    marginBottom: 16,
  },
  input: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  label: {
    fontSize: 16,
  },
  reset: {
    color: "#4A90E2",
    fontWeight: "600",
  },
});

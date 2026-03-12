import { ScreenLayout } from "../components/ScreenLayout";
import { Alert, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Pressable, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import { SettingItem } from "../components/settings/SettingItem";
import { SettingSection } from "../components/settings/SettingSection";
import { useNotification } from "../context/NotificationContext";
import { useState, useEffect } from "react";
import { apiFetch } from '../services/apis/apiClient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '../store/auth.store';
import { ADMIN_USERNAME } from '../config';

export const SettingsScreen = () => {

  const { clientNotifications, setClientNotifications } = useNotification();
  const { toggleTheme, theme } = useAppTheme();
  const isDarkMode = theme.mode === "dark";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Admin-only users management
  const username = useAuthStore((s) => s.username);
  const isAdmin = username === ADMIN_USERNAME;

  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [barberName, setBarberName] = useState("");
  const [barberPhone, setBarberPhone] = useState("");
  const [barberAddress, setBarberAddress] = useState("");
  const [barberId, setBarberId] = useState<string | undefined>(undefined);

  const [errors, setErrors] = useState<{[k:string]: string | undefined}>({});

  useEffect(() => {
    // initialize barber id when admin opens screen
    if (isAdmin && !barberId) {
      (async () => {
        const next = await getNextBarberId();
        setBarberId(next);
      })();
    }
  }, [isAdmin]);

  async function getNextBarberId() {
    try {
      const res = await apiFetch('/api/barbers/nextId', { method: 'GET' });
      return res?.nextId ?? 'CRB-0000';
    } catch (e) {
      return 'CRB-0000';
    }
  }

  function validateEmail(v?: string) {
    if (!v) return 'Email is required';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(v) ? undefined : 'Invalid email';
  }

  function validateRequired(v?: string) {
    if (!v || !String(v).trim()) return 'Required';
    return undefined;
  }

  async function handleSaveBarber() {
    // validate fields (address optional)
    const e1 = validateRequired(userName);
    const e2 = validateRequired(userPhone);
    const e3 = validateEmail(userEmail);
    const e4 = validateRequired(barberName);
    const e5 = validateRequired(barberPhone);
    setErrors({ userName: e1, userPhone: e2, userEmail: e3, barberName: e4, barberPhone: e5 });
    if (e1 || e2 || e3 || e4 || e5) return Alert.alert('Validation', 'Please fix the required fields');

    try {
      const payload = { UserName: userName, UserPhone: userPhone, UserEmail: userEmail, BarberName: barberName, BarberPhone: barberPhone, Address: barberAddress };
      const created = await apiFetch('/api/barbers/create', { method: 'POST', json: payload });
      Alert.alert('Saved', `Barber ${created?.id ?? created?.Id} saved`);
      const next = await getNextBarberId();
      setBarberId(next);
      setUserName(''); setUserPhone(''); setUserEmail(''); setBarberName(''); setBarberPhone(''); setBarberAddress('');
      setErrors({});
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Save failed');
    }
  }

  async function handleSearchBarber() {
    try {
      let found: any = null;
      if (barberId) {
        const res = await apiFetch(`/api/barbers/getById/${barberId}`, { method: 'GET' });
        found = res;
      } else if (userEmail) {
        const res = await apiFetch(`/api/barbers/search?query=${encodeURIComponent(userEmail)}`, { method: 'GET' });
        found = Array.isArray(res) && res.length ? res[0] : null;
      } else if (userPhone) {
        const res = await apiFetch(`/api/barbers/search?query=${encodeURIComponent(userPhone)}`, { method: 'GET' });
        found = Array.isArray(res) && res.length ? res[0] : null;
      }
      if (!found) return Alert.alert('Not found', 'No barber found');
      setUserName(found.userName ?? found.UserName ?? ''); setUserPhone(found.userPhone ?? found.UserPhone ?? ''); setUserEmail(found.userEmail ?? found.UserEmail ?? '');
      setBarberName(found.barberName ?? found.BarberName ?? ''); setBarberPhone(found.barberPhone ?? found.BarberPhone ?? ''); setBarberAddress(found.barberAddress ?? found.Address ?? ''); setBarberId(found.id ?? found.Id ?? undefined);
    } catch (err: any) { Alert.alert('Error', err?.message ?? 'Search failed'); }
  }

  async function handleDeleteBarber() {
    if (!barberId) return Alert.alert('Info','No barber selected');
    try {
      await apiFetch(`/api/barbers/delete/${barberId}`, { method: 'DELETE' });
      Alert.alert('Deleted', `Barber ${barberId} removed`);
      const next = await getNextBarberId(); setBarberId(next);
      setUserName(''); setUserPhone(''); setUserEmail(''); setBarberName(''); setBarberPhone(''); setBarberAddress('');
    } catch (err: any) { Alert.alert('Error', err?.message ?? 'Delete failed'); }
  }

  function handleCancelBarber() {
    setUserName(''); setUserPhone(''); setUserEmail(''); setBarberName(''); setBarberPhone(''); setBarberAddress('');
  }

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
                      <SettingItem label="Etiqueta ejemplo 1" icon="airplane-outline" value={true} onPress={OnPressLabel}/>
                      <SettingItem label="Etiqueta ejemplo 2" icon="alarm-outline"/>
                      <SettingItem label="Etiqueta ejemplo 3" icon="add-circle-outline"/>
                      <SettingItem label="Etiqueta ejemplo 4" icon="bag-remove-outline"/>
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
                    <SettingItem label="Versión -> 0.0.0.0" icon="information-circle-outline" />
                    <SettingItem label="Desarrollado por Guillermo Ramirez" icon="code-outline" />
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

                  {isAdmin ? (
                    <SettingSection title="Application Users">
                      <View style={[styles.card, { backgroundColor: theme.colors.surface ?? '#fff' }]}> 
                        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Manage Application Users</Text>

                        <Text style={{ marginTop: 6 }}>Barber ID (auto)</Text>
                        <TextInput value={barberId} editable={false} style={[styles.input, { backgroundColor: '#eee' }]} />

                        <Text style={{ marginTop: 6 }}>Name</Text>
                        <TextInput value={userName} onChangeText={setUserName} style={styles.input} placeholder="Full name" />

                        <Text style={{ marginTop: 6 }}>Phone</Text>
                        <TextInput value={userPhone} onChangeText={setUserPhone} style={styles.input} placeholder="Phone" keyboardType="phone-pad" />

                        <Text style={{ marginTop: 6 }}>Email</Text>
                        <TextInput value={userEmail} onChangeText={setUserEmail} style={styles.input} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />

                        <Text style={{ marginTop: 6 }}>Barber Name</Text>
                        <TextInput value={barberName} onChangeText={setBarberName} style={styles.input} placeholder="Barber name" />

                        <Text style={{ marginTop: 6 }}>Barber Phone</Text>
                        <TextInput value={barberPhone} onChangeText={setBarberPhone} style={styles.input} placeholder="Barber phone" keyboardType="phone-pad" />

                        <Text style={{ marginTop: 6 }}>Address (optional)</Text>
                        <TextInput value={barberAddress} onChangeText={setBarberAddress} style={styles.input} placeholder="Address (optional)" />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                          <View style={{ alignItems: 'center', flex: 1 }}>
                            <Pressable onPress={handleSaveBarber} style={[styles.actionButton, { backgroundColor: theme.colors.primary, width: '90%' }]}>
                              <Ionicons name="save" size={20} color="#fff" />
                            </Pressable>
                            <Text style={styles.actionLabel}>Save</Text>
                          </View>
                          <View style={{ alignItems: 'center', flex: 1 }}>
                            <Pressable onPress={handleSearchBarber} style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, width: '90%' }]}>
                              <Ionicons name="search" size={20} color={theme.colors.textPrimary} />
                            </Pressable>
                            <Text style={styles.actionLabel}>Search</Text>
                          </View>
                          <View style={{ alignItems: 'center', flex: 1 }}>
                            <Pressable onPress={handleCancelBarber} style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, width: '90%' }]}>
                              <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
                            </Pressable>
                            <Text style={styles.actionLabel}>Cancel</Text>
                          </View>
                          <View style={{ alignItems: 'center', flex: 1 }}>
                            <Pressable onPress={handleDeleteBarber} style={[styles.actionButton, { backgroundColor: theme.colors.error, width: '90%' }]}>
                              <Ionicons name="trash" size={20} color="#fff" />
                            </Pressable>
                            <Text style={styles.actionLabel}>Delete</Text>
                          </View>
                        </View>
                      </View>
                    </SettingSection>
                  ) : null}


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
  actionButton: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  actionLabel: {
    marginTop: 6,
    fontSize: 12,
    textAlign: 'center'
  }
});

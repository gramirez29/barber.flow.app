import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/auth.store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';


type Props = NativeStackScreenProps<any, any>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [userOrEmail, setUserOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);

  const submit = async () => {
    setError(null);
    if (!userOrEmail.trim() || !password) {
      setError('Please provide both username/email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(userOrEmail.trim(), password);
      setAuth(res.username, res.token);
      // Replace nav stack with Main → so user can't go back to login
      navigation.replace('Main');
    } catch (err: any) {
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Login" center>
      <View style={styles.form}>
        <TextInput
          placeholder="Email or username"
          value={userOrEmail}
          onChangeText={setUserOrEmail}
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Button title="Login" onPress={submit} />
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  form: { width: '100%', padding: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  error: { color: 'red', marginBottom: 12 },
});
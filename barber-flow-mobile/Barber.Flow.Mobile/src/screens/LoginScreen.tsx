import React, { useState, useRef, useEffect } from 'react';
import {
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  Dimensions,
  Keyboard as RNKeyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout } from '../components/ScreenLayout';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/auth.store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useWindowDimensions } from 'react-native';
import { PasswordInput } from '../components/ui/PasswordInput';
import { FormCard } from '../components/ui/FormCard';
import { useAppTheme } from '../theme/ThemeContext';

type Props = NativeStackScreenProps<any, any>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [userOrEmail, setUserOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);
  const scrollRef = React.useRef<React.ElementRef<typeof ScrollView> | null>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const emailRef = useRef<RNTextInput | null>(null);
  const passwordRef = useRef<RNTextInput | null>(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = RNKeyboard.addListener(showEvent as any, (e: any) => setKeyboardHeight(e.endCoordinates?.height ?? 0));
    const hideSub = RNKeyboard.addListener(hideEvent as any, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

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
      navigation.replace('Main');
    } catch (err: any) {
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const ensureVisible = (ref: React.RefObject<RNTextInput | null>) => {
    const r = ref.current as any;
    if (!r || !scrollRef.current) return;
    const measureFn = r.measureInWindow ?? r.measure;
    if (typeof measureFn !== 'function') { scrollRef.current?.scrollTo({ y: scrollY + 160, animated: true }); return; }
    (measureFn as any).call(r, (x: number, y: number, w: number, h: number) => {
      const windowHeight = Dimensions.get('window').height;
      const kbTop = windowHeight - keyboardHeight;
      const elementBottom = y + h;
      if (keyboardHeight > 0 && elementBottom > kbTop - 12) {
        const delta = elementBottom - (kbTop - 12);
        scrollRef.current?.scrollTo({ y: Math.max(0, scrollY + delta + 16), animated: true });
      } else if (Platform.OS === 'android' && keyboardHeight === 0) {
        scrollRef.current?.scrollTo({ y: Math.max(0, scrollY + 160), animated: true });
      }
    });
  };

  const HEADER_HEIGHT = theme.layout.sizes.headerHeight ?? 64;
  const keyboardVerticalOffset = insets.top + HEADER_HEIGHT + 8;

  return (
    <ScreenLayout title="Login" center hideHeaderActions>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={keyboardVerticalOffset} style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView ref={scrollRef} contentContainerStyle={[styles.scrollContainer, { paddingBottom: Math.max(24, keyboardHeight + 24) }]} keyboardShouldPersistTaps="handled" onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)} scrollEventThrottle={16}>
            <Image source={require('../../assets/images/login-temporal.jpg')} style={[styles.image, { width: Math.min(theme.layout.sizes.maxContentWidth, width * 0.78), height: theme.layout.sizes.imageBannerHeight }]} resizeMode="contain" />
            <FormCard>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Welcome back</Text>

              <RNTextInput
                ref={emailRef as any}
                placeholder="Email or username"
                value={userOrEmail}
                onChangeText={setUserOrEmail}
                style={[styles.input, { backgroundColor: theme.colors.primaryInput, color: theme.colors.primaryTextInput }]}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                onFocus={() => ensureVisible(emailRef)}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <PasswordInput
                inputRef={passwordRef as any}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                onFocusVisible={() => ensureVisible(passwordRef)}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              {loading ? <ActivityIndicator style={styles.loader} /> : (
                <Pressable style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={submit}>
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Login</Text>
                </Pressable>
              )}
            </FormCard>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 18 },
  image: { marginBottom: 12, borderRadius: 12 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 10, marginBottom: 14, fontSize: 16.5 },
  error: { color: '#DC2626', marginBottom: 12, fontSize: 14 },
  loader: { marginVertical: 8 },
  button: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
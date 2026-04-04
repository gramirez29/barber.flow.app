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
  View,
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
import { useTranslation } from '../context/LanguageContext';

type Props = NativeStackScreenProps<any, any>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const { translateText } = useTranslation();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setUser = useAuthStore((s) => s.setUser);
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
    if (!userName.trim() || !password) {
      setError(translateText('login.validation'));
      return;
    }
    setLoading(true);
    try {
      const user = await authService.login(userName.trim(), password);
      setUser(user);
      navigation.replace('Main');
    } catch (err: any) {
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const ensureVisible = (ref: React.RefObject<RNTextInput | null>) => {
    const r = ref.current as any;
    if (!r || !scrollRef.current) {
      return;
    }
    
    const measureFn = r.measureInWindow ?? r.measure;

    if (typeof measureFn !== 'function') { 
      scrollRef.current?.scrollTo({ y: scrollY + 160, animated: true });
      return;
    }

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
  const contentWidth = Math.min((theme.layout.sizes.maxContentWidth ?? 520) + 24, width - 24);

  return (
    <ScreenLayout backgroundColor={theme.colors.background} hideHeaderActions>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={keyboardVerticalOffset} style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView ref={scrollRef} contentContainerStyle={[styles.scrollContainer, { paddingBottom: Math.max(24, keyboardHeight + 24) }]} keyboardShouldPersistTaps="handled" onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)} scrollEventThrottle={16}>
            <View style={[styles.contentWrap, { maxWidth: contentWidth }]}> 
              <View
                style={[
                  styles.heroPanel,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                  theme.layout.shadows.card,
                ]}
              >
                <View style={styles.heroTopRow}>
                  <View style={[styles.brandBadge, { backgroundColor: theme.mode === 'dark' ? 'rgba(96, 165, 250, 0.18)' : 'rgba(59, 130, 246, 0.12)' }]}>
                    <Text style={[styles.brandBadgeText, { color: theme.colors.secondary }]}>Barber Flow</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}> 
                    <Text style={[styles.statusPillText, { color: theme.colors.textSecondary }]}>{translateText('login.secureAccess')}</Text>
                  </View>
                </View>

                <Image source={require('../../assets/images/login-temporal.jpg')} style={[styles.image, { height: theme.layout.sizes.imageBannerHeight }]} resizeMode="contain" />

                <Text style={[styles.heroTitle, { color: theme.colors.textPrimary }]}>{translateText('login.heroTitle')}</Text>
                <Text style={[styles.heroBody, { color: theme.colors.textSecondary }]}>{translateText('login.heroBody')}</Text>

                <View style={styles.featureRow}>
                  <View style={[styles.featureChip, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <Text style={[styles.featureChipText, { color: theme.colors.textSecondary }]}>{translateText('login.appointments')}</Text>
                  </View>
                  <View style={[styles.featureChip, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <Text style={[styles.featureChipText, { color: theme.colors.textSecondary }]}>{translateText('login.clients')}</Text>
                  </View>
                  <View style={[styles.featureChip, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <Text style={[styles.featureChipText, { color: theme.colors.textSecondary }]}>{translateText('login.notifications')}</Text>
                  </View>
                </View>
              </View>

              <FormCard style={styles.authCard}>
                <Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>{translateText('login.welcomeBack')}</Text>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{translateText('login.signInToContinue')}</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{translateText('login.subtitle')}</Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{translateText('login.username')}</Text>
                  <RNTextInput
                    ref={emailRef as any}
                    placeholder={translateText('login.enterUsername')}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={userName}
                    onChangeText={setUserName}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.primaryInput,
                        borderColor: error ? theme.colors.error : theme.colors.border,
                        color: theme.colors.textPrimary,
                      },
                    ]}
                    autoCapitalize="none"
                    returnKeyType="next"
                    selectionColor={theme.colors.secondary}
                    onFocus={() => ensureVisible(emailRef)}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{translateText('login.password')}</Text>
                  <PasswordInput
                    inputRef={passwordRef as any}
                    placeholder={translateText('login.enterPassword')}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    onFocusVisible={() => ensureVisible(passwordRef)}
                    onSubmitEditing={submit}
                    returnKeyType="done"
                    error={Boolean(error)}
                  />
                </View>

                {error ? (
                  <View style={[styles.errorCard, { backgroundColor: theme.mode === 'dark' ? 'rgba(248, 113, 113, 0.14)' : 'rgba(220, 38, 38, 0.08)', borderColor: theme.colors.error }]}> 
                    <Text style={[styles.errorTitle, { color: theme.colors.error }]}>{translateText('login.authFailed')}</Text>
                    <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  style={[
                    styles.button,
                    {
                      backgroundColor: theme.colors.primary,
                      opacity: loading ? 0.82 : 1,
                    },
                  ]}
                  onPress={submit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.mode === 'dark' ? '#0F172A' : '#FFFFFF'} />
                  ) : (
                    <Text style={[styles.buttonText, { color: theme.mode === 'dark' ? '#0F172A' : '#FFFFFF' }]}>{translateText('login.signIn')}</Text>
                  )}
                </Pressable>

                <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>{translateText('login.helperText')}</Text>
              </FormCard>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 18 },
  contentWrap: { width: '100%', gap: 18 },
  heroPanel: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 22, paddingVertical: 20 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  brandBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  brandBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  statusPillText: { fontSize: 12, fontWeight: '600' },
  image: { width: '100%', marginTop: 12, marginBottom: 6 },
  heroTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', marginBottom: 10 },
  heroBody: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  featureChipText: { fontSize: 12, fontWeight: '600' },
  authCard: { paddingVertical: 22 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 21, marginBottom: 20 },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, fontSize: 16 },
  errorCard: { borderWidth: 1, borderRadius: 16, marginBottom: 14, paddingHorizontal: 14, paddingVertical: 12 },
  errorTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  error: { fontSize: 14, lineHeight: 20 },
  button: { minHeight: 52, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  helperText: { fontSize: 13, lineHeight: 18, marginTop: 14, textAlign: 'center' },
});
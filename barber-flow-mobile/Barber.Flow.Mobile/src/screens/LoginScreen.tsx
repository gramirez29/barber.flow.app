import React, { useMemo, useState } from 'react';
import {
	StyleSheet,
	Text,
	View,
	ImageBackground,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableWithoutFeedback,
	Keyboard,
	Pressable,
	ActivityIndicator,
	useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/auth.store';
import { getErrorMessage } from '../utils/errors';
import { useTranslation } from '../context/LanguageContext';
import { AppTheme } from '../theme/themes';
import { useAppTheme } from '../theme/ThemeContext';

type Props = NativeStackScreenProps<any, any>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
	const { translateText } = useTranslation();
	const { height: screenHeight } = useWindowDimensions();
	const { theme } = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	const PAPER_THEME = useMemo(() => ({
		colors: {
			primary: theme.colors.accent,
			onSurfaceVariant: theme.colors.textSecondary,
			background: theme.colors.surfaceElevated,
			outline: theme.colors.border,
			surface: theme.colors.surfaceElevated,
			onSurface: theme.colors.textPrimary,
			error: theme.colors.error,
		},
	}), [theme]);

	const [userName, setUserName] = useState('');
	const [password, setPassword] = useState('');
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const setUser = useAuthStore((s) => s.setUser);

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
		} catch (err: unknown) {
			setError(getErrorMessage(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
			<StatusBar style="light" />
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
					<ScrollView
						contentContainerStyle={styles.scroll}
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
					>
						{/* ── Hero image (top half) ── */}
						<ImageBackground
							source={require('../../assets/images/barber-flow-background-image.jpg')}
							style={[styles.hero, { height: screenHeight * 0.46 }]}
							resizeMode="cover"
						>
							<View style={styles.overlay}>
								{/* Brand row */}
								<View style={styles.brandRow}>
									<View style={styles.brandIconCircle}>
										<Ionicons name="cut" size={18} color="#0F172A" />
									</View>
									<Text style={styles.brandName}>BARBER FLOW</Text>
								</View>

								{/* Hero text */}
								<Text style={styles.heroTitle}>
									{translateText('login.heroTitle')}
								</Text>
								<Text style={styles.heroBody}>
									{translateText('login.heroBody')}
								</Text>

								{/* Feature pills */}
								<View style={styles.pillRow}>
									{(['login.appointments', 'login.clients', 'login.notifications'] as const).map((key) => (
										<View key={key} style={styles.pill}>
											<Text style={styles.pillText}>{translateText(key)}</Text>
										</View>
									))}
								</View>
							</View>
						</ImageBackground>

						{/* ── Form card (overlaps hero by 28 px) ── */}
						<View style={styles.card}>
							{/* Drag handle */}
							<View style={styles.handle} />

							<Text style={styles.eyebrow}>{translateText('login.secureAccess')}</Text>
							<Text style={styles.cardTitle}>{translateText('login.welcomeBack')}</Text>
							<Text style={styles.cardSubtitle}>{translateText('login.signInToContinue')}</Text>

							<View style={styles.inputs}>
								{/* Username */}
								<PaperTextInput
									mode="outlined"
									label={translateText('login.username')}
									placeholder={translateText('login.enterUsername')}
									value={userName}
									onChangeText={setUserName}
									autoCapitalize="none"
									autoCorrect={false}
									returnKeyType="next"
									theme={PAPER_THEME}
									outlineStyle={styles.inputOutline}
									style={styles.paperInput}
									left={
										<PaperTextInput.Icon
											icon={() => (
												<Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
											)}
										/>
									}
								/>

								{/* Password */}
								<PaperTextInput
									mode="outlined"
									label={translateText('login.password')}
									placeholder={translateText('login.enterPassword')}
									value={password}
									onChangeText={setPassword}
									secureTextEntry={!passwordVisible}
									returnKeyType="done"
									onSubmitEditing={submit}
									theme={PAPER_THEME}
									outlineStyle={styles.inputOutline}
									style={styles.paperInput}
									left={
										<PaperTextInput.Icon
											icon={() => (
												<Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />
											)}
										/>
									}
									right={
										<PaperTextInput.Icon
											icon={() => (
												<Ionicons
													name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
													size={20}
													color={theme.colors.textSecondary}
												/>
											)}
											onPress={() => setPasswordVisible((v) => !v)}
										/>
									}
								/>
							</View>

							{/* Error banner */}
							{error ? (
								<View style={styles.errorCard}>
									<Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} style={styles.errorIcon} />
									<View style={styles.errorText}>
										<Text style={styles.errorTitle}>{translateText('login.authFailed')}</Text>
										<Text style={styles.errorMsg}>{error}</Text>
									</View>
								</View>
							) : null}

							{/* CTA button */}
							<Pressable
								style={({ pressed }) => [
									styles.button,
									{ opacity: pressed || loading ? 0.8 : 1 },
								]}
								onPress={submit}
								disabled={loading}
								accessibilityRole="button"
								accessibilityLabel={translateText('login.signIn')}
							>
								{loading ? (
									<ActivityIndicator color="#0F172A" />
								) : (
									<Text style={styles.buttonText}>{translateText('login.signIn').toUpperCase()}</Text>
								)}
							</Pressable>

							<Pressable 
								onPress={() => navigation.navigate('ForgotPassword')}
								style={({ pressed }) => [
									styles.forgotPassword,
									{ opacity: pressed ? 0.7 : 1 }
								]}
							>
								<Text style={styles.forgotPasswordText}>
									{translateText('forgotPassword.title')}
								</Text>
							</Pressable>

							<Text style={styles.helperText}>{translateText('login.helperText')}</Text>
						</View>
					</ScrollView>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	flex: { flex: 1 },
	scroll: {
		flexGrow: 1,
	},

	// Hero
	hero: {
		width: '100%',
	},
	overlay: {
		flex: 1,
		backgroundColor: theme.colors.overlay,
		justifyContent: 'flex-end',
		paddingHorizontal: 24,
		paddingBottom: 48,
	},
	brandRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 20,
	},
	brandIconCircle: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: theme.colors.accent,
		alignItems: 'center',
		justifyContent: 'center',
	},
	brandName: {
		color: theme.colors.accent,
		fontSize: 14,
		fontWeight: '800',
		letterSpacing: 3,
	},
	heroTitle: {
		color: theme.colors.textPrimary,
		fontSize: 26,
		fontWeight: '700',
		lineHeight: 33,
		marginBottom: 10,
	},
	heroBody: {
		color: 'rgba(255,255,255,0.85)',
		fontSize: 14,
		lineHeight: 21,
		marginBottom: 18,
	},
	pillRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	pill: {
		borderWidth: 1,
		borderColor: theme.colors.accent,
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 5,
		backgroundColor: theme.colors.accent + '1a',
	},
	pillText: {
		color: theme.colors.accentLight,
		fontSize: 11,
		fontWeight: '600',
		letterSpacing: 0.4,
	},

	// Card
	card: {
		backgroundColor: theme.colors.surface,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		marginTop: -28,
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 16,
		paddingBottom: 32,
	},
	handle: {
		width: 40,
		height: 4,
		borderRadius: 2,
		backgroundColor: theme.colors.border,
		alignSelf: 'center',
		marginBottom: 24,
	},
	eyebrow: {
		color: theme.colors.accent,
		fontSize: 11,
		fontWeight: '700',
		letterSpacing: 2,
		textTransform: 'uppercase',
		marginBottom: 6,
	},
	cardTitle: {
		color: theme.colors.textPrimary,
		fontSize: 26,
		fontWeight: '700',
		marginBottom: 6,
	},
	cardSubtitle: {
		color: theme.colors.textSecondary,
		fontSize: 14,
		lineHeight: 21,
		marginBottom: 28,
	},

	// Inputs
	inputs: {
		gap: 16,
		marginBottom: 20,
	},
	paperInput: {
		backgroundColor: theme.colors.surfaceElevated,
		fontSize: 15,
	},
	inputOutline: {
		borderRadius: 12,
	},

	// Error
	errorCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: theme.colors.errorBg,
		borderWidth: 1,
		borderColor: theme.colors.error,
		borderRadius: 12,
		padding: 12,
		marginBottom: 16,
		gap: 10,
	},
	errorIcon: {
		marginTop: 1,
	},
	errorText: {
		flex: 1,
	},
	errorTitle: {
		color: theme.colors.error,
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 0.5,
		textTransform: 'uppercase',
		marginBottom: 2,
	},
	errorMsg: {
		color: theme.colors.error,
		fontSize: 13,
		lineHeight: 19,
	},

	// Button
	button: {
		height: 54,
		borderRadius: 14,
		backgroundColor: theme.colors.accent,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: theme.colors.accent,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 10,
		elevation: 6,
		marginBottom: 20,
	},
	buttonText: {
		color: '#0F172A',
		fontSize: 15,
		fontWeight: '800',
		letterSpacing: 1.5,
	},
	forgotPassword: {
		marginTop: 8,
		paddingVertical: 12,
		alignItems: 'center',
	},
	forgotPasswordText: {
		color: theme.colors.textSecondary,
		fontSize: 13,
		textDecorationLine: 'underline',
	},

	// Helper
	helperText: {
		color: theme.colors.textSecondary,
		fontSize: 13,
		lineHeight: 18,
		textAlign: 'center',
	},
});

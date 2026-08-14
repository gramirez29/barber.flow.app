import React, { useMemo, useState } from 'react';
import {
	StyleSheet,
	Text,
	View,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableWithoutFeedback,
	Keyboard,
	Pressable,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from '../context/LanguageContext';
import { authService } from '../services/authService';
import { AppTheme } from '../theme/themes';
import { useAppTheme } from '../theme/ThemeContext';

type Props = NativeStackScreenProps<any, any>;

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
	const { translateText } = useTranslation();
	const { theme } = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	const { email, otp } = route.params || {};
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const submit = async () => {
		if (password.length < 6) {
			setError(translateText('validation.passwordLength'));
			return;
		}
		if (password !== confirmPassword) {
			setError(translateText('validation.passwordsMustMatch') || 'Las contraseñas no coinciden');
			return;
		}
		
		setError(null);
		setLoading(true);
		try {
			await authService.resetPassword(email, otp, password);
			setLoading(false);
			Alert.alert(
				translateText('resetPassword.success'),
				'',
				[{ text: 'OK', onPress: () => navigation.navigate('Login') }]
			);
		} catch (err) {
			setError(translateText('validation.error') || 'Error al restablecer contraseña');
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.safe}>
			<StatusBar style="light" />
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<ScrollView contentContainerStyle={styles.scroll}>
						<View style={styles.header}>
							<Text style={styles.title}>{translateText('resetPassword.title')}</Text>
							<Text style={styles.subtitle}>{translateText('resetPassword.subtitle')}</Text>
						</View>

						<PaperTextInput
							label={translateText('resetPassword.newPassword')}
							value={password}
							onChangeText={setPassword}
							mode="outlined"
							secureTextEntry={!passwordVisible}
							right={<PaperTextInput.Icon icon={passwordVisible ? "eye-off" : "eye"} onPress={() => setPasswordVisible(!passwordVisible)} />}
							style={styles.input}
							outlineColor={theme.colors.border}
							activeOutlineColor={theme.colors.accent}
							textColor={theme.colors.textPrimary}
						/>

						<PaperTextInput
							label={translateText('resetPassword.confirmPassword')}
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							mode="outlined"
							secureTextEntry={!passwordVisible}
							style={styles.input}
							outlineColor={theme.colors.border}
							activeOutlineColor={theme.colors.accent}
							textColor={theme.colors.textPrimary}
						/>

						{error && <Text style={styles.errorText}>{error}</Text>}

						<Pressable
							onPress={submit}
							style={({ pressed }) => [
								styles.button,
								pressed && { opacity: 0.8 },
								loading && styles.buttonDisabled
							]}
							disabled={loading}
						>
							{loading ? (
								<ActivityIndicator color="#0f172a" />
							) : (
								<Text style={styles.buttonText}>{translateText('resetPassword.savePassword')}</Text>
							)}
						</Pressable>
					</ScrollView>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
};

const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
		safe: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		flex: {
			flex: 1,
		},
		scroll: {
			flexGrow: 1,
			paddingHorizontal: 24,
			paddingTop: 60,
		},
		header: {
			marginBottom: 40,
		},
		title: {
			fontSize: 28,
			fontWeight: '700',
			color: theme.colors.textPrimary,
			marginBottom: 8,
		},
		subtitle: {
			fontSize: 15,
			color: theme.colors.textSecondary,
			lineHeight: 22,
		},
		input: {
			marginBottom: 20,
			backgroundColor: theme.colors.surfaceElevated,
		},
		button: {
			height: 56,
			backgroundColor: theme.colors.accent,
			borderRadius: 12,
			justifyContent: 'center',
			alignItems: 'center',
			marginTop: 10,
		},
		buttonDisabled: {
			opacity: 0.6,
		},
		buttonText: {
			fontSize: 16,
			fontWeight: '700',
			color: '#0f172a',
		},
		errorText: {
			color: theme.colors.error,
			marginBottom: 10,
		},
	});

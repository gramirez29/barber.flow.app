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

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
	const { translateText } = useTranslation();
	const { theme } = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const submit = async () => {
		if (!email.trim() || !email.includes('@')) {
			setError(translateText('validation.invalidEmail'));
			return;
		}
		setError(null);
		setLoading(true);
		try {
			await authService.requestPasswordReset(email.trim());
			setLoading(false);
			navigation.navigate('OtpVerification', { email: email.trim() });
		} catch (err) {
			setError(translateText('validation.error') || 'Ocurrió un error');
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
						<Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
							<Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
						</Pressable>

						<View style={styles.header}>
							<Text style={styles.title}>{translateText('forgotPassword.title')}</Text>
							<Text style={styles.subtitle}>{translateText('forgotPassword.subtitle')}</Text>
						</View>

						<PaperTextInput
							label={translateText('manageUsersForm.email')}
							value={email}
							onChangeText={setEmail}
							mode="outlined"
							keyboardType="email-address"
							autoCapitalize="none"
							style={styles.input}
							outlineColor={theme.colors.border}
							activeOutlineColor={theme.colors.accent}
							textColor={theme.colors.textPrimary}
							theme={{
								colors: {
									onSurfaceVariant: theme.colors.textSecondary,
									surfaceVariant: theme.colors.surfaceElevated,
								}
							}}
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
								<Text style={styles.buttonText}>{translateText('forgotPassword.sendCode')}</Text>
							)}
						</Pressable>

						<Pressable onPress={() => navigation.navigate('Login')} style={styles.link}>
							<Text style={styles.linkText}>{translateText('forgotPassword.backToLogin')}</Text>
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
			paddingTop: 20,
		},
		backButton: {
			marginBottom: 30,
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
		link: {
			marginTop: 25,
			alignItems: 'center',
		},
		linkText: {
			color: theme.colors.textSecondary,
			fontSize: 14,
		},
	});

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
	StyleSheet,
	Text,
	View,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableWithoutFeedback,
	Keyboard,
	TextInput,
	Pressable,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from '../context/LanguageContext';
import { authService } from '../services/authService';
import { AppTheme } from '../theme/themes';
import { useAppTheme } from '../theme/ThemeContext';

type Props = NativeStackScreenProps<any, any>;

export const OtpVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
	const { translateText } = useTranslation();
	const { theme } = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	const email = route.params?.email || 'user@example.com';
	const [otp, setOtp] = useState(['', '', '', '', '', '']);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [timer, setTimer] = useState(60);

	const inputs = useRef<Array<TextInput | null>>([]);

	useEffect(() => {
		const interval = setInterval(() => {
			setTimer((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const handleChange = (text: string, index: number) => {
		const newOtp = [...otp];
		newOtp[index] = text;
		setOtp(newOtp);

		// Move focus forward
		if (text && index < 5) {
			inputs.current[index + 1]?.focus();
		}

		// Auto-verify if all digits are filled
		if (newOtp.every(digit => digit !== '') && index === 5) {
			void verifyOtp(newOtp.join(''));
		}
	};

	const handleKeyPress = (e: any, index: number) => {
		if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
			inputs.current[index - 1]?.focus();
		}
	};

	const verifyOtp = async (code: string) => {
		setLoading(true);
		setError(null);
		try {
			await authService.verifyOtp(email, code);
			setLoading(false);
			navigation.navigate('ResetPassword', { email, otp: code });
		} catch (err) {
			setError(translateText('otp.invalidCode'));
			setLoading(false);
		}
	};

	const resendCode = () => {
		if (timer === 0) {
			setTimer(60);
			// Trigger resend
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
							<Text style={styles.title}>{translateText('otp.title')}</Text>
							<Text style={styles.subtitle}>
								{translateText('otp.subtitle')} {email}
							</Text>
						</View>

						<View style={styles.otpContainer}>
							{otp.map((digit, index) => (
								<TextInput
									key={index}
									ref={(el) => (inputs.current[index] = el)}
									style={[
										styles.otpInput,
										digit ? styles.otpInputActive : null,
										error ? styles.otpInputError : null
									]}
									maxLength={1}
									keyboardType="numeric"
									value={digit}
									onChangeText={(text) => handleChange(text, index)}
									onKeyPress={(e) => handleKeyPress(e, index)}
									selectionColor={theme.colors.accent}
									placeholderTextColor={theme.colors.textTertiary}
								/>
							))}
						</View>

						{error && <Text style={styles.errorText}>{error}</Text>}

						{loading ? (
							<ActivityIndicator color={theme.colors.accent} style={{ marginTop: 20 }} />
						) : (
							<View style={styles.footer}>
								<Text style={styles.footerText}>{translateText('otp.noCode')}</Text>
								<Pressable onPress={resendCode} disabled={timer > 0}>
									<Text style={[styles.resendText, timer > 0 && styles.resendDisabled]}>
										{timer > 0 ? `${translateText('otp.resendIn')} ${timer}s` : translateText('otp.resendNow')}
									</Text>
								</Pressable>
							</View>
						)}
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
		otpContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginBottom: 30,
		},
		otpInput: {
			width: 45,
			height: 55,
			borderRadius: 8,
			backgroundColor: theme.colors.surfaceElevated,
			borderWidth: 1.5,
			borderColor: theme.colors.border,
			textAlign: 'center',
			fontSize: 22,
			fontWeight: '700',
			color: theme.colors.textPrimary,
		},
		otpInputActive: {
			borderColor: theme.colors.accent,
		},
		otpInputError: {
			borderColor: theme.colors.error,
		},
		errorText: {
			color: theme.colors.error,
			textAlign: 'center',
			marginBottom: 10,
		},
		footer: {
			alignItems: 'center',
			marginTop: 20,
		},
		footerText: {
			color: theme.colors.textSecondary,
			marginBottom: 5,
		},
		resendText: {
			color: theme.colors.accent,
			fontWeight: '600',
		},
		resendDisabled: {
			color: theme.colors.textTertiary,
		},
	});

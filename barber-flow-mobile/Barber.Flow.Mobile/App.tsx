import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { createNavigationTheme, createPaperTheme } from './src/theme/themes';

function Main() {
	const { theme } = useAppTheme();
	const paperTheme = createPaperTheme(theme);
	const navigationTheme = createNavigationTheme(theme);

	return (
		<PaperProvider theme={paperTheme}>
			<NavigationContainer theme={navigationTheme}>
				<NotificationProvider>
					<StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
					<RootNavigator />
				</NotificationProvider>
			</NavigationContainer>
		</PaperProvider>
	);
}

export default function App() {
	return (
		<ThemeProvider>
			<LanguageProvider>
				<Main />
			</LanguageProvider>
		</ThemeProvider>
	);
}

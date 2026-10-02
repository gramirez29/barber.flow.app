import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { createNavigationTheme, createPaperTheme } from './src/theme/themes';
import { DialogProvider } from './src/context/DialogContext';
import { FeatureFlagsProvider } from './src/context/FeatureFlagsContext';

function Main() {
	const { theme } = useAppTheme();
	const paperTheme = createPaperTheme(theme);
	const navigationTheme = createNavigationTheme(theme);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<PaperProvider theme={paperTheme}>
				<DialogProvider>
					<NavigationContainer theme={navigationTheme}>
						<FeatureFlagsProvider>
						<NotificationProvider>
							<StatusBar style="light" />
							<RootNavigator />
						</NotificationProvider>
						</FeatureFlagsProvider>
					</NavigationContainer>
				</DialogProvider>
			</PaperProvider>
		</GestureHandlerRootView>
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

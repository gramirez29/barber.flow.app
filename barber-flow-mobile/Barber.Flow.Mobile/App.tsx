import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { NotificationProvider } from './src/context/NotificationContext';

function Main() {
  const { theme } = useAppTheme();

  return (
    <NavigationContainer>
      <NotificationProvider>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
        <RootNavigator />
      </NotificationProvider>
    </NavigationContainer>
  );
}

export default function App() {

  console.log('APP RELOADED', new Date().toISOString());

  return (
    <ThemeProvider>
      <Main />
    </ThemeProvider>
  );
}

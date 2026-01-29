import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
// import { DrawerNavigator } from './src/navigation/DrawerNavigator';
import 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';

function Main() {
  const { theme } = useAppTheme();

  return (
    <NavigationContainer>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
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

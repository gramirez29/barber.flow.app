import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { DrawerNavigator } from './src/navigation/DrawerNavigator';
import 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {

  console.log('APP RELOADED', new Date().toISOString());

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
        <AppNavigator />
    </NavigationContainer>
  );
}

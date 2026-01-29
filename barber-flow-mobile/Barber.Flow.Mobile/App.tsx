import { StatusBar } from "react-native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { NavigationContainer } from "@react-navigation/native";
import React from "react";

export default function App() {

  console.log('APP RELOADED', new Date().toISOString());

  alert('App Reloaded');

  return (
    // <View style={styles.container}>
    //   <Text>Open up App.tsx to start working on your app!</Text>
    //   <StatusBar style="light" />
    //   <NavigationContainer>
    //     <AppNavigator />
    //   </NavigationContainer>
      

    // </View>

    // <NavigationContainer>
    //   <StatusBar style="auto" />
    //     <AppNavigator />
    // </NavigationContainer>

    // <SafeAreaProvider>
      <RootNavigator />
    // </SafeAreaProvider>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

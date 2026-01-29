import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { DrawerNavigator } from "./DrawerNavigator";
import { AppNavigator } from "./AppNavigator";

export const RootNavigator = () => {
    return (
        <NavigationContainer theme={ DefaultTheme }>
            <DrawerNavigator /> 
        </NavigationContainer>
    );
}
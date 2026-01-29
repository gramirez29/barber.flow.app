import { createDrawerNavigator } from "@react-navigation/drawer";
import { AppNavigator } from "./AppNavigator";

const Drawer = createDrawerNavigator();

export const DrawerNavigator = () => {
    return (
        <Drawer.Navigator screenOptions={{ headerShown: false }}>
            <Drawer.Screen name="HomeTabs" component={AppNavigator} />
        </Drawer.Navigator>
    );
};
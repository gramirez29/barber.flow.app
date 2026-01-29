import { createDrawerNavigator } from "@react-navigation/drawer";
import { AppNavigator } from "./AppNavigator";
import { CustomDrawer } from "../components/ui/CustomDrawer";

const Drawer = createDrawerNavigator();

export const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* 🔥 El Drawer envuelve TODO el stack */}
      <Drawer.Screen name="HomeStack" component={AppNavigator} />
    </Drawer.Navigator>
  );
};
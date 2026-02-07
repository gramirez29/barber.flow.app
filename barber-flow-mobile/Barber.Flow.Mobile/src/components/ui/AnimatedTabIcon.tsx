import { Ionicons } from "@expo/vector-icons";
import Animated, {
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";

export const AnimatedTabIcon = ({ name, focused, color }: any) => {
    const animatedStyle = useAnimatedStyle(() => {
        return {
        transform: [
            {
            scale: withSpring(focused ? 1.2 : 1),
            opacity: withSpring(focused ? 1 : 0.7),
            },
        ],
        };
    });

    return (
        <Animated.View style={animatedStyle}>
            <Ionicons name={name} size={focused ? 26 : 20} color={color} />
        </Animated.View>
    );
};
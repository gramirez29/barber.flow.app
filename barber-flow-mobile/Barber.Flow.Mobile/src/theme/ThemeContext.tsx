import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { settingsService } from "../services/apis/settingsService";
import { lightTheme, darkTheme, AppTheme } from "./themes";
import type { ThemeMode } from "../types/settings";

type ThemeContextType = {
  theme: AppTheme;
  toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
    themeMode: ThemeMode;
    resolvedThemeMode: Exclude<ThemeMode, "system">;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
    const [systemThemeMode, setSystemThemeMode] = useState<Exclude<ThemeMode, "system">>(
      Appearance.getColorScheme() === "dark" ? "dark" : "light",
    );

    useEffect(() => {
        let mounted = true;

        const loadStoredTheme = async () => {
            const preferences = await settingsService.getStoredPreferences();

            if (!mounted || !preferences?.themeMode) {
                return;
            }

            setThemeModeState(preferences.themeMode);
        };

        void loadStoredTheme();

        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemThemeMode(colorScheme === "dark" ? "dark" : "light");
        });

        return () => {
            mounted = false;
            subscription.remove();
        };
    }, []);

    const resolvedThemeMode = useMemo<Exclude<ThemeMode, "system">>(() => {
        return themeMode === "system" ? systemThemeMode : themeMode;
    }, [systemThemeMode, themeMode]);

    const theme = resolvedThemeMode === "dark" ? darkTheme : lightTheme;

    const toggleTheme = () => {
        const nextMode: ThemeMode = resolvedThemeMode === "dark" ? "light" : "dark";
        setThemeModeState(nextMode);
        void settingsService.setThemeMode(nextMode);
    };

    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode);
        await settingsService.setThemeMode(mode);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode, themeMode, resolvedThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useAppTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useAppTheme must be used inside ThemeProvider");
    }
    return context;
};
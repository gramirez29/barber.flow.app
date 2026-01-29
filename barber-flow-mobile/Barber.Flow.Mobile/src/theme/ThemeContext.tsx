import React, { createContext, useContext, useState } from "react";
import { lightTheme, darkTheme, AppTheme } from "./themes";

type ThemeContextType = {
  theme: AppTheme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<AppTheme>(lightTheme);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme.mode === 'light' ? darkTheme : lightTheme));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
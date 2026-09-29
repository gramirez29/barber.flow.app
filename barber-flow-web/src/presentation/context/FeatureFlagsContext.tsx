import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AGENDA_FLAG_STORAGE_KEY } from '@shared/constants/agenda';

/**
 * Feature flags por DISPOSITIVO (localStorage). Todos apagados por defecto: con un flag apagado la
 * app se comporta exactamente como antes. Si más adelante se quiere activar por barbero/barbería,
 * este contexto es el único lugar a cambiar (leería de la API en vez de localStorage).
 */
interface FeatureFlagsContextType {
  /** Vista de día como agenda por horas (spots de 30 min, arrastrar para mover). */
  agendaDayViewEnabled: boolean;
  setAgendaDayViewEnabled: (enabled: boolean) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

const readFlag = (key: string): boolean => {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agendaDayViewEnabled, setAgendaDayViewEnabledState] = useState<boolean>(() =>
    readFlag(AGENDA_FLAG_STORAGE_KEY)
  );

  const setAgendaDayViewEnabled = useCallback((enabled: boolean) => {
    setAgendaDayViewEnabledState(enabled);
    try {
      localStorage.setItem(AGENDA_FLAG_STORAGE_KEY, String(enabled));
    } catch {
      // Sin localStorage (modo privado, etc.): el flag vale solo durante esta sesión.
    }
  }, []);

  const value = useMemo(
    () => ({ agendaDayViewEnabled, setAgendaDayViewEnabled }),
    [agendaDayViewEnabled, setAgendaDayViewEnabled]
  );

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};

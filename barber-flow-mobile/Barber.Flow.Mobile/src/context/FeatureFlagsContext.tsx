import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AGENDA_FLAG_STORAGE_KEY } from "../utils/agendaLayout";

interface FeatureFlagsContextProps {
	agendaDayViewEnabled: boolean;
	setAgendaDayViewEnabled: (value: boolean) => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextProps | null>(null);

/** Per-device feature flags (AsyncStorage). Off by default; off = the app behaves exactly as before. */
export const FeatureFlagsProvider = ({ children }: { children: React.ReactNode }) => {
	const [agendaDayViewEnabled, setAgendaState] = useState(false);

	useEffect(() => {
		let mounted = true;
		void AsyncStorage.getItem(AGENDA_FLAG_STORAGE_KEY)
			.then((stored) => {
				if (mounted && stored === "true") setAgendaState(true);
			})
			.catch(() => undefined);
		return () => {
			mounted = false;
		};
	}, []);

	const setAgendaDayViewEnabled = useCallback(async (value: boolean) => {
		setAgendaState(value);
		try {
			await AsyncStorage.setItem(AGENDA_FLAG_STORAGE_KEY, String(value));
		} catch {
			// The flag still applies for this session even if it could not be persisted.
		}
	}, []);

	const value = useMemo(
		() => ({ agendaDayViewEnabled, setAgendaDayViewEnabled }),
		[agendaDayViewEnabled, setAgendaDayViewEnabled],
	);

	return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
};

export const useFeatureFlags = () => {
	const context = useContext(FeatureFlagsContext);
	if (!context) throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider");
	return context;
};

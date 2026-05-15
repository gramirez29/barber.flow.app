// Lightweight config loader:
// - Prefer process.env.BARBERFLOW_API_URL (works with dotenv/babel plugins or CI env vars)
// - Then Expo Constants.extra (for eas/app.json configuration)
// - Fallback to the development URL. Replace placeholders as needed.
let expoExtra:
	| { APP_ENV?: string; BASE_URL?: string; ADMIN_USERNAME?: string }
	| undefined = undefined;
try {
	const Constants = require("expo-constants");
	expoExtra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra;
} catch {
  // Not running in an Expo environment, ignore
}

export const APP_ENV =
	(process.env.APP_ENV as string | undefined) ??
	expoExtra?.APP_ENV ??
	"development";

const BASE_URL_DEFAULT =
	APP_ENV === "development"
		? "http://192.168.68.59:7016"
		: "https://barberflowapp-develop.up.railway.app";

export const BASE_URL =
	(process.env.BARBERFLOW_API_URL as string | undefined) ?? expoExtra?.BASE_URL ?? BASE_URL_DEFAULT;

// Admin username (single admin). Can be configured via env or Expo extra.
export const ADMIN_USERNAME =
	(process.env.BARBERFLOW_ADMIN_USERNAME as string | undefined) ?? expoExtra?.ADMIN_USERNAME ?? "admin";

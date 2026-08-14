// Lightweight config loader:
// - Prefer process.env.BARBERFLOW_API_URL (works with dotenv/babel plugins or CI env vars)
// - Then Expo Constants.extra (for eas/app.json configuration)
// - Fallback to the development URL. Replace placeholders as needed.
let expoExtra:
	| { APP_ENV?: string; BASE_URL?: string; ADMIN_USERNAME?: string; PRIVACY_POLICY_URL?: string }
	| undefined = undefined;
try {
	const ConstantsModule = require("expo-constants");
	const Constants = ConstantsModule?.default ?? ConstantsModule;
	expoExtra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra;
} catch {
  // Not running in an Expo environment, ignore
}

export const APP_ENV =
	(process.env.APP_ENV as string | undefined) ??
	expoExtra?.APP_ENV ??
	"development";

const BASE_URL_DEFAULT =
	APP_ENV === "testing" || APP_ENV === "production"
		? "https://barberflowapp-develop.up.railway.app"
		: "http://192.168.68.55:7016";

export const BASE_URL =
	(process.env.BARBERFLOW_API_URL as string | undefined) ?? expoExtra?.BASE_URL ?? BASE_URL_DEFAULT;

// Admin username (single admin). Can be configured via env or Expo extra.
export const ADMIN_USERNAME =
	(process.env.BARBERFLOW_ADMIN_USERNAME as string | undefined) ?? expoExtra?.ADMIN_USERNAME ?? "admin";

// Privacy policy URL. Configure via PRIVACY_POLICY_URL env var or Expo extra.
export const PRIVACY_POLICY_URL =
	(process.env.PRIVACY_POLICY_URL as string | undefined) ??
	expoExtra?.PRIVACY_POLICY_URL ??
	"https://barberflowapp-develop.up.railway.app/privacy-policy";

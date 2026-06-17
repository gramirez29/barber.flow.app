const APP_ENV = process.env.APP_ENV ?? "development";

const PRIVACY_POLICY_URL =
	process.env.PRIVACY_POLICY_URL ??
	"https://barberflowapp-develop.up.railway.app/privacy-policy";

const URL_BY_ENV = {
	development: "http://192.168.68.61:7016",
	testing:     "https://barberflowapp-develop.up.railway.app",
	production:  "https://barberflowapp-develop.up.railway.app",
};

const BASE_URL = URL_BY_ENV[APP_ENV] ?? URL_BY_ENV.development;

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
	name: "Barber Flow",
	slug: "barber-flow",
	version: "1.0.0",
	orientation: "portrait",
	icon: "./assets/icon.png",
	userInterfaceStyle: "light",
	newArchEnabled: true,
	splash: {
		image: "./assets/splash-icon.png",
		resizeMode: "contain",
		backgroundColor: "#ffffff",
	},
	ios: {
		supportsTablet: false,
		bundleIdentifier: "com.guillermoramirez.barberflow",
		buildNumber: "1",		config: {
			usesNonExemptEncryption: false,
		},	},
	android: {
		adaptiveIcon: {
			foregroundImage: "./assets/adaptive-icon.png",
			backgroundColor: "#ffffff",
		},
		edgeToEdgeEnabled: true,
		predictiveBackGestureEnabled: false,
		package: "com.guillermoramirez.barberflow",
		versionCode: 1,
	},
	web: {
		favicon: "./assets/favicon.png",
	},
	extra: {
		APP_ENV,
		BASE_URL,
		PRIVACY_POLICY_URL,
		eas: {
			projectId: "7dac0395-3c83-4913-82dc-5793de184b98",
		},
	},
	plugins: [
		"@react-native-community/datetimepicker",
		"expo-font",
		"expo-secure-store",
		"expo-web-browser",
		[
			"expo-image-picker",
			{
				photosPermission:
					"Permite a Barber Flow acceder a tu galeria para seleccionar una foto de perfil.",
				cameraPermission:
					"Permite a Barber Flow acceder a la camara para tomar una foto de perfil.",
			},
		],
	],
};

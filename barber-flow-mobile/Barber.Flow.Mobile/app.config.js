const APP_ENV = process.env.APP_ENV ?? "development";

const URL_BY_ENV = {
	development: "http://192.168.68.55:7016",
	testing:     "https://barberflowapp-develop.up.railway.app",
	production:  "https://barberflowapp-develop.up.railway.app",
};

const BASE_URL = URL_BY_ENV[APP_ENV] ?? URL_BY_ENV.development;

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
	name: "Barber.Flow.Mobile",
	slug: "barber-flow",
	version: "1.0.0",
	orientation: "portrait",
	icon: "./assets/icon.png",
	userInterfaceStyle: "light",
	newArchEnabled: true,
	splash: {
		image: "./assets/icon.png",
		resizeMode: "contain",
		backgroundColor: "#ffffff",
	},
	ios: {
		supportsTablet: true,
	},
	android: {
		adaptiveIcon: {
			foregroundImage: "./assets/adaptive-icon.png",
			backgroundColor: "#ffffff",
		},
		schemes: ["whatsapp", "tel", "sms"],
		edgeToEdgeEnabled: true,
		predictiveBackGestureEnabled: false,
		package: "com.anonymous.Barber.Flow.Mobile",
	},
	web: {
		favicon: "./assets/favicon.png",
	},
	extra: {
		APP_ENV,
		BASE_URL,
		eas: {
			projectId: "7dac0395-3c83-4913-82dc-5793de184b98",
		},
	},
	plugins: [
		"@react-native-community/datetimepicker",
		"expo-font",
		[
			"expo-image-picker",
			{
				photosPermission:
					"Permite a Barber Flow acceder a tu galeria para seleccionar una foto de perfil.",
				cameraPermission:
					"Permite a Barber Flow acceder a la camara para tomar una foto de perfil.",
				microphonePermission:
					"Permite a Barber Flow acceder al microfono al grabar video desde la camara.",
			},
		],
	],
};

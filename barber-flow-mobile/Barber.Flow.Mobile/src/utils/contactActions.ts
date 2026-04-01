import {
  ActionSheetIOS,
  Alert,
  Linking,
  Platform,
} from "react-native";

const DEFAULT_COUNTRY_CODE = "506";

const sanitizePhoneNumber = (phone: string) => phone.replace(/\D+/g, "");

const buildSmsUrl = (phone: string, message: string) => {
  const separator = Platform.OS === "ios" ? "&" : "?";
  return `sms:${phone}${separator}body=${encodeURIComponent(message)}`;
};

const buildMessage = (clientName?: string) => {
  if (!clientName) {
    return "Hello";
  }

  return `Hello ${clientName}`;
};

const buildWhatsAppPhoneNumber = (phone: string) => {
  const digits = sanitizePhoneNumber(phone);

  if (digits.length === 8) {
    return `${DEFAULT_COUNTRY_CODE}${digits}`;
  }

  return digits;
};

const openUrl = async (
  url: string,
  errorTitle: string,
  errorMessage: string,
) => {
  const supported = await Linking.canOpenURL(url);

  if (!supported) {
    Alert.alert(errorTitle, errorMessage);
    return;
  }

  await Linking.openURL(url);
};

export const openClientPhoneCall = async (phone: string) => {
  const digits = sanitizePhoneNumber(phone);

  if (!digits) {
    Alert.alert("Call unavailable", "This client does not have a valid phone number.");
    return;
  }

  try {
    await openUrl(
      `tel:${digits}`,
      "Call unavailable",
      "Your device could not open the phone dialer.",
    );
  } catch {
    Alert.alert("Call unavailable", "Your device could not open the phone dialer.");
  }
};

const openClientSms = async (phone: string, clientName?: string) => {
  const digits = sanitizePhoneNumber(phone);

  if (!digits) {
    Alert.alert("SMS unavailable", "This client does not have a valid phone number.");
    return;
  }

  try {
    await openUrl(
      buildSmsUrl(digits, buildMessage(clientName)),
      "SMS unavailable",
      "Your device could not open the SMS app.",
    );
  } catch {
    Alert.alert("SMS unavailable", "Your device could not open the SMS app.");
  }
};

const openClientWhatsApp = async (phone: string, clientName?: string) => {
  const whatsappPhone = buildWhatsAppPhoneNumber(phone);

  if (!whatsappPhone) {
    Alert.alert("WhatsApp unavailable", "This client does not have a valid phone number.");
    return;
  }

  const url = `whatsapp://send?phone=${whatsappPhone}&text=${encodeURIComponent(buildMessage(clientName))}`;

  try {
    await openUrl(
      url,
      "WhatsApp unavailable",
      "WhatsApp is not installed or could not be opened on this device.",
    );
  } catch {
    Alert.alert(
      "WhatsApp unavailable",
      "WhatsApp is not installed or could not be opened on this device.",
    );
  }
};

export const openClientMessagePicker = (phone: string, clientName?: string) => {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        cancelButtonIndex: 0,
        message: "Choose how to contact this client.",
        options: ["Cancel", "WhatsApp", "SMS"],
        title: "Send message",
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          void openClientWhatsApp(phone, clientName);
        }

        if (buttonIndex === 2) {
          void openClientSms(phone, clientName);
        }
      },
    );

    return;
  }

  Alert.alert("Send message", "Choose how to contact this client.", [
    {
      style: "cancel",
      text: "Cancel",
    },
    {
      onPress: () => {
        void openClientWhatsApp(phone, clientName);
      },
      text: "WhatsApp",
    },
    {
      onPress: () => {
        void openClientSms(phone, clientName);
      },
      text: "SMS",
    },
  ]);
};
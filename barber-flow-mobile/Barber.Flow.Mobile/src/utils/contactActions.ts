import {
  ActionSheetIOS,
  Alert,
  Linking,
  Platform,
} from "react-native";

type ContactActionLabels = {
  callUnavailableMessage: string;
  callUnavailableOpen: string;
  callUnavailableTitle: string;
  cancel: string;
  chooseContactMethod: string;
  hello: string;
  helloName: string;
  sendMessage: string;
  smsLabel: string;
  smsUnavailableMessage: string;
  smsUnavailableOpen: string;
  smsUnavailableTitle: string;
  whatsappLabel: string;
  whatsappUnavailableMessage: string;
  whatsappUnavailableOpen: string;
  whatsappUnavailableTitle: string;
};

const DEFAULT_COUNTRY_CODE = "506";

const sanitizePhoneNumber = (phone: string) => phone.replace(/\D+/g, "");

const buildSmsUrl = (phone: string, message: string) => {
  const separator = Platform.OS === "ios" ? "&" : "?";
  return `sms:${phone}${separator}body=${encodeURIComponent(message)}`;
};

const buildMessage = (labels: ContactActionLabels, clientName?: string) => {
  if (!clientName) {
    return labels.hello;
  }

  return labels.helloName.replace("%{name}", clientName);
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

export const openClientPhoneCall = async (
  phone: string,
  labels: ContactActionLabels,
) => {
  const digits = sanitizePhoneNumber(phone);

  if (!digits) {
    Alert.alert(labels.callUnavailableTitle, labels.callUnavailableMessage);
    return;
  }

  try {
    await openUrl(
      `tel:${digits}`,
      labels.callUnavailableTitle,
      labels.callUnavailableOpen,
    );
  } catch {
    Alert.alert(labels.callUnavailableTitle, labels.callUnavailableOpen);
  }
};

const openClientSms = async (
  phone: string,
  labels: ContactActionLabels,
  clientName?: string,
) => {
  const digits = sanitizePhoneNumber(phone);

  if (!digits) {
    Alert.alert(labels.smsUnavailableTitle, labels.smsUnavailableMessage);
    return;
  }

  try {
    await openUrl(
      buildSmsUrl(digits, buildMessage(labels, clientName)),
      labels.smsUnavailableTitle,
      labels.smsUnavailableOpen,
    );
  } catch {
    Alert.alert(labels.smsUnavailableTitle, labels.smsUnavailableOpen);
  }
};

const openClientWhatsApp = async (
  phone: string,
  labels: ContactActionLabels,
  clientName?: string,
) => {
  const whatsappPhone = buildWhatsAppPhoneNumber(phone);

  if (!whatsappPhone) {
    Alert.alert(labels.whatsappUnavailableTitle, labels.whatsappUnavailableMessage);
    return;
  }

  const url = `whatsapp://send?phone=${whatsappPhone}&text=${encodeURIComponent(buildMessage(labels, clientName))}`;

  try {
    await openUrl(
      url,
      labels.whatsappUnavailableTitle,
      labels.whatsappUnavailableOpen,
    );
  } catch {
    Alert.alert(
      labels.whatsappUnavailableTitle,
      labels.whatsappUnavailableOpen,
    );
  }
};

export const openClientMessagePicker = (
  phone: string,
  labels: ContactActionLabels,
  clientName?: string,
) => {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        cancelButtonIndex: 0,
        message: labels.chooseContactMethod,
        options: [labels.cancel, labels.whatsappLabel, labels.smsLabel],
        title: labels.sendMessage,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          void openClientWhatsApp(phone, labels, clientName);
        }

        if (buttonIndex === 2) {
          void openClientSms(phone, labels, clientName);
        }
      },
    );

    return;
  }

  Alert.alert(labels.sendMessage, labels.chooseContactMethod, [
    {
      style: "cancel",
      text: labels.cancel,
    },
    {
      onPress: () => {
        void openClientWhatsApp(phone, labels, clientName);
      },
      text: labels.whatsappLabel,
    },
    {
      onPress: () => {
        void openClientSms(phone, labels, clientName);
      },
      text: labels.smsLabel,
    },
  ]);
};
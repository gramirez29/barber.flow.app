import { useCallback, useState } from "react";
import type { Client } from "../../types/clients";

export const PAYMENT_METHODS = [
  "None",
  "Sinpe Movil",
  "Transfer",
  "Cash",
] as const;

export const getClientPaymentMethodLabel = (
  paymentMethod: (typeof PAYMENT_METHODS)[number],
  translateText: (key: string) => string,
) => {
  switch (paymentMethod) {
    case "Cash":
      return translateText("clients.paymentMethods.cash");
    case "Sinpe Movil":
      return translateText("clients.paymentMethods.sinpeMovil");
    case "Transfer":
      return translateText("clients.paymentMethods.transfer");
    default:
      return translateText("clients.paymentMethods.none");
  }
};

export type ClientFormErrors = Partial<
  Record<"firstName" | "lastName" | "phone" | "email", string>
>;

export type ClientTouchedFields = Partial<Record<keyof Client, boolean>>;

export const createEmptyClient = (): Client => ({
  firstName: "",
  lastName: "",
  phone: "",
  email: undefined,
  address: "",
  birthday: undefined,
  preferences: "",
  paymentMethod: "None",
  active: true,
});

export const validateClientField = (key: keyof Client, value: Client[keyof Client]) => {
  if (key === "firstName") {
    if (!value || !String(value).trim()) {
      return "validation.nameRequired";
    }

    return undefined;
  }

  if (key === "lastName") {
    if (!value || !String(value).trim()) {
      return "validation.lastNameRequired";
    }

    return undefined;
  }

  if (key === "phone") {
    if (!value || !String(value).trim()) {
      return "validation.phoneRequired";
    }

    if (!/^\d{4}-\d{4}$/.test(String(value))) {
      return "validation.phoneFormat";
    }

    return undefined;
  }

  if (key === "email") {
    if (!value) {
      return undefined;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(String(value).trim())) {
      return "validation.invalidEmail";
    }

    return undefined;
  }

  return undefined;
};

export const buildClientValidationErrors = (client: Client): ClientFormErrors => ({
  firstName: validateClientField("firstName", client.firstName),
  lastName: validateClientField("lastName", client.lastName),
  phone: validateClientField("phone", client.phone),
  email: validateClientField("email", client.email),
});

export const useClientForm = () => {
  const [client, setClient] = useState<Client>(createEmptyClient());
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [touched, setTouched] = useState<ClientTouchedFields>({});

  const setField = useCallback(<K extends keyof Client>(key: K, value: Client[K]) => {
    setClient((currentClient) => ({
      ...currentClient,
      [key]: value,
    }));

    const error = validateClientField(key, value);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: error,
    }));
  }, []);

  const onBlurField = useCallback((key: keyof Client) => {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [key]: true,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: validateClientField(key, client[key]),
    }));
  }, [client]);

  const validateBeforeSubmit = useCallback(() => {
    const nextErrors = buildClientValidationErrors(client);

    setErrors(nextErrors);
    setTouched({
      firstName: true,
      lastName: true,
      phone: true,
      email: Boolean(client.email),
    });

    return nextErrors;
  }, [client]);

  const resetForm = useCallback(() => {
    setClient(createEmptyClient());
    setErrors({});
    setTouched({});
  }, []);

  const loadClient = useCallback((nextClient: Client) => {
    setClient(nextClient);
    setErrors(buildClientValidationErrors(nextClient));
    setTouched({});
  }, []);

  const isFormValid =
    !validateClientField("firstName", client.firstName) &&
    !validateClientField("lastName", client.lastName) &&
    !validateClientField("phone", client.phone);

  return {
    client,
    errors,
    touched,
    isFormValid,
    loadClient,
    onBlurField,
    resetForm,
    setClient,
    setErrors,
    setField,
    setTouched,
    validateBeforeSubmit,
  };
};
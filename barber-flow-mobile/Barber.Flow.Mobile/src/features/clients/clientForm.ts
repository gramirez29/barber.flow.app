import { useState } from "react";
import type { Client } from "../../types/clients";

export const PAYMENT_METHODS = [
  "None",
  "Sinpe Movil",
  "Transfer",
  "Cash",
] as const;

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
      return "First name is required";
    }

    return undefined;
  }

  if (key === "lastName") {
    if (!value || !String(value).trim()) {
      return "Last name is required";
    }

    return undefined;
  }

  if (key === "phone") {
    if (!value || !String(value).trim()) {
      return "Phone is required";
    }

    if (!/^\d{4}-\d{4}$/.test(String(value))) {
      return "Phone must be 0000-0000";
    }

    return undefined;
  }

  if (key === "email") {
    if (!value) {
      return undefined;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(String(value).trim())) {
      return "Invalid email address";
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

  const setField = <K extends keyof Client>(key: K, value: Client[K]) => {
    setClient((currentClient) => ({
      ...currentClient,
      [key]: value,
    }));

    const error = validateClientField(key, value);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: error,
    }));
  };

  const onBlurField = (key: keyof Client) => {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [key]: true,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: validateClientField(key, client[key]),
    }));
  };

  const validateBeforeSubmit = () => {
    const nextErrors = buildClientValidationErrors(client);

    setErrors(nextErrors);
    setTouched({
      firstName: true,
      lastName: true,
      phone: true,
      email: Boolean(client.email),
    });

    return nextErrors;
  };

  const resetForm = () => {
    setClient(createEmptyClient());
    setErrors({});
    setTouched({});
  };

  const loadClient = (nextClient: Client) => {
    setClient(nextClient);
    setErrors(buildClientValidationErrors(nextClient));
    setTouched({});
  };

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
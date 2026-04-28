import { useState } from "react";
import {
	ApplicationUserSettingsForm,
	BarberApiResponse,
} from "../../types/settings";
import {
	formatPhoneNumber,
	validateEmail,
	validateRequiredField,
} from "../../utils/formatUtil";

export type ApplicationUserFormErrors = Partial<
	Record<
		| "userName"
		| "userEmail"
		| "barberName"
		| "barberPhone"
		| "shopName"
		| "shopPhone"
		| "address"
		| "password",
		string
	>
>;

export type ApplicationUserFormTouched = Partial<
	Record<keyof ApplicationUserSettingsForm, boolean>
>;

export const createEmptyApplicationUserForm = (
	barberId?: string,
): ApplicationUserSettingsForm => ({
	address: "",
	barberId,
	barberName: "",
	barberPhone: "",
	password: "",
	profilePhotoUrl: "",
	shopName: "",
	shopPhone: "",
	userEmail: "",
	userName: "",
	userPhone: "",
});

export const mapBarberResponseToForm = (
	response: BarberApiResponse,
): ApplicationUserSettingsForm => ({
	address: response.address ?? "",
	barberId: response.id,
	barberName: response.barberName,
	barberPhone: response.barberPhone,
	password: "",
	profilePhotoUrl: response.photoUrl ?? "",
	shopName: response.shopName ?? "",
	shopPhone: response.shopPhone ?? "",
	userEmail: response.userEmail,
	userName: response.userName,
	userPhone: response.userPhone,
});

const validatePhoneField = (value: string, requiredKey: string, formatKey: string) => {
	if (validateRequiredField(value)) {
		return requiredKey;
	}

	if (!/^\d{4}-\d{4}$/.test(value)) {
		return formatKey;
	}

	return undefined;
};

export const validateApplicationUserField = (
	key: keyof ApplicationUserSettingsForm,
	value: ApplicationUserSettingsForm[keyof ApplicationUserSettingsForm],
	mode: "create" | "edit",
) => {
	if (key === "userName") {
		return validateRequiredField(String(value ?? ""))
			? "validation.usernameRequired"
			: undefined;
	}

	if (key === "userEmail") {
		return validateEmail(String(value ?? ""));
	}

	if (key === "barberName") {
		return validateRequiredField(String(value ?? ""))
			? "validation.barberNameRequired"
			: undefined;
	}

	if (key === "barberPhone") {
		return validatePhoneField(
			String(value ?? ""),
			"validation.barberPhoneRequired",
			"validation.barberPhoneFormat",
		);
	}

	if (key === "shopName") {
		return validateRequiredField(String(value ?? ""))
			? "validation.shopNameRequired"
			: undefined;
	}

	if (key === "shopPhone") {
		return validatePhoneField(
			String(value ?? ""),
			"validation.shopPhoneRequired",
			"validation.shopPhoneFormat",
		);
	}

	if (key === "address") {
		return validateRequiredField(String(value ?? ""))
			? "validation.addressRequired"
			: undefined;
	}

	if (key === "password") {
		if (mode === "edit" && !String(value ?? "").trim()) {
			return undefined;
		}

		if (validateRequiredField(String(value ?? ""))) {
			return "validation.passwordRequired";
		}

		if (String(value).trim().length < 6) {
			return "validation.passwordLength";
		}
	}

	return undefined;
};

export const buildApplicationUserErrors = (
	values: ApplicationUserSettingsForm,
	mode: "create" | "edit",
): ApplicationUserFormErrors => ({
	address: validateApplicationUserField("address", values.address, mode),
	barberName: validateApplicationUserField("barberName", values.barberName, mode),
	barberPhone: validateApplicationUserField("barberPhone", values.barberPhone, mode),
	password: validateApplicationUserField("password", values.password, mode),
	shopName: validateApplicationUserField("shopName", values.shopName, mode),
	shopPhone: validateApplicationUserField("shopPhone", values.shopPhone, mode),
	userEmail: validateApplicationUserField("userEmail", values.userEmail, mode),
	userName: validateApplicationUserField("userName", values.userName, mode),
});

export const useApplicationUsersForm = () => {
	const [values, setValues] = useState<ApplicationUserSettingsForm>(
		createEmptyApplicationUserForm(),
	);
	const [errors, setErrors] = useState<ApplicationUserFormErrors>({});
	const [touched, setTouched] = useState<ApplicationUserFormTouched>({});
	const [mode, setMode] = useState<"create" | "edit">("create");

	const setField = <K extends keyof ApplicationUserSettingsForm>(
		key: K,
		value: ApplicationUserSettingsForm[K],
	) => {
		const normalizedValue =
			key === "barberPhone" || key === "shopPhone" || key === "userPhone"
				? (formatPhoneNumber(String(value ?? "")) as ApplicationUserSettingsForm[K])
				: value;

		setValues((currentValues) => {
			const nextValues = {
				...currentValues,
				[key]: normalizedValue,
			};

			if (key === "barberPhone") {
				nextValues.userPhone = String(normalizedValue ?? "");
			}

			return nextValues;
		});

		setErrors((currentErrors) => ({
			...currentErrors,
			[key]: validateApplicationUserField(key, normalizedValue, mode),
		}));
	};

	const onBlurField = (key: keyof ApplicationUserSettingsForm) => {
		setTouched((currentTouched) => ({
			...currentTouched,
			[key]: true,
		}));

		setErrors((currentErrors) => ({
			...currentErrors,
			[key]: validateApplicationUserField(key, values[key], mode),
		}));
	};

	const loadValues = (
		nextValues: ApplicationUserSettingsForm,
		nextMode: "create" | "edit",
	) => {
		setValues(nextValues);
		setMode(nextMode);
		setErrors(buildApplicationUserErrors(nextValues, nextMode));
		setTouched({});
	};

	const resetValues = (barberId?: string) => {
		setValues(createEmptyApplicationUserForm(barberId));
		setMode("create");
		setErrors({});
		setTouched({});
	};

	const validateBeforeSubmit = () => {
		const nextErrors = buildApplicationUserErrors(values, mode);

		setErrors(nextErrors);
		setTouched({
			address: true,
			barberName: true,
			barberPhone: true,
			password: true,
			shopName: true,
			shopPhone: true,
			userEmail: true,
			userName: true,
		});

		return nextErrors;
	};

	const isFormValid =
		!validateApplicationUserField("userName", values.userName, mode) &&
		!validateApplicationUserField("userEmail", values.userEmail, mode) &&
		!validateApplicationUserField("barberName", values.barberName, mode) &&
		!validateApplicationUserField("barberPhone", values.barberPhone, mode) &&
		!validateApplicationUserField("shopName", values.shopName, mode) &&
		!validateApplicationUserField("shopPhone", values.shopPhone, mode) &&
		!validateApplicationUserField("address", values.address, mode) &&
		!validateApplicationUserField("password", values.password, mode);

	return {
		errors,
		isFormValid,
		loadValues,
		mode,
		onBlurField,
		resetValues,
		setField,
		setMode,
		touched,
		validateBeforeSubmit,
		values,
	};
};

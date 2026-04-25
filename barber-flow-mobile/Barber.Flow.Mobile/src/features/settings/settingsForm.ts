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
		"userName" | "userPhone" | "userEmail" | "barberName" | "barberPhone",
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
	userEmail: response.userEmail,
	userName: response.userName,
	userPhone: response.userPhone,
});

export const validateApplicationUserField = (
	key: keyof ApplicationUserSettingsForm,
	value: ApplicationUserSettingsForm[keyof ApplicationUserSettingsForm],
) => {
	if (key === "userName") {
		return validateRequiredField(String(value ?? ""))
			? "validation.nameRequired"
			: undefined;
	}

	if (key === "userPhone") {
		if (validateRequiredField(String(value ?? ""))) {
			return "validation.phoneRequired";
		}

		if (!/^\d{4}-\d{4}$/.test(String(value ?? ""))) {
			return "validation.phoneFormat";
		}

		return undefined;
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
		if (validateRequiredField(String(value ?? ""))) {
			return "validation.barberPhoneRequired";
		}

		if (!/^\d{4}-\d{4}$/.test(String(value ?? ""))) {
			return "validation.barberPhoneFormat";
		}

		return undefined;
	}

	return undefined;
};

export const buildApplicationUserErrors = (
	values: ApplicationUserSettingsForm,
): ApplicationUserFormErrors => ({
	barberName: validateApplicationUserField("barberName", values.barberName),
	barberPhone: validateApplicationUserField("barberPhone", values.barberPhone),
	userEmail: validateApplicationUserField("userEmail", values.userEmail),
	userName: validateApplicationUserField("userName", values.userName),
	userPhone: validateApplicationUserField("userPhone", values.userPhone),
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
			key === "userPhone" || key === "barberPhone"
				? (formatPhoneNumber(
					String(value ?? ""),
				) as ApplicationUserSettingsForm[K])
				: value;

			setValues((currentValues) => ({
			...currentValues,
			[key]: normalizedValue,
			}));

			setErrors((currentErrors) => ({
			...currentErrors,
			[key]: validateApplicationUserField(key, normalizedValue),
			}));
	};

	const onBlurField = (key: keyof ApplicationUserSettingsForm) => {
		setTouched((currentTouched) => ({
		...currentTouched,
		[key]: true,
		}));

		setErrors((currentErrors) => ({
		...currentErrors,
		[key]: validateApplicationUserField(key, values[key]),
		}));
	};

	const loadValues = (
		nextValues: ApplicationUserSettingsForm,
		nextMode: "create" | "edit",
	) => {
		setValues(nextValues);
		setMode(nextMode);
		setErrors(buildApplicationUserErrors(nextValues));
		setTouched({});
	};

	const resetValues = (barberId?: string) => {
		setValues(createEmptyApplicationUserForm(barberId));
		setMode("create");
		setErrors({});
		setTouched({});
	};

	const validateBeforeSubmit = () => {
		const nextErrors = buildApplicationUserErrors(values);

		setErrors(nextErrors);
		setTouched({
			barberName: true,
			barberPhone: true,
			userEmail: true,
			userName: true,
			userPhone: true,
		});

		return nextErrors;
	};

	const isFormValid =
		!validateApplicationUserField("userName", values.userName) &&
		!validateApplicationUserField("userPhone", values.userPhone) &&
		!validateApplicationUserField("userEmail", values.userEmail) &&
		!validateApplicationUserField("barberName", values.barberName) &&
		!validateApplicationUserField("barberPhone", values.barberPhone);

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

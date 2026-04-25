import { useEffect, useMemo, useState } from "react";
import type { Appointment, AppointmentDraft } from "./appointments.types";
import { validateRequiredField } from "../../utils/formatUtil";

export interface AppointmentFormErrors {
	clientName?: string;
	paymentMethodUsed?: string;
	phone?: string;
	servicePrice?: string;
	time?: string;
}

export const emptyDraft = (date: string): AppointmentDraft => ({
	clientName: "",
	completedAt: undefined,
	phone: "",
	date,
	paymentMethodUsed: undefined,
	servicePrice: undefined,
	time: "",
	serviceName: "",
	notes: "",
	status: "scheduled",
});

export const buildCreateDraft = (
	date: string,
	initialDraft?: Partial<AppointmentDraft>,
): AppointmentDraft => ({
	...emptyDraft(date),
	...initialDraft,
	date,
	status: initialDraft?.status ?? "scheduled",
});

export const validateAppointmentField = (
	key: keyof AppointmentDraft,
	value: string | number | undefined,
): string | undefined => {
	if (key === "clientName") {
		return validateRequiredField(String(value ?? ""))
			? "validation.appointmentClientNameRequired"
			: undefined;
	}

	if (key === "phone") {
		const normalizedPhone = String(value ?? "");

		if (validateRequiredField(normalizedPhone)) {
			return "validation.phoneRequired";
		}

		if (!/^\d{4}-\d{4}$/.test(normalizedPhone)) {
			return "validation.phoneFormat";
		}

		return undefined;
	}

	if (key === "time") {
		return validateRequiredField(String(value ?? ""))
			? "validation.appointmentTimeRequired"
			: undefined;
	}

	if (key === "servicePrice") {
		if (value === undefined || value === "") {
			return "validation.appointmentServicePriceRequired";
		}

		const parsedValue = Number(value);

		if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
			return "validation.appointmentServicePricePositive";
		}

		return undefined;
	}

	if (key === "paymentMethodUsed") {
		return validateRequiredField(String(value ?? ""))
			? "validation.appointmentPaymentMethodRequired"
			: undefined;
	}

	return undefined;
};

const hydrateFromAppointment = (appointment: Appointment): AppointmentDraft => ({
	clientName: appointment.clientName,
	completedAt: appointment.completedAt,
	phone: appointment.phone,
	date: appointment.date,
	paymentMethodUsed: appointment.paymentMethodUsed,
	servicePrice: appointment.servicePrice,
	time: appointment.time,
	serviceName: appointment.serviceName ?? "",
	notes: appointment.notes ?? "",
	status: appointment.status,
});

const normalizeDraftForSave = (
	draft: AppointmentDraft,
	date: string,
	editingAppointment?: Appointment | null,
): AppointmentDraft => ({
	...draft,
	clientName: draft.clientName.trim(),
	completedAt:
		draft.status === "completed"
		? editingAppointment?.completedAt ?? new Date().toISOString()
		: undefined,
	paymentMethodUsed: draft.paymentMethodUsed,
	serviceName: draft.serviceName?.trim() || undefined,
	servicePrice: draft.servicePrice,
	notes: draft.notes?.trim() || undefined,
	date,
});

export interface UseAppointmentFormArgs {
	date: string;
	editingAppointment?: Appointment | null;
	initialDraft?: Partial<AppointmentDraft>;
	enabled?: boolean;
}

export const useAppointmentForm = ({
	date,
	editingAppointment,
	initialDraft,
	enabled = true,
}: UseAppointmentFormArgs) => {
	const [draft, setDraft] = useState<AppointmentDraft>(() => emptyDraft(date));
	const [errors, setErrors] = useState<AppointmentFormErrors>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (!enabled) {
			return;
		}

		if (editingAppointment) {
			setDraft(hydrateFromAppointment(editingAppointment));
		} else {
			setDraft(buildCreateDraft(date, initialDraft));
		}

		setErrors({});
		setTouched({});
	}, [date, editingAppointment, enabled, initialDraft]);

	const setField = <K extends keyof AppointmentDraft>(
		key: K,
		value: AppointmentDraft[K],
	) => {
		setDraft((currentDraft) => ({
			...currentDraft,
			[key]: value,
		}));

		if (
			key === "clientName" ||
			key === "phone" ||
			key === "time" ||
			key === "servicePrice" ||
			key === "paymentMethodUsed"
		) {
			const nextError = validateAppointmentField(key, String(value ?? ""));
			setErrors((currentErrors) => ({
				...currentErrors,
				[key]: nextError,
			}));
		}
	};

	const onBlurField = (key: keyof AppointmentDraft) => {
		setTouched((currentTouched) => ({
			...currentTouched,
			[key]: true,
		}));

		if (
			key === "clientName" ||
			key === "phone" ||
			key === "time" ||
			key === "servicePrice" ||
			key === "paymentMethodUsed"
		) {
			const nextError = validateAppointmentField(key, String(draft[key] ?? ""));
			setErrors((currentErrors) => ({
				...currentErrors,
				[key]: nextError,
			}));
		}
	};

	const validateBeforeSubmit = () => {
		const nextErrors: AppointmentFormErrors = {
			clientName: validateAppointmentField("clientName", draft.clientName),
			paymentMethodUsed: validateAppointmentField(
				"paymentMethodUsed",
				draft.paymentMethodUsed,
			),
			phone: validateAppointmentField("phone", draft.phone),
			servicePrice: validateAppointmentField("servicePrice", draft.servicePrice),
			time: validateAppointmentField("time", draft.time),
		};

		setErrors(nextErrors);
		setTouched({
			clientName: true,
			paymentMethodUsed: true,
			phone: true,
			servicePrice: true,
			time: true,
		});

		return nextErrors;
	};

	const isValid = useMemo(() => {
		return !(
			errors.clientName ||
			errors.phone ||
			errors.time ||
			errors.servicePrice ||
			errors.paymentMethodUsed
		);
	}, [errors]);

	const submit = (options?: { editingAppointment?: Appointment | null }) => {
		const nextErrors = validateBeforeSubmit();

		if (
			nextErrors.clientName ||
			nextErrors.phone ||
			nextErrors.time ||
			nextErrors.servicePrice ||
			nextErrors.paymentMethodUsed
		) {
			return null;
		}

		return normalizeDraftForSave(draft, date, options?.editingAppointment);
	};

	return {
		draft,
		errors,
		touched,
		isValid,
		onBlurField,
		setField,
		setTouched,
		setErrors,
		submit,
	};
};



/// Formats a phone number by removing non-digit characters and inserting a hyphen after the first four digits.
export const formatPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D+/g, "").slice(0, 8);

    if (digits.length <= 4) {
        return digits;
    }

    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export const validateEmail = (email?: string) => {
    if (!email) {
        return 'validation.emailRequired';
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) ? undefined : 'validation.invalidEmail';
}

export const validateRequiredField = (field?: string) => {
    if (!field || !String(field).trim()) {
        return 'validation.required';
    }
    return undefined;
}
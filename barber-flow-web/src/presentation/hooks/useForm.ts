import { useState, useCallback } from 'react';
import { ZodSchema, ZodError } from 'zod';

export interface FormErrors {
  [key: string]: string;
}

export interface UseFormReturn<T> {
  values: T;
  errors: FormErrors;
  isValidating: boolean;
  isDirty: boolean;
  setValues: (values: T | ((prev: T) => T)) => void;
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearFieldError: (field: keyof T) => void;
  clearErrors: () => void;
  validate: () => Promise<boolean>;
  reset: (values?: T) => void;
  touched: Set<keyof T>;
  setFieldTouched: (field: keyof T, isTouched?: boolean) => void;
}

export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  schema?: ZodSchema
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isValidating, setIsValidating] = useState(false);
  const [touched, setTouched] = useState<Set<keyof T>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  const setFieldValue = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
      // Clear error when user starts typing
      if (errors[String(field)]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[String(field)];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [String(field)]: error }));
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[String(field)];
      return newErrors;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setFieldTouched = useCallback(
    (field: keyof T, isTouched = true) => {
      if (isTouched) {
        setTouched((prev) => new Set([...prev, field]));
      } else {
        setTouched((prev) => {
          const newTouched = new Set(prev);
          newTouched.delete(field);
          return newTouched;
        });
      }
    },
    []
  );

  const validate = useCallback(async (): Promise<boolean> => {
    if (!schema) {
      return true;
    }

    setIsValidating(true);
    try {
      await schema.parseAsync(values);
      setErrors({});
      setIsValidating(false);
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
        // Marca como "touched" los campos con error para que se muestren
        // aunque el usuario nunca haya interactuado con ellos (p. ej. validaciones
        // a nivel de objeto, como fecha+hora combinadas).
        setTouched((prev) => new Set([...prev, ...(Object.keys(newErrors) as (keyof T)[])]));
      }
      setIsValidating(false);
      return false;
    }
  }, [schema, values]);

  const reset = useCallback((newValues?: T) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched(new Set());
    setIsDirty(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isValidating,
    isDirty,
    setValues,
    setFieldValue,
    setFieldError,
    clearFieldError,
    clearErrors,
    validate,
    reset,
    touched,
    setFieldTouched,
  };
}

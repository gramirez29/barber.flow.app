import { useCallback, useState } from "react";
import { DEFAULT_REPORT_CALCULATION_SETTINGS, type ReportCalculationSettings } from "../../types/settings";

export type ReportCalculationSettingErrors = Partial<
  Record<keyof ReportCalculationSettings, string>
>;

export type ReportCalculationSettingTouched = Partial<
  Record<keyof ReportCalculationSettings, boolean>
>;

const validateRangeValue = (
  value: number,
  minimum: number,
  maximum?: number,
) => {
  if (!Number.isFinite(value)) {
    return false;
  }

  if (value < minimum) {
    return false;
  }

  if (maximum !== undefined && value > maximum) {
    return false;
  }

  return true;
};

export const validateReportCalculationField = (
  key: keyof ReportCalculationSettings,
  value: number,
) => {
  if (key === "commissionPercentage") {
    return validateRangeValue(value, 0, 100)
      ? undefined
      : "validation.commissionPercentageRange";
  }

  if (key === "fixedDailyExpense") {
    return validateRangeValue(value, 0)
      ? undefined
      : "validation.fixedDailyExpenseRange";
  }

  return undefined;
};

const buildErrors = (
  values: ReportCalculationSettings,
): ReportCalculationSettingErrors => ({
  commissionPercentage: validateReportCalculationField(
    "commissionPercentage",
    values.commissionPercentage,
  ),
  fixedDailyExpense: validateReportCalculationField(
    "fixedDailyExpense",
    values.fixedDailyExpense,
  ),
});

export const useReportCalculationSettingsForm = () => {
  const [errors, setErrors] = useState<ReportCalculationSettingErrors>({});
  const [touched, setTouched] = useState<ReportCalculationSettingTouched>({});
  const [values, setValues] = useState<ReportCalculationSettings>(
    DEFAULT_REPORT_CALCULATION_SETTINGS,
  );

  const setField = useCallback(
    <K extends keyof ReportCalculationSettings>(
      key: K,
      value: ReportCalculationSettings[K],
    ) => {
      setValues((currentValues) => ({
        ...currentValues,
        [key]: value,
      }));

      setErrors((currentErrors) => ({
        ...currentErrors,
        [key]: validateReportCalculationField(key, Number(value)),
      }));
    },
    [],
  );

  const onBlurField = useCallback((key: keyof ReportCalculationSettings) => {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [key]: true,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: validateReportCalculationField(key, values[key]),
    }));
  }, [values]);

  const loadValues = useCallback((nextValues: ReportCalculationSettings) => {
    setValues(nextValues);
    setErrors(buildErrors(nextValues));
    setTouched({});
  }, []);

  const resetValues = useCallback((nextValues: ReportCalculationSettings) => {
    setValues(nextValues);
    setErrors({});
    setTouched({});
  }, []);

  const validateBeforeSubmit = useCallback(() => {
    const nextErrors = buildErrors(values);

    setErrors(nextErrors);
    setTouched({
      commissionPercentage: true,
      fixedDailyExpense: true,
    });

    return nextErrors;
  }, [values]);

  return {
    errors,
    loadValues,
    onBlurField,
    resetValues,
    setField,
    touched,
    validateBeforeSubmit,
    values,
  };
};
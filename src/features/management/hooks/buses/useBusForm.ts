import { useCallback, useMemo, useState } from "react";
import type {
  BusApiData,
  CreateBusPayload,
  UpdateBusPayload,
} from "../../types";

export type BusFormMode = "create" | "edit" | null;

export type BusFormValues = {
  duration: string;
  endTime: string;
  location: string;
  startTime: string;
};

export type BusFormValidationMessages = {
  durationRequired: string;
  endTimeRequired: string;
  invalidDuration: string;
  invalidTime: string;
  locationRequired: string;
  locationTooLong: string;
  startTimeRequired: string;
};

type UseBusFormOptions = {
  validationMessages: BusFormValidationMessages;
};

function getInitialFormValues(bus?: BusApiData): BusFormValues {
  return {
    duration: bus?.duration == null ? "" : String(bus.duration),
    endTime: bus?.end_time ?? "",
    location: bus?.location ?? "",
    startTime: bus?.start_time ?? "",
  };
}

function normalizeTime(value: string) {
  const trimmedValue = value.trim();

  if (/^\d{2}:\d{2}$/.test(trimmedValue)) {
    return `${trimmedValue}:00`;
  }

  return trimmedValue;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value);
}

export function useBusForm({ validationMessages }: UseBusFormOptions) {
  const [mode, setMode] = useState<BusFormMode>(null);
  const [selectedBus, setSelectedBus] = useState<BusApiData | null>(null);
  const [values, setValues] = useState<BusFormValues>(getInitialFormValues());
  const [validationError, setValidationError] = useState("");

  const isOpen = mode !== null;

  const openCreate = useCallback(() => {
    setMode("create");
    setSelectedBus(null);
    setValues(getInitialFormValues());
    setValidationError("");
  }, []);

  const openEdit = useCallback((bus: BusApiData) => {
    setMode("edit");
    setSelectedBus(bus);
    setValues(getInitialFormValues(bus));
    setValidationError("");
  }, []);

  const closeForm = useCallback(() => {
    setMode(null);
    setSelectedBus(null);
    setValues(getInitialFormValues());
    setValidationError("");
  }, []);

  const updateField = useCallback(
    (field: keyof BusFormValues, value: string) => {
      setValidationError("");
      setValues((currentValues) => ({ ...currentValues, [field]: value }));
    },
    [],
  );

  const clearValidationError = useCallback(() => {
    setValidationError("");
  }, []);

  const validate = useCallback(() => {
    const location = values.location.trim();
    const rawDuration = values.duration.trim();
    const duration = Number(rawDuration);
    const startTime = normalizeTime(values.startTime);
    const endTime = normalizeTime(values.endTime);

    if (!location) {
      setValidationError(validationMessages.locationRequired);
      return null;
    }

    if (location.length > 255) {
      setValidationError(validationMessages.locationTooLong);
      return null;
    }

    if (!startTime) {
      setValidationError(validationMessages.startTimeRequired);
      return null;
    }

    if (!endTime) {
      setValidationError(validationMessages.endTimeRequired);
      return null;
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      setValidationError(validationMessages.invalidTime);
      return null;
    }

    if (!rawDuration) {
      setValidationError(validationMessages.durationRequired);
      return null;
    }

    if (!Number.isInteger(duration) || duration < 1) {
      setValidationError(validationMessages.invalidDuration);
      return null;
    }

    return { duration, end_time: endTime, location, start_time: startTime };
  }, [validationMessages, values]);

  const buildCreatePayload = useCallback((): CreateBusPayload | null => {
    return validate();
  }, [validate]);

  const buildUpdatePayload = useCallback((): UpdateBusPayload | null => {
    return validate();
  }, [validate]);

  const isSaveDisabled = useMemo(
    () =>
      !values.location.trim() ||
      !values.startTime.trim() ||
      !values.endTime.trim() ||
      !values.duration.trim() ||
      !isOpen,
    [isOpen, values],
  );

  return {
    mode,
    selectedBus,
    values,
    validationError,
    isOpen,
    isSaveDisabled,
    openCreate,
    openEdit,
    closeForm,
    updateField,
    clearValidationError,
    buildCreatePayload,
    buildUpdatePayload,
  };
}

import { useCallback, useMemo, useState } from "react";
import type {
  CreateServicePayload,
  ServiceApiData,
  UpdateServicePayload,
} from "../../types";

export type ServiceFormMode = "create" | "edit" | null;

export type ServiceFormValues = {
  isActive: boolean;
  name: string;
  price: string;
};

export type ServiceFormValidationMessages = {
  invalidPrice: string;
  nameRequired: string;
  negativePrice: string;
  priceRequired: string;
  statusRequired: string;
};

type UseServiceFormOptions = {
  validationMessages: ServiceFormValidationMessages;
};

function getInitialFormValues(service?: ServiceApiData): ServiceFormValues {
  return {
    isActive: service?.is_active ?? true,
    name: service?.name ?? "",
    price: service?.price == null ? "" : String(service.price),
  };
}

export function useServiceForm({
  validationMessages,
}: UseServiceFormOptions) {
  const [mode, setMode] = useState<ServiceFormMode>(null);
  const [selectedService, setSelectedService] = useState<ServiceApiData | null>(
    null,
  );
  const [values, setValues] = useState<ServiceFormValues>(
    getInitialFormValues(),
  );
  const [validationError, setValidationError] = useState("");

  const isOpen = mode !== null;

  const openCreate = useCallback(() => {
    setMode("create");
    setSelectedService(null);
    setValues(getInitialFormValues());
    setValidationError("");
  }, []);

  const openEdit = useCallback((service: ServiceApiData) => {
    setMode("edit");
    setSelectedService(service);
    setValues(getInitialFormValues(service));
    setValidationError("");
  }, []);

  const closeForm = useCallback(() => {
    setMode(null);
    setSelectedService(null);
    setValues(getInitialFormValues());
    setValidationError("");
  }, []);

  const updateField = useCallback(
    (field: keyof ServiceFormValues, value: string | boolean) => {
      setValidationError("");
      setValues((currentValues) => ({
        ...currentValues,
        [field]: value,
      }));
    },
    [],
  );

  const clearValidationError = useCallback(() => {
    setValidationError("");
  }, []);

  const validate = useCallback(() => {
    const name = values.name.trim();
    const rawPrice = values.price.trim();
    const price = Number(rawPrice);

    if (!name) {
      setValidationError(validationMessages.nameRequired);
      return null;
    }

    if (!rawPrice) {
      setValidationError(validationMessages.priceRequired);
      return null;
    }

    if (!Number.isFinite(price)) {
      setValidationError(validationMessages.invalidPrice);
      return null;
    }

    if (price < 0) {
      setValidationError(validationMessages.negativePrice);
      return null;
    }

    if (mode === "edit" && typeof values.isActive !== "boolean") {
      setValidationError(validationMessages.statusRequired);
      return null;
    }

    return {
      isActive: values.isActive,
      name,
      price,
    };
  }, [mode, validationMessages, values]);

  const buildCreatePayload = useCallback((): CreateServicePayload | null => {
    const validatedValues = validate();

    if (!validatedValues) {
      return null;
    }

    return {
      name: validatedValues.name,
      price: validatedValues.price,
    };
  }, [validate]);

  const buildUpdatePayload = useCallback((): UpdateServicePayload | null => {
    const validatedValues = validate();

    if (!validatedValues) {
      return null;
    }

    return {
      name: validatedValues.name,
      price: validatedValues.price,
      is_active: validatedValues.isActive,
    };
  }, [validate]);

  const isSaveDisabled = useMemo(
    () => !values.name.trim() || !values.price.trim() || !isOpen,
    [isOpen, values.name, values.price],
  );

  return {
    mode,
    selectedService,
    values,
    validationError,
    isOpen,
    isSaveDisabled,
    openCreate,
    openEdit,
    closeForm,
    updateField,
    clearValidationError,
    validate,
    buildCreatePayload,
    buildUpdatePayload,
  };
}

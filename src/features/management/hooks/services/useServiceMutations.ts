import { useCallback, useState } from "react";
import { createService, updateService } from "../../api";
import type {
  CreateServicePayload,
  ServiceApiData,
  UpdateServicePayload,
} from "../../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

type UseServiceMutationsOptions = {
  onSuccess?: () => Promise<unknown> | unknown;
};

export function useServiceMutations({
  onSuccess,
}: UseServiceMutationsOptions = {}) {
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const createServiceByPayload = useCallback(
    async (payload: CreateServicePayload): Promise<ServiceApiData | null> => {
      setCreateError("");
      setIsCreating(true);

      try {
        const createdService = await createService(payload);
        await onSuccess?.();

        return createdService;
      } catch (serviceError) {
        setCreateError(
          getErrorMessage(serviceError, "Unable to create service."),
        );

        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [onSuccess],
  );

  const updateServiceById = useCallback(
    async (
      serviceId: number,
      payload: UpdateServicePayload,
    ): Promise<ServiceApiData | null> => {
      setUpdateError("");
      setIsUpdating(true);

      try {
        const updatedService = await updateService(serviceId, payload);
        await onSuccess?.();

        return updatedService;
      } catch (serviceError) {
        setUpdateError(
          getErrorMessage(serviceError, "Unable to update service."),
        );

        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [onSuccess],
  );

  const clearMutationErrors = useCallback(() => {
    setCreateError("");
    setUpdateError("");
  }, []);

  return {
    isCreating,
    createError,
    createServiceByPayload,
    isUpdating,
    updateError,
    updateServiceById,
    clearMutationErrors,
  };
}

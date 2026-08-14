import { useCallback, useRef, useState } from "react";
import { createBus, deleteBus, updateBus } from "../../api";
import type {
  BusApiData,
  CreateBusPayload,
  UpdateBusPayload,
} from "../../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

type UseBusMutationsOptions = {
  onSuccess?: () => Promise<unknown> | unknown;
};

export function useBusMutations({
  onSuccess,
}: UseBusMutationsOptions = {}) {
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const isMutationInFlightRef = useRef(false);

  const runMutation = useCallback(async <T,>(
    execute: () => Promise<T>,
    setPending: (isPending: boolean) => void,
    setError: (message: string) => void,
    fallbackError: string,
  ): Promise<T | null> => {
    if (isMutationInFlightRef.current) {
      return null;
    }

    isMutationInFlightRef.current = true;
    setError("");
    setPending(true);

    try {
      const result = await execute();
      await onSuccess?.();

      return result;
    } catch (busError) {
      setError(getErrorMessage(busError, fallbackError));

      return null;
    } finally {
      isMutationInFlightRef.current = false;
      setPending(false);
    }
  }, [onSuccess]);

  const createBusByPayload = useCallback(
    (payload: CreateBusPayload): Promise<BusApiData | null> => {
      return runMutation(
        () => createBus(payload),
        setIsCreating,
        setCreateError,
        "Unable to create bus.",
      );
    },
    [runMutation],
  );

  const updateBusById = useCallback(
    (
      busId: number,
      payload: UpdateBusPayload,
    ): Promise<BusApiData | null> => {
      return runMutation(
        () => updateBus(busId, payload),
        setIsUpdating,
        setUpdateError,
        "Unable to update bus.",
      );
    },
    [runMutation],
  );

  const deleteBusById = useCallback(
    (busId: number): Promise<boolean> => {
      return runMutation(
        async () => {
          await deleteBus(busId);
          return true;
        },
        setIsDeleting,
        setDeleteError,
        "Unable to delete bus.",
      ).then((result) => result === true);
    },
    [runMutation],
  );

  const clearMutationErrors = useCallback(() => {
    setCreateError("");
    setUpdateError("");
    setDeleteError("");
  }, []);

  return {
    isCreating,
    createError,
    createBusByPayload,
    isUpdating,
    updateError,
    updateBusById,
    isDeleting,
    deleteError,
    deleteBusById,
    clearMutationErrors,
  };
}

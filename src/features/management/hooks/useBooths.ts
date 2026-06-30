import { useCallback, useEffect, useRef, useState } from "react";
import { getBooths, updateBooth } from "../api";
import type {
  BoothApiData,
  GetBoothsParams,
  UpdateBoothPayload,
} from "../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

type UseBoothsOptions = {
  enabled?: boolean;
};

export function useBooths({ enabled = true }: UseBoothsOptions = {}) {
  const [booths, setBooths] = useState<BoothApiData[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const hasRequestedBooths = useRef(false);

  const refetch = useCallback(async (params: GetBoothsParams = {}) => {
    setError("");
    setIsLoading(true);

    try {
      const nextBooths = await getBooths(params);
      setBooths(nextBooths);
      return nextBooths;
    } catch (boothsError) {
      setError(getErrorMessage(boothsError, "Unable to load booths."));
      setBooths([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateBoothById = useCallback(
    async (boothId: number, payload: UpdateBoothPayload) => {
      setUpdateError("");
      setIsUpdating(true);

      try {
        const updatedBooth = await updateBooth(boothId, payload);
        setBooths((currentBooths) =>
          currentBooths.map((booth) =>
            booth.id === updatedBooth.id ? updatedBooth : booth,
          ),
        );

        return updatedBooth;
      } catch (boothError) {
        setUpdateError(getErrorMessage(boothError, "Unable to update booth."));
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const clearUpdateError = useCallback(() => {
    setUpdateError("");
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (hasRequestedBooths.current) {
      return;
    }

    hasRequestedBooths.current = true;
    void refetch();
  }, [enabled, refetch]);

  return {
    booths,
    isLoading,
    error,
    refetch,
    updateBoothById,
    updateError,
    isUpdating,
    clearUpdateError,
  };
}

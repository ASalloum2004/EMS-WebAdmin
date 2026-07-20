import { useCallback, useState } from "react";
import type { EventHall, UpdateEventHallPricePayload } from "../types";

type UseEventHallEditingOptions = {
  clearUpdateError: () => void;
  updateEventHallPriceById: (
    eventHallId: number,
    payload: UpdateEventHallPricePayload,
  ) => Promise<EventHall | null>;
};

export function useEventHallEditing({
  clearUpdateError,
  updateEventHallPriceById,
}: UseEventHallEditingOptions) {
  const [selectedEventHall, setSelectedEventHall] =
    useState<EventHall | null>(null);

  const openEditModal = useCallback(
    (eventHall: EventHall) => {
      clearUpdateError();
      setSelectedEventHall(eventHall);
    },
    [clearUpdateError],
  );

  const closeEditModal = useCallback(() => {
    clearUpdateError();
    setSelectedEventHall(null);
  }, [clearUpdateError]);

  const saveEventHallPrice = useCallback(
    async (payload: UpdateEventHallPricePayload) => {
      if (!selectedEventHall) {
        return;
      }

      const updatedEventHall = await updateEventHallPriceById(
        selectedEventHall.id,
        payload,
      );

      if (updatedEventHall) {
        setSelectedEventHall(null);
      }
    },
    [selectedEventHall, updateEventHallPriceById],
  );

  return {
    closeEditModal,
    openEditModal,
    saveEventHallPrice,
    selectedEventHall,
  };
}

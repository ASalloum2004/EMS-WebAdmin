import { useCallback, useState } from "react";
import type { BoothApiData, UpdateBoothPayload } from "../types";

type UseBoothEditingOptions = {
  clearUpdateError: () => void;
  updateBoothById: (
    boothId: number,
    payload: UpdateBoothPayload,
  ) => Promise<BoothApiData | null>;
};

export function useBoothEditing({
  clearUpdateError,
  updateBoothById,
}: UseBoothEditingOptions) {
  const [selectedBooth, setSelectedBooth] = useState<BoothApiData | null>(null);

  const openEditModal = useCallback(
    (booth: BoothApiData) => {
      clearUpdateError();
      setSelectedBooth(booth);
    },
    [clearUpdateError],
  );

  const closeEditModal = useCallback(() => {
    clearUpdateError();
    setSelectedBooth(null);
  }, [clearUpdateError]);

  const saveBooth = useCallback(
    async (payload: UpdateBoothPayload) => {
      if (!selectedBooth) {
        return;
      }

      const updatedBooth = await updateBoothById(selectedBooth.id, payload);

      if (updatedBooth) {
        setSelectedBooth(null);
      }
    },
    [selectedBooth, updateBoothById],
  );

  return {
    closeEditModal,
    openEditModal,
    saveBooth,
    selectedBooth,
  };
}

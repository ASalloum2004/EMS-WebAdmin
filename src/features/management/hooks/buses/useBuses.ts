import { useCallback } from "react";
import type { BusApiData, GetBusesResult } from "../../types";
import { useBusForm, type BusFormValidationMessages } from "./useBusForm";
import { useBusList } from "./useBusList";
import { useBusMutations } from "./useBusMutations";
import { useBusPagination } from "./useBusPagination";
import { useBusSearch } from "./useBusSearch";

const DEFAULT_BUSES_PER_PAGE = 3;

type UseBusesOptions = {
  enabled?: boolean;
  initialPerPage?: number;
  validationMessages: BusFormValidationMessages;
};

export function useBuses({
  enabled = true,
  initialPerPage = DEFAULT_BUSES_PER_PAGE,
  validationMessages,
}: UseBusesOptions) {
  const pagination = useBusPagination({ initialPerPage });
  const search = useBusSearch({ onSearchChange: pagination.resetPage });
  const busForm = useBusForm({ validationMessages });
  const { applyPaginationResult } = pagination;

  const handleBusesResult = useCallback(
    (result: GetBusesResult) => {
      applyPaginationResult({
        itemCount: result.buses.length,
        meta: result.pagination,
      });
    },
    [applyPaginationResult],
  );

  const busesList = useBusList({
    currentPage: pagination.currentPage,
    enabled,
    onResult: handleBusesResult,
    perPage: pagination.perPage,
    searchLocation: search.searchLocation,
  });

  const refreshAfterMutation = useCallback(async () => {
    const result = await busesList.refetch();

    if (!result.buses.length && pagination.currentPage > 1) {
      pagination.setCurrentPage(pagination.currentPage - 1);
    }
  }, [busesList, pagination]);

  const busMutations = useBusMutations({ onSuccess: refreshAfterMutation });

  const clearErrors = useCallback(() => {
    busesList.clearListError();
    busMutations.clearMutationErrors();
    busForm.clearValidationError();
  }, [busForm, busMutations, busesList]);

  const openCreate = useCallback(() => {
    clearErrors();
    busForm.openCreate();
  }, [busForm, clearErrors]);

  const openEdit = useCallback(
    (bus: BusApiData) => {
      clearErrors();
      busForm.openEdit(bus);
    },
    [busForm, clearErrors],
  );

  const closeForm = useCallback(() => {
    clearErrors();
    busForm.closeForm();
  }, [busForm, clearErrors]);

  const submitCreate = useCallback(async () => {
    const payload = busForm.buildCreatePayload();

    if (!payload) {
      return null;
    }

    const createdBus = await busMutations.createBusByPayload(payload);

    if (createdBus) {
      busForm.closeForm();
    }

    return createdBus;
  }, [busForm, busMutations]);

  const submitUpdate = useCallback(async () => {
    const payload = busForm.buildUpdatePayload();

    if (!payload || !busForm.selectedBus) {
      return null;
    }

    const updatedBus = await busMutations.updateBusById(
      busForm.selectedBus.id,
      payload,
    );

    if (updatedBus) {
      busForm.closeForm();
    }

    return updatedBus;
  }, [busForm, busMutations]);

  const submitForm = useCallback(async () => {
    if (busForm.mode === "create") {
      return submitCreate();
    }

    if (busForm.mode === "edit") {
      return submitUpdate();
    }

    return null;
  }, [busForm.mode, submitCreate, submitUpdate]);

  const isSubmitting =
    busMutations.isCreating || busMutations.isUpdating || busMutations.isDeleting;
  const isSaveDisabled = busForm.isSaveDisabled || isSubmitting;
  const formStatusMessage =
    busForm.validationError ||
    busMutations.createError ||
    busMutations.updateError;

  return {
    buses: busesList.buses,
    isLoading: busesList.isLoading,
    isRefreshing: busesList.isRefreshing,
    error: busesList.error,
    refetch: busesList.refetch,
    currentPage: pagination.currentPage,
    setCurrentPage: pagination.setCurrentPage,
    perPage: pagination.perPage,
    setPerPage: pagination.setPerPage,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
    searchLocation: search.searchLocation,
    setSearchLocation: search.setSearchLocation,
    busForm,
    openCreate,
    openEdit,
    closeForm,
    submitForm,
    isSubmitting,
    isSaveDisabled,
    formStatusMessage,
    isDeleting: busMutations.isDeleting,
    deleteError: busMutations.deleteError,
    deleteBusById: busMutations.deleteBusById,
    clearErrors,
  };
}

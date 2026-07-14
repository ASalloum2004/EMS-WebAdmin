import { useCallback } from "react";
import type { GetServicesResult, ServiceApiData } from "../types";
import {
  useServiceForm,
  useServiceFilters,
  useServiceMutations,
  useServicePagination,
  useServiceSearch,
  useServiceSort,
  useServicesList,
  type ServiceFormValidationMessages,
} from "./services";

const DEFAULT_SERVICES_PER_PAGE = 3;

type UseServicesOptions = {
  enabled?: boolean;
  initialPerPage?: number;
  validationMessages: ServiceFormValidationMessages;
  filterValidationMessages: {
    invalidPrice: string;
    minGreaterThanMax: string;
  };
};

export function useServices({
  enabled = true,
  initialPerPage = DEFAULT_SERVICES_PER_PAGE,
  filterValidationMessages,
  validationMessages,
}: UseServicesOptions) {
  const pagination = useServicePagination({ initialPerPage });
  const search = useServiceSearch({ onSearchChange: pagination.resetPage });
  const serviceFilters = useServiceFilters({
    onFiltersChange: pagination.resetPage,
    validationMessages: filterValidationMessages,
  });
  const serviceSort = useServiceSort({ onSortChange: pagination.resetPage });
  const serviceForm = useServiceForm({ validationMessages });
  const { applyPaginationResult } = pagination;

  const handleServicesResult = useCallback(
    (result: GetServicesResult) => {
      applyPaginationResult({
        itemCount: result.services.length,
        meta: result.pagination,
      });
    },
    [applyPaginationResult],
  );

  const servicesList = useServicesList({
    currentPage: pagination.currentPage,
    enabled,
    isActive: serviceFilters.appliedIsActive,
    maxPrice: serviceFilters.appliedMaxPrice,
    minPrice: serviceFilters.appliedMinPrice,
    onResult: handleServicesResult,
    perPage: pagination.perPage,
    searchName: search.searchName,
    sort: serviceSort.sortParam,
  });

  const serviceMutations = useServiceMutations({
    onSuccess: servicesList.refetch,
  });

  const clearErrors = useCallback(() => {
    servicesList.clearListError();
    serviceMutations.clearMutationErrors();
    serviceForm.clearValidationError();
  }, [serviceForm, serviceMutations, servicesList]);

  const openCreate = useCallback(() => {
    clearErrors();
    serviceForm.openCreate();
  }, [clearErrors, serviceForm]);

  const openEdit = useCallback(
    (service: ServiceApiData) => {
      clearErrors();
      serviceForm.openEdit(service);
    },
    [clearErrors, serviceForm],
  );

  const closeForm = useCallback(() => {
    clearErrors();
    serviceForm.closeForm();
  }, [clearErrors, serviceForm]);

  const submitCreate = useCallback(async () => {
    const payload = serviceForm.buildCreatePayload();

    if (!payload) {
      return null;
    }

    const createdService =
      await serviceMutations.createServiceByPayload(payload);

    if (createdService) {
      serviceForm.closeForm();
    }

    return createdService;
  }, [serviceForm, serviceMutations]);

  const submitUpdate = useCallback(async () => {
    const payload = serviceForm.buildUpdatePayload();

    if (!payload || !serviceForm.selectedService) {
      return null;
    }

    const updatedService = await serviceMutations.updateServiceById(
      serviceForm.selectedService.id,
      payload,
    );

    if (updatedService) {
      serviceForm.closeForm();
    }

    return updatedService;
  }, [serviceForm, serviceMutations]);

  const submitForm = useCallback(async () => {
    if (serviceForm.mode === "edit") {
      return submitUpdate();
    }

    if (serviceForm.mode === "create") {
      return submitCreate();
    }

    return null;
  }, [serviceForm.mode, submitCreate, submitUpdate]);

  const isSubmitting =
    serviceMutations.isCreating || serviceMutations.isUpdating;
  const isSaveDisabled = serviceForm.isSaveDisabled || isSubmitting;
  const formStatusMessage =
    serviceForm.validationError ||
    serviceMutations.createError ||
    serviceMutations.updateError;

  return {
    services: servicesList.services,
    isLoading: servicesList.isLoading,
    error: servicesList.error,
    refetch: servicesList.refetch,
    currentPage: pagination.currentPage,
    setCurrentPage: pagination.setCurrentPage,
    perPage: pagination.perPage,
    setPerPage: pagination.setPerPage,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
    searchName: search.searchName,
    setSearchName: search.setSearchName,
    resetSearch: search.resetSearch,
    serviceFilters,
    serviceSort,
    isCreating: serviceMutations.isCreating,
    createError: serviceMutations.createError,
    createServiceByPayload: serviceMutations.createServiceByPayload,
    isUpdating: serviceMutations.isUpdating,
    updateError: serviceMutations.updateError,
    updateServiceById: serviceMutations.updateServiceById,
    clearErrors,
    serviceForm,
    openCreate,
    openEdit,
    closeForm,
    submitCreate,
    submitUpdate,
    submitForm,
    isSubmitting,
    isSaveDisabled,
    formStatusMessage,
  };
}

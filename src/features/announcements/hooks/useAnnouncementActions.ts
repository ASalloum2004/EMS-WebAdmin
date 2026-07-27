import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError } from "../../../api";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from "../api";
import type {
  AnnouncementFieldErrors,
  AnnouncementFormValues,
  AnnouncementUpdateValues,
} from "../types";

interface UseAnnouncementActionsOptions {
  createErrorFallback: string;
  createSuccessFallback: string;
  deleteErrorFallback: string;
  deleteSuccessFallback: string;
  updateErrorFallback: string;
  updateSuccessFallback: string;
}

interface ActionErrorState {
  error: string;
  fieldErrors: AnnouncementFieldErrors;
}

const apiFieldMap = {
  description: "description",
  is_active: "isDraft",
  media: "media",
  receiver: "receiver",
  title: "title",
} as const;

function getFirstMessage(value: unknown) {
  if (Array.isArray(value)) {
    return value.find(
      (message): message is string =>
        typeof message === "string" && Boolean(message.trim()),
    );
  }

  return typeof value === "string" && value.trim() ? value : undefined;
}

function getActionErrorState(
  error: unknown,
  fallbackMessage: string,
): ActionErrorState {
  const fieldErrors: AnnouncementFieldErrors = {};

  if (error instanceof ApiRequestError && error.errors) {
    for (const [apiField, formField] of Object.entries(apiFieldMap)) {
      const message = getFirstMessage(error.errors[apiField]);

      if (message) {
        fieldErrors[formField] = message;
      }
    }
  }

  return {
    error:
      error instanceof Error && error.message.trim()
        ? error.message
        : fallbackMessage,
    fieldErrors,
  };
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useAnnouncementActions(
  options: UseAnnouncementActionsOptions,
) {
  const [createPending, setCreatePending] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [createError, setCreateError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [createFieldErrors, setCreateFieldErrors] =
    useState<AnnouncementFieldErrors>({});
  const [updateFieldErrors, setUpdateFieldErrors] =
    useState<AnnouncementFieldErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const controllersRef = useRef(new Set<AbortController>());
  const isMountedRef = useRef(true);
  const pendingRef = useRef({ create: false, delete: false, update: false });

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      controllersRef.current.forEach((controller) => controller.abort());
      controllersRef.current.clear();
    };
  }, []);

  const runCreate = useCallback(
    async (formValues: AnnouncementFormValues) => {
      if (pendingRef.current.create) {
        return false;
      }

      pendingRef.current.create = true;
      setCreatePending(true);
      setCreateError("");
      setCreateFieldErrors({});
      setSuccessMessage("");
      const controller = new AbortController();
      controllersRef.current.add(controller);

      try {
        const result = await createAnnouncement(
          formValues,
          controller.signal,
        );

        if (isMountedRef.current) {
          setSuccessMessage(
            result.message || options.createSuccessFallback,
          );
        }

        return true;
      } catch (actionError) {
        if (!isAbortError(actionError) && isMountedRef.current) {
          const nextErrorState = getActionErrorState(
            actionError,
            options.createErrorFallback,
          );
          setCreateError(nextErrorState.error);
          setCreateFieldErrors(nextErrorState.fieldErrors);
        }

        return false;
      } finally {
        controllersRef.current.delete(controller);
        pendingRef.current.create = false;
        if (isMountedRef.current) {
          setCreatePending(false);
        }
      }
    },
    [options.createErrorFallback, options.createSuccessFallback],
  );

  const runUpdate = useCallback(
    async (announcementId: number, formValues: AnnouncementUpdateValues) => {
      if (pendingRef.current.update) {
        return false;
      }

      pendingRef.current.update = true;
      setUpdatePending(true);
      setUpdateError("");
      setUpdateFieldErrors({});
      setSuccessMessage("");
      const controller = new AbortController();
      controllersRef.current.add(controller);

      try {
        const result = await updateAnnouncement(
          announcementId,
          formValues,
          controller.signal,
        );

        if (isMountedRef.current) {
          setSuccessMessage(
            result.message || options.updateSuccessFallback,
          );
        }

        return true;
      } catch (actionError) {
        if (!isAbortError(actionError) && isMountedRef.current) {
          const nextErrorState = getActionErrorState(
            actionError,
            options.updateErrorFallback,
          );
          setUpdateError(nextErrorState.error);
          setUpdateFieldErrors(nextErrorState.fieldErrors);
        }

        return false;
      } finally {
        controllersRef.current.delete(controller);
        pendingRef.current.update = false;
        if (isMountedRef.current) {
          setUpdatePending(false);
        }
      }
    },
    [options.updateErrorFallback, options.updateSuccessFallback],
  );

  const runDelete = useCallback(
    async (announcementId: number) => {
      if (pendingRef.current.delete) {
        return false;
      }

      pendingRef.current.delete = true;
      setDeletePending(true);
      setDeleteError("");
      setSuccessMessage("");
      const controller = new AbortController();
      controllersRef.current.add(controller);

      try {
        const result = await deleteAnnouncement(
          announcementId,
          controller.signal,
        );

        if (isMountedRef.current) {
          setSuccessMessage(
            result.message || options.deleteSuccessFallback,
          );
        }

        return true;
      } catch (actionError) {
        if (!isAbortError(actionError) && isMountedRef.current) {
          setDeleteError(
            getActionErrorState(actionError, options.deleteErrorFallback)
              .error,
          );
        }

        return false;
      } finally {
        controllersRef.current.delete(controller);
        pendingRef.current.delete = false;
        if (isMountedRef.current) {
          setDeletePending(false);
        }
      }
    },
    [options.deleteErrorFallback, options.deleteSuccessFallback],
  );

  return {
    clearCreateErrors: () => {
      setCreateError("");
      setCreateFieldErrors({});
    },
    clearDeleteError: () => setDeleteError(""),
    clearSuccessMessage: () => setSuccessMessage(""),
    clearUpdateErrors: () => {
      setUpdateError("");
      setUpdateFieldErrors({});
    },
    createError,
    createFieldErrors,
    createPending,
    deleteError,
    deletePending,
    runCreate,
    runDelete,
    runUpdate,
    successMessage,
    updateError,
    updateFieldErrors,
    updatePending,
  };
}

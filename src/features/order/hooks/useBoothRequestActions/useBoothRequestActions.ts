import { useCallback, useRef } from "react";
import type {
  ApproveBoothRequestConflictState,
  ApproveBoothRequestResult,
  BoothRequestActionResponse,
} from "../../types";
import { useApproveBoothRequest } from "./useApproveBoothRequest";
import { useBoothRequestApprovalConflicts } from "./useBoothRequestApprovalConflicts";
import { useRejectBoothRequest } from "./useRejectBoothRequest";

interface UseBoothRequestActionsOptions {
  approveConflictFallbackMessage?: string;
  approveFallbackMessage?: string;
  onApproveSuccess?: () => Promise<unknown> | unknown;
  onRejectSuccess?: () => Promise<unknown> | unknown;
  rejectFallbackMessage?: string;
}

interface UseBoothRequestActionsResult {
  approveBoothRequestAnyway: () => Promise<ApproveBoothRequestResult | null>;
  approveBoothRequestById: (
    boothRequestId: number,
  ) => Promise<ApproveBoothRequestResult | null>;
  approveConflict: ApproveBoothRequestConflictState | null;
  approveConflictError: string;
  approveError: string;
  clearApproveError: () => void;
  clearRejectError: () => void;
  closeApproveConflict: () => void;
  isApproving: boolean;
  isLoadingApproveConflicts: boolean;
  isRejecting: boolean;
  loadApproveConflictPage: (
    page: number,
  ) => Promise<ApproveBoothRequestResult | null>;
  rejectBoothRequestById: (
    boothRequestId: number,
  ) => Promise<BoothRequestActionResponse | null>;
  rejectError: string;
}

export function useBoothRequestActions({
  approveConflictFallbackMessage = "Unable to load conflicting requests.",
  approveFallbackMessage = "Unable to approve booth request.",
  onApproveSuccess,
  onRejectSuccess,
  rejectFallbackMessage = "Unable to reject booth request.",
}: UseBoothRequestActionsOptions = {}): UseBoothRequestActionsResult {
  const isMutationActiveRef = useRef(false);
  const acquireMutation = useCallback(() => {
    if (isMutationActiveRef.current) {
      return false;
    }

    isMutationActiveRef.current = true;
    return true;
  }, []);
  const releaseMutation = useCallback(() => {
    isMutationActiveRef.current = false;
  }, []);
  const isMutationActive = useCallback(
    () => isMutationActiveRef.current,
    [],
  );
  const conflicts = useBoothRequestApprovalConflicts({
    acquireMutation,
    fallbackMessage: approveConflictFallbackMessage,
    isMutationActive,
    onApproveSuccess,
    releaseMutation,
  });
  const approval = useApproveBoothRequest({
    acquireMutation,
    fallbackMessage: approveFallbackMessage,
    onApproveStart: conflicts.resetApproveConflict,
    onApproveSuccess,
    onConflict: conflicts.openApproveConflict,
    onForcedApprovalStart: conflicts.clearApproveConflictError,
    onForcedApprovalSuccess: conflicts.resetApproveConflict,
    releaseMutation,
  });
  const rejection = useRejectBoothRequest({
    acquireMutation,
    fallbackMessage: rejectFallbackMessage,
    onRejectSuccess,
    releaseMutation,
  });

  const approveBoothRequestAnyway = useCallback(async () => {
    if (!conflicts.approveConflict) {
      return null;
    }

    return approval.approveBoothRequestAnyway(
      conflicts.approveConflict.requestId,
    );
  }, [approval.approveBoothRequestAnyway, conflicts.approveConflict]);

  const closeApproveConflict = useCallback(() => {
    conflicts.closeApproveConflict(approval.clearForcedApproveError);
  }, [
    approval.clearForcedApproveError,
    conflicts.closeApproveConflict,
  ]);

  const loadApproveConflictPage = useCallback(
    (page: number) =>
      conflicts.loadApproveConflictPage(
        page,
        approval.clearForcedApproveError,
      ),
    [
      approval.clearForcedApproveError,
      conflicts.loadApproveConflictPage,
    ],
  );

  return {
    approveBoothRequestAnyway,
    approveBoothRequestById: approval.approveBoothRequestById,
    approveConflict: conflicts.approveConflict,
    approveConflictError:
      approval.forcedApproveError || conflicts.approveConflictError,
    approveError: approval.approveError,
    clearApproveError: approval.clearApproveError,
    clearRejectError: rejection.clearRejectError,
    closeApproveConflict,
    isApproving: approval.isApproving,
    isLoadingApproveConflicts: conflicts.isLoadingApproveConflicts,
    isRejecting: rejection.isRejecting,
    loadApproveConflictPage,
    rejectBoothRequestById: rejection.rejectBoothRequestById,
    rejectError: rejection.rejectError,
  };
}

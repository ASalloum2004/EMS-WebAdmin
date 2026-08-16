import type { ReactNode, RefObject } from "react";
import type { I18nDictionary, SupportedLanguage } from "../../../../i18n";
import type {
  ApproveEventRequestConflictState,
  ApproveEventRequestResult,
  EventRequestActionResponse,
  EventRequestDetails,
  EventRequestOrganizerDetails,
  EventRequestSpeakerDetails,
} from "../../types";

export interface EventRequestDetailsModalProps {
  approveConflict: ApproveEventRequestConflictState | null;
  approveConflictError: string;
  approveError: string;
  details: EventRequestDetails | null;
  error: string;
  isApproving: boolean;
  isLoading: boolean;
  isLoadingApproveConflicts: boolean;
  isRejecting: boolean;
  onApprove: (
    eventRequestId: number,
  ) =>
    | Promise<ApproveEventRequestResult | null>
    | ApproveEventRequestResult
    | null;
  onApproveAnyway: () =>
    | Promise<ApproveEventRequestResult | null>
    | ApproveEventRequestResult
    | null;
  onApproveConflictPageChange: (
    page: number,
  ) =>
    | Promise<ApproveEventRequestResult | null>
    | ApproveEventRequestResult
    | null;
  onClearApproveError: () => void;
  onClearRejectError: () => void;
  onClose: () => void;
  onCloseApproveConflict: () => boolean | void;
  onReject: (
    eventRequestId: number,
  ) =>
    | Promise<EventRequestActionResponse | null>
    | EventRequestActionResponse
    | null;
  onRetry: () => void;
  rejectError: string;
}

export interface EventRequestDetailsHeaderProps {
  details: EventRequestDetails | null;
  error: string;
  isLoading: boolean;
  onClose: () => void;
  t: I18nDictionary;
}

export interface EventRequestInformationSectionProps {
  details: EventRequestDetails;
  language: SupportedLanguage;
  t: I18nDictionary;
}

export interface EventRequestOrganizerSectionProps {
  organizer: EventRequestOrganizerDetails | null;
  t: I18nDictionary;
}

export interface EventRequestSpeakersSectionProps {
  speakers: EventRequestSpeakerDetails[];
  t: I18nDictionary;
}

export interface EventRequestEngagementSectionProps {
  averageRating: number | null;
  language: SupportedLanguage;
  qrScansCount: number | null;
  savedCount: number | null;
  t: I18nDictionary;
}

export interface EventRequestDetailsFooterProps {
  approveButtonRef: RefObject<HTMLButtonElement | null>;
  isApproving: boolean;
  isRejecting: boolean;
  onApprove: () => void;
  onReject: () => void;
  rejectButtonRef: RefObject<HTMLButtonElement | null>;
  status: string | null;
  t: I18nDictionary;
}

export interface EventRequestDetailsStatesProps {
  error: string;
  isLoading: boolean;
  onRetry: () => void;
  t: I18nDictionary;
}

export interface EventRequestDetailsCardProps {
  children: ReactNode;
  className?: string;
  icon: ReactNode;
  title: string;
}

export interface EventRequestDetailsLogoProps {
  logo: string | null;
  t: I18nDictionary;
  title: string | null;
}

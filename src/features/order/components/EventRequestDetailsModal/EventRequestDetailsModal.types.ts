import type { ReactNode } from "react";
import type { I18nDictionary, SupportedLanguage } from "../../../../i18n";
import type {
  EventRequestDetails,
  EventRequestOrganizerDetails,
  EventRequestSpeakerApiData,
} from "../../types";

export interface EventRequestDetailsModalProps {
  details: EventRequestDetails | null;
  error: string;
  isLoading: boolean;
  onApprove?: () => void;
  onClose: () => void;
  onReject?: () => void;
  onRetry: () => void;
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

export interface EventRequestOrganizerLinkProps {
  href: string | null;
  label: string;
  unavailable: string;
}

export interface EventRequestSpeakersSectionProps {
  speakers: EventRequestSpeakerApiData[];
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
  onApprove?: () => void;
  onReject?: () => void;
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

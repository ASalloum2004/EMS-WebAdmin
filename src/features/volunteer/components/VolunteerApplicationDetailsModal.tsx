import { useEffect, useState } from "react";
import { Card, ModalCloseButton, Skeleton } from "../../../components";
import { useI18n } from "../../../i18n";
import type { VolunteerApplicationDetails, VolunteerApplicationStatus } from "../types";
import "../../order/components/EventRequestDetailsModal/EventRequestDetailsModal.scss";
import "./VolunteerApplicationDetailsModal.scss";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getStatusClass(status: VolunteerApplicationStatus | null) {
  return status ? `volunteer-details__status--${status}` : "volunteer-details__status--unknown";
}

type VolunteerApplicationDetailsModalProps = {
  application: VolunteerApplicationDetails | null;
  error: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isViewingCv: boolean;
  onApprove: (reviewNote: string) => void;
  onClose: () => void;
  onReject: (reviewNote: string) => void;
  onViewCv: () => void;
};

export function VolunteerApplicationDetailsModal({ application, error, isLoading, isSubmitting, isViewingCv, onApprove, onClose, onReject, onViewCv }: VolunteerApplicationDetailsModalProps) {
  const { t } = useI18n();
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const details = t.volunteers.details;
  const statusLabel = application?.status ? t.volunteers.status[application.status] : t.volunteers.status.unknown;

  return (
    <div className="event-request-details-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-busy={isLoading} aria-labelledby="volunteer-application-details-title" aria-modal="true" className="event-request-details-modal__dialog" role="dialog" tabIndex={-1}>
        <header className="event-request-details-modal__header">
          <span aria-hidden="true" className={`volunteer-details__status ${getStatusClass(application?.status ?? null)}`}>{statusLabel}</span>
          <div className="volunteer-details__heading">
            <h2 id="volunteer-application-details-title">{details.title}</h2>
            <p>{application?.fullName ?? t.volunteers.loadingDetails}</p>
          </div>
          <ModalCloseButton ariaLabel={t.common.close} onClick={onClose} />
        </header>
        <div className="event-request-details-modal__scroll-area">
          {isLoading ? <VolunteerApplicationDetailsSkeleton /> : null}
          {!isLoading && error && !application ? <div className="event-request-details-modal__request-state"><p>{t.volunteers.loadDetailsError}</p></div> : null}
          {!isLoading && application ? (
            <div className="event-request-details-modal__content-grid">
              <div className="event-request-details-modal__column">
                <Card className="event-request-details-modal__card" title={details.applicationInformation} titleClassName="event-request-details-modal__card-title">
                  <dl className="event-request-details-modal__facts volunteer-details__facts">
                    <div><dt>{details.email}</dt><dd>{application.email || "—"}</dd></div>
                    <div><dt>{details.phone}</dt><dd>{application.phone || "—"}</dd></div>
                    <div><dt>{details.city}</dt><dd>{application.city || "—"}</dd></div>
                    <div><dt>{details.educationOrOccupation}</dt><dd>{application.educationOrOccupation || "—"}</dd></div>
                    <div className="volunteer-details__wide"><dt>{details.skills}</dt><dd>{application.skills || "—"}</dd></div>
                    <div><dt>{details.submittedAt}</dt><dd>{formatDate(application.createdAt)}</dd></div>
                    <div><dt>{details.privacyConsentAt}</dt><dd>{formatDate(application.privacyConsentAt)}</dd></div>
                  </dl>
                </Card>
                <Card className="event-request-details-modal__card" title={details.motivation} titleClassName="event-request-details-modal__card-title">
                  <p className="volunteer-details__content">{application.motivation || "—"}</p>
                </Card>
              </div>
              <div className="event-request-details-modal__column">
                <Card className="event-request-details-modal__card" title={details.cvTitle} titleClassName="event-request-details-modal__card-title">
                  {application.cv ? <button aria-busy={isViewingCv} className={`volunteer-details__cv ${isViewingCv ? "volunteer-details__cv--loading" : ""}`} disabled={isViewingCv} type="button" onClick={onViewCv}>{isViewingCv ? <span aria-hidden="true" className="volunteer-details__cv-spinner" /> : null}{details.viewCv}</button> : <p className="volunteer-details__empty">{details.noCv}</p>}
                </Card>
                {application.reviewedAt ? <Card className="event-request-details-modal__card" title={details.reviewInformation} titleClassName="event-request-details-modal__card-title">
                  <dl className="event-request-details-modal__facts volunteer-details__facts"><div><dt>{details.reviewedAt}</dt><dd>{formatDate(application.reviewedAt)}</dd></div><div><dt>{details.reviewer}</dt><dd>{application.reviewer?.name || "—"}</dd></div><div className="volunteer-details__wide"><dt>{details.review}</dt><dd>{application.reviewNote || "—"}</dd></div></dl>
                </Card> : null}
                {application.status === "pending" ? <Card className="event-request-details-modal__card" title={details.reviewNote} titleClassName="event-request-details-modal__card-title"><textarea aria-label={details.reviewNote} className="volunteer-details__review-note" maxLength={2000} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} /></Card> : null}
              </div>
            </div>
          ) : null}
        </div>
        {error && application ? <p className="event-request-details-modal__action-error" role="alert">{error}</p> : null}
        {application ? <footer className={`event-request-details-modal__actions ${application.status === "pending" ? "event-request-details-modal__actions--pending" : "volunteer-details__actions--final"}`}>
          {application.status === "pending" ? <><button className="event-request-details-modal__action event-request-details-modal__action--reject" disabled={isSubmitting} type="button" onClick={() => onReject(reviewNote)}>{details.reject}</button><button className="event-request-details-modal__action event-request-details-modal__action--approve" disabled={isSubmitting} type="button" onClick={() => onApprove(reviewNote)}>{details.approve}</button></> : <span className={`event-request-details-modal__final-status event-request-details-modal__final-status--${application.status ?? "unknown"}`}>{statusLabel}</span>}
        </footer> : null}
      </section>
    </div>
  );
}

function VolunteerApplicationDetailsSkeleton() {
  return <div className="event-request-details-modal__content-grid" aria-hidden="true"><div className="event-request-details-modal__column"><Card className="event-request-details-modal__card"><Skeleton height={20} width={180} /><div className="volunteer-details__skeleton-list"><Skeleton height={56} /><Skeleton height={56} /><Skeleton height={56} /></div></Card><Card className="event-request-details-modal__card"><Skeleton height={20} width={140} /><Skeleton height={120} /></Card></div><div className="event-request-details-modal__column"><Card className="event-request-details-modal__card"><Skeleton height={20} width={120} /><Skeleton height={42} width={132} /></Card><Card className="event-request-details-modal__card"><Skeleton height={20} width={150} /><Skeleton height={84} /></Card></div></div>;
}

export { DataTable } from "../../../components";
export { getVolunteerApplicationColumns } from "./volunteerTableColumns";

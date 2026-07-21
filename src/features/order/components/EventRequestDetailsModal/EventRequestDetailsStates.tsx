import type { EventRequestDetailsStatesProps } from "./EventRequestDetailsModal.types";

export function EventRequestDetailsStates({
  error,
  isLoading,
  onRetry,
  t,
}: EventRequestDetailsStatesProps) {
  const labels = t.order.eventRequests.details;

  return (
    <div
      aria-live="polite"
      className="event-request-details-modal__request-state"
      role={error ? "alert" : "status"}
    >
      <p>{isLoading ? labels.loading : error || labels.loadError}</p>
      {error ? (
        <button onClick={onRetry} type="button">
          {t.common.tryAgain}
        </button>
      ) : null}
    </div>
  );
}

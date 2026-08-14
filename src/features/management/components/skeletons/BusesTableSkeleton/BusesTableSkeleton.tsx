import { Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";

const BUS_ROWS = [
  { locationWidth: 124, timeWidth: 72 },
  { locationWidth: 156, timeWidth: 68 },
  { locationWidth: 136, timeWidth: 80 },
] as const;

export function BusesTableSkeleton() {
  const { t } = useI18n();

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.management.busModal.loading}
      </span>
      <div
        aria-hidden="true"
        className="management-services-modal__table management-services-modal__table--bus"
        role="presentation"
      >
        <div className="management-services-modal__table-head">
          <div className="management-services-modal__row">
            <div>{t.management.busModal.location}</div>
            <div>{t.management.busModal.startTime}</div>
            <div>{t.management.busModal.endTime}</div>
            <div>{t.management.busModal.duration}</div>
            <div>{t.management.busModal.actions}</div>
          </div>
        </div>
        <div className="management-services-modal__table-body">
          {BUS_ROWS.map((row) => (
            <div className="management-services-modal__row" key={row.locationWidth}>
              <div><Skeleton height={16} width={row.locationWidth} /></div>
              <div><Skeleton height={14} width={row.timeWidth} /></div>
              <div><Skeleton height={14} width={row.timeWidth} /></div>
              <div><Skeleton height={14} width={42} /></div>
              <div><Skeleton height={34} variant="rect" width={110} /></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

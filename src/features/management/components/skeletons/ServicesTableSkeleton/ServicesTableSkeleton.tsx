import { Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./ServicesTableSkeleton.scss";

const SERVICE_ROWS = [
  { nameWidth: 116, priceWidth: 62 },
  { nameWidth: 148, priceWidth: 74 },
  { nameWidth: 128, priceWidth: 68 },
] as const;

export function ServicesTableSkeleton() {
  const { t } = useI18n();

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.management.servicesModal.loading}
      </span>
      <div
        aria-hidden="true"
        className="management-services-modal__table services-table-skeleton"
        role="presentation"
      >
        <div className="management-services-modal__table-head">
          <div className="management-services-modal__row">
            <div>{t.management.servicesModal.serviceName}</div>
            <div>{t.management.servicesModal.price}</div>
            <div>{t.management.servicesModal.status}</div>
            <div>{t.management.servicesModal.actions}</div>
          </div>
        </div>
        <div className="management-services-modal__table-body">
          {SERVICE_ROWS.map((row) => (
            <div className="management-services-modal__row" key={row.nameWidth}>
              <div><Skeleton height={16} width={row.nameWidth} /></div>
              <div><Skeleton height={14} width={row.priceWidth} /></div>
              <div><Skeleton height={26} variant="pill" width={76} /></div>
              <div><Skeleton height={34} variant="rect" width={64} /></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

import { Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./CompanyDetailsSkeleton.scss";

const MANAGER_ROWS = [
  { emailWidth: 156, nameWidth: 104 },
  { emailWidth: 184, nameWidth: 132 },
] as const;

const BOOTH_ROWS = [
  { hallWidth: 40, labelWidth: 116, numberWidth: 62 },
  { hallWidth: 34, labelWidth: 138, numberWidth: 70 },
] as const;

export function CompanyDetailsSkeleton() {
  const { t } = useI18n();

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.company.details.loading}
      </span>
      <div
        aria-hidden="true"
        className="company-details-modal__sections company-details-skeleton"
      >
        <section className="company-details-modal__section">
          <h3>
            <Skeleton height={19} width={126} />
          </h3>
          <div className="company-details-modal__identity">
            <Skeleton
              borderRadius={16}
              height={58}
              variant="rect"
              width={58}
            />
            <div>
              <Skeleton height={18} width={174} />
              <Skeleton height={14} width={128} />
            </div>
            <Skeleton height={28} variant="pill" width={86} />
          </div>
          <dl className="company-details-modal__facts">
            <div>
              <dt>
                <Skeleton height={11} width={46} />
              </dt>
              <dd>
                <Skeleton height={14} width={118} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="company-details-modal__section">
          <h3>
            <Skeleton height={19} width={88} />
          </h3>
          <ul className="company-details-modal__manager-list">
            {MANAGER_ROWS.map((row) => (
              <li key={row.emailWidth}>
                <Skeleton height={40} variant="circle" width={40} />
                <span className="company-details-skeleton__manager-copy">
                  <Skeleton height={14} width={row.nameWidth} />
                  <Skeleton height={12} width={row.emailWidth} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="company-details-modal__section">
          <h3>
            <Skeleton height={19} width={72} />
          </h3>
          <ul className="company-details-modal__booth-list">
            {BOOTH_ROWS.map((row) => (
              <li key={row.labelWidth}>
                <Skeleton height={14} width={row.labelWidth} />
                <dl className="company-details-modal__facts">
                  <div>
                    <dt>
                      <Skeleton height={10} width={64} />
                    </dt>
                    <dd>
                      <Skeleton height={13} width={row.numberWidth} />
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Skeleton height={10} width={32} />
                    </dt>
                    <dd>
                      <Skeleton height={13} width={row.hallWidth} />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

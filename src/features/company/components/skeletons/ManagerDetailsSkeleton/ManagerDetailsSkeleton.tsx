import { Card, Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./ManagerDetailsSkeleton.scss";

const PORTFOLIO_ROWS = [
  { nameWidth: 126, phoneWidth: 112, sectorWidth: 104 },
  { nameWidth: 148, phoneWidth: 126, sectorWidth: 132 },
] as const;

function PortfolioSkeleton({
  nameWidth,
  phoneWidth,
  sectorWidth,
}: (typeof PORTFOLIO_ROWS)[number]) {
  return (
    <Card
      bodyClassName="manager-details-modal__portfolio-body"
      className="manager-details-modal__portfolio-card manager-details-skeleton__portfolio-card"
    >
      <div className="manager-details-modal__portfolio-header">
        <Skeleton borderRadius={12} height={44} variant="rect" width={44} />
        <div>
          <Skeleton height={16} width={nameWidth} />
        </div>
        <Skeleton height={26} variant="pill" width={76} />
      </div>

      <dl className="manager-details-modal__portfolio-facts">
        <div>
          <dt>
            <Skeleton height={10} width={74} />
          </dt>
          <dd>
            <Skeleton height={12} width={sectorWidth} />
          </dd>
        </div>
        <div>
          <dt>
            <Skeleton height={10} width={42} />
          </dt>
          <dd>
            <Skeleton height={12} width={phoneWidth} />
          </dd>
        </div>
      </dl>

      <div className="manager-details-modal__booths">
        <h5>
          <Skeleton height={12} width={54} />
        </h5>
        <ul>
          {[0, 1].map((rowIndex) => (
            <li key={rowIndex}>
              <Skeleton height={12} width={rowIndex ? 104 : 124} />
              <dl>
                <div>
                  <dt>
                    <Skeleton height={9} width={54} />
                  </dt>
                  <dd>
                    <Skeleton height={11} width={48} />
                  </dd>
                </div>
                <div>
                  <dt>
                    <Skeleton height={9} width={30} />
                  </dt>
                  <dd>
                    <Skeleton height={11} width={34} />
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function ManagerDetailsSkeleton() {
  const { t } = useI18n();

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.company.manager.details.loading}
      </span>
      <div aria-hidden="true" className="manager-details-skeleton">
        <section className="manager-details-modal__section">
          <h3>
            <Skeleton height={19} width={136} />
          </h3>
          <div className="manager-details-modal__identity">
            <Skeleton height={68} variant="circle" width={68} />
            <div>
              <Skeleton height={18} width={152} />
              <Skeleton height={14} width={218} />
            </div>
          </div>
          <dl className="manager-details-modal__summary">
            <div>
              <dt>
                <Skeleton height={12} width={126} />
              </dt>
              <dd>
                <Skeleton height={30} width={38} />
              </dd>
            </div>
            <div>
              <dt>
                <Skeleton height={12} width={112} />
              </dt>
              <dd>
                <Skeleton height={30} width={44} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="manager-details-modal__section">
          <h3>
            <Skeleton height={19} width={92} />
          </h3>
          <div className="manager-details-modal__portfolio-grid">
            {PORTFOLIO_ROWS.map((row) => (
              <PortfolioSkeleton key={row.nameWidth} {...row} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

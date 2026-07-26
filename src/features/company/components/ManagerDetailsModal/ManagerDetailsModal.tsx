import { useEffect, useMemo, useRef } from "react";
import { Card, ModalCloseButton } from "../../../../components";
import { useI18n } from "../../../../i18n";
import type { Manager, ManagerPortfolio } from "../../types";
import { CompanyLogo } from "../CompanyLogo";
import { ManagerAvatar } from "../ManagerAvatar";
import "./ManagerDetailsModal.scss";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type ManagerDetailsModalProps = {
  manager: Manager;
  onClose: () => void;
};

function PortfolioStatus({
  status,
}: {
  status: ManagerPortfolio["status"];
}) {
  const { t } = useI18n();

  return (
    <span
      className={`manager-details-modal__status manager-details-modal__status--${status}`}
    >
      {t.company.statuses[status]}
    </span>
  );
}

function PortfolioCard({ portfolio }: { portfolio: ManagerPortfolio }) {
  const { t } = useI18n();

  return (
    <Card
      aria-label={`${t.company.manager.details.portfolio} ${portfolio.name}`}
      bodyClassName="manager-details-modal__portfolio-body"
      className="manager-details-modal__portfolio-card"
    >
      <div className="manager-details-modal__portfolio-header">
        <CompanyLogo logo={portfolio.logo} name={portfolio.name} />
        <div>
          <h4>{portfolio.name}</h4>
        </div>
        <PortfolioStatus status={portfolio.status} />
      </div>

      <dl className="manager-details-modal__portfolio-facts">
        <div>
          <dt>{t.company.manager.details.businessSector}</dt>
          <dd>{portfolio.business_sector}</dd>
        </div>
        <div>
          <dt>{t.company.manager.details.phone}</dt>
          <dd dir="ltr">{portfolio.phone}</dd>
        </div>
      </dl>

      <div className="manager-details-modal__booths">
        <h5>{t.company.manager.details.booths}</h5>
        {portfolio.booths.length ? (
          <ul>
            {portfolio.booths.map((booth) => (
              <li key={booth.id}>
                <strong>{booth.label}</strong>
                <dl>
                  <div>
                    <dt>{t.company.manager.details.boothNumber}</dt>
                    <dd>{booth.number}</dd>
                  </div>
                  <div>
                    <dt>{t.company.manager.details.hall}</dt>
                    <dd>{booth.hall}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t.company.manager.details.noBoothsAssigned}</p>
        )}
      </div>
    </Card>
  );
}

export function ManagerDetailsModal({
  manager,
  onClose,
}: ManagerDetailsModalProps) {
  const { language, t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US", {
        maximumFractionDigits: 0,
        useGrouping: false,
      }),
    [language],
  );

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;

    document.body.style.overflow = "hidden";
    dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) {
        return;
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];

      if (!firstFocusableElement || !lastFocusableElement) {
        event.preventDefault();
        dialog.focus();
      } else if (
        event.shiftKey &&
        document.activeElement === firstFocusableElement
      ) {
        event.preventDefault();
        lastFocusableElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastFocusableElement
      ) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocusedElement?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="manager-details-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-labelledby="manager-details-modal-title"
        aria-modal="true"
        className="manager-details-modal__dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="manager-details-modal__header">
          <div>
            <h2 id="manager-details-modal-title">
              {t.company.manager.details.title}
            </h2>
            <p>{manager.name}</p>
          </div>
          <ModalCloseButton
            ariaLabel={t.company.manager.details.closeAriaLabel}
            onClick={onClose}
          />
        </header>

        <div className="manager-details-modal__scroll-area">
          <section className="manager-details-modal__section">
            <h3>{t.company.manager.details.profile}</h3>
            <div className="manager-details-modal__identity">
              <ManagerAvatar large manager={manager} />
              <div>
                <strong>{manager.name}</strong>
                <span dir="ltr">{manager.email}</span>
              </div>
            </div>
            <dl className="manager-details-modal__summary">
              <div>
                <dt>{t.company.manager.summary.managedCompanies}</dt>
                <dd>{formatter.format(manager.companies_count)}</dd>
              </div>
              <div>
                <dt>{t.company.manager.summary.managedBooths}</dt>
                <dd>{formatter.format(manager.booths_count)}</dd>
              </div>
            </dl>
          </section>

          <section className="manager-details-modal__section">
            <h3>{t.company.manager.details.portfolios}</h3>
            {manager.portfolios.length ? (
              <div className="manager-details-modal__portfolio-grid">
                {manager.portfolios.map((portfolio) => (
                  <PortfolioCard key={portfolio.id} portfolio={portfolio} />
                ))}
              </div>
            ) : (
              <p className="manager-details-modal__empty">
                {t.company.manager.details.noPortfolios}
              </p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

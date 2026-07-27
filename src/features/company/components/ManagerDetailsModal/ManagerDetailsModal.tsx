import { useEffect, useMemo, useRef } from "react";
import { Card, ModalCloseButton } from "../../../../components";
import { useI18n } from "../../../../i18n";
import type {
  ManagerDetails,
  ManagerDetailsState,
  ManagerListItem,
  ManagerPortfolio,
} from "../../types";
import { CompanyLogo } from "../CompanyLogo";
import { ManagerAvatar } from "../ManagerAvatar";
import { ManagerDetailsSkeleton } from "../skeletons";
import "./ManagerDetailsModal.scss";

const EMPTY_VALUE = "—";
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type ManagerDetailsModalProps = {
  detailsState: ManagerDetailsState | null;
  manager: ManagerListItem;
  onClose: () => void;
  onRetry: (managerId: number) => void;
};

function getHumanReadableStatus(status: string) {
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function PortfolioStatus({ status }: { status: string | null }) {
  const { t } = useI18n();
  const normalizedStatus = status?.trim().toLowerCase() ?? "";
  let label = normalizedStatus
    ? getHumanReadableStatus(normalizedStatus)
    : EMPTY_VALUE;
  let modifier = "neutral";

  if (normalizedStatus === "approved") {
    label = t.company.statuses.approved;
    modifier = "approved";
  } else if (normalizedStatus === "pending") {
    label = t.company.statuses.pending;
    modifier = "pending";
  } else if (normalizedStatus === "rejected") {
    label = t.company.statuses.rejected;
    modifier = "rejected";
  }

  return (
    <span
      className={`manager-details-modal__status manager-details-modal__status--${modifier}`}
    >
      {label}
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
          <h4>{portfolio.name || EMPTY_VALUE}</h4>
        </div>
        <PortfolioStatus status={portfolio.status} />
      </div>

      <dl className="manager-details-modal__portfolio-facts">
        <div>
          <dt>{t.company.manager.details.businessSector}</dt>
          <dd>{portfolio.businessSector ?? EMPTY_VALUE}</dd>
        </div>
        <div>
          <dt>{t.company.manager.details.phone}</dt>
          <dd dir="ltr">{portfolio.phone ?? EMPTY_VALUE}</dd>
        </div>
      </dl>

      <div className="manager-details-modal__booths">
        <h5>{t.company.manager.details.booths}</h5>
        {portfolio.booths.length ? (
          <ul>
            {portfolio.booths.map((booth, index) => (
              <li
                key={`${booth.label ?? booth.number ?? "booth"}-${index}`}
              >
                <strong>{booth.label ?? EMPTY_VALUE}</strong>
                <dl>
                  <div>
                    <dt>{t.company.manager.details.boothNumber}</dt>
                    <dd>{booth.number ?? EMPTY_VALUE}</dd>
                  </div>
                  <div>
                    <dt>{t.company.manager.details.hall}</dt>
                    <dd>{booth.hall ?? EMPTY_VALUE}</dd>
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

function ManagerDetailsContent({
  details,
  manager,
}: {
  details: ManagerDetails;
  manager: ManagerListItem;
}) {
  const { language, t } = useI18n();
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US", {
        maximumFractionDigits: 0,
        useGrouping: false,
      }),
    [language],
  );
  const profile = {
    avatar: details.avatar ?? manager.avatar,
    email: details.email ?? manager.email,
    name: details.name || manager.name,
  };

  return (
    <>
      <section className="manager-details-modal__section">
        <h3>{t.company.manager.details.profile}</h3>
        <div className="manager-details-modal__identity">
          <ManagerAvatar large manager={profile} />
          <div>
            <strong>{profile.name || EMPTY_VALUE}</strong>
            <span dir="ltr">{profile.email ?? EMPTY_VALUE}</span>
          </div>
        </div>
        <dl className="manager-details-modal__summary">
          <div>
            <dt>{t.company.manager.summary.managedCompanies}</dt>
            <dd>
              {manager.companiesCount === null
                ? EMPTY_VALUE
                : formatter.format(manager.companiesCount)}
            </dd>
          </div>
          <div>
            <dt>{t.company.manager.summary.managedBooths}</dt>
            <dd>
              {manager.boothsCount === null
                ? EMPTY_VALUE
                : formatter.format(manager.boothsCount)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="manager-details-modal__section">
        <h3>{t.company.manager.details.portfolios}</h3>
        {details.portfolios.length ? (
          <div className="manager-details-modal__portfolio-grid">
            {details.portfolios.map((portfolio, index) => (
              <PortfolioCard
                key={`${portfolio.name || "portfolio"}-${index}`}
                portfolio={portfolio}
              />
            ))}
          </div>
        ) : (
          <p className="manager-details-modal__empty">
            {t.company.manager.details.noPortfolios}
          </p>
        )}
      </section>
    </>
  );
}

export function ManagerDetailsModal({
  detailsState,
  manager,
  onClose,
  onRetry,
}: ManagerDetailsModalProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);

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
        aria-busy={detailsState?.isLoading ?? true}
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
          {!detailsState || detailsState.isLoading ? (
            <ManagerDetailsSkeleton />
          ) : detailsState.error ? (
            <div className="manager-details-modal__state" role="alert">
              <p>{detailsState.error}</p>
              <button
                onClick={() => onRetry(manager.internalId)}
                type="button"
              >
                {t.common.tryAgain}
              </button>
            </div>
          ) : detailsState.details ? (
            <ManagerDetailsContent
              details={detailsState.details}
              manager={manager}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

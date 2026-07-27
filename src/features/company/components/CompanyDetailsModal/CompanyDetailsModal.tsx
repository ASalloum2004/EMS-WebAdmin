import { useEffect, useRef, useState } from "react";
import { ModalCloseButton } from "../../../../components";
import { useI18n } from "../../../../i18n";
import type {
  CompanyDetails,
  CompanyDetailsState,
  CompanyListItem,
  CompanyManager,
} from "../../types";
import { CompanyLogo, getCompanyInitials } from "../CompanyLogo";
import { CompanyStatusBadge } from "../CompanyStatusBadge";
import { CompanyDetailsSkeleton } from "../skeletons";
import "./CompanyDetailsModal.scss";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type CompanyDetailsModalProps = {
  company: CompanyListItem;
  detailsState: CompanyDetailsState | null;
  onClose: () => void;
  onRetry: (companyId: number) => void;
};

function getTrimmedValue(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function ManagerAvatar({ manager }: { manager: CompanyManager }) {
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const avatar = getTrimmedValue(manager.avatar);

  useEffect(() => {
    setHasAvatarError(false);
  }, [avatar]);

  return (
    <span aria-hidden="true" className="company-details-modal__avatar">
      {avatar && !hasAvatarError ? (
        <img
          alt=""
          onError={() => setHasAvatarError(true)}
          src={avatar}
        />
      ) : (
        getCompanyInitials(manager.name)
      )}
    </span>
  );
}

function CompanyDetailsContent({
  company,
  details,
}: {
  company: CompanyListItem;
  details: CompanyDetails;
}) {
  const { t } = useI18n();
  const companyName = details.name || company.name;
  const businessSector = details.businessSector || company.businessSector;
  const phone = details.phone || company.phone;
  const logo = details.logo || company.logo;

  return (
    <div className="company-details-modal__sections">
      <section className="company-details-modal__section">
        <h3>{t.company.details.aboutCompany}</h3>
        <div className="company-details-modal__identity">
          <CompanyLogo logo={logo} name={companyName} large />
          <div>
            <strong>{companyName}</strong>
            <span>{businessSector}</span>
          </div>
          <CompanyStatusBadge status={details.status} />
        </div>
        {phone ? (
          <dl className="company-details-modal__facts">
            <div>
              <dt>{t.company.table.phone}</dt>
              <dd dir="ltr">{phone}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="company-details-modal__section">
        <h3>{t.company.details.managers}</h3>
        {details.managers.length ? (
          <ul className="company-details-modal__manager-list">
            {details.managers.map((manager, index) => (
              <li key={`${manager.email ?? manager.name}-${index}`}>
                <ManagerAvatar manager={manager} />
                <span>
                  {manager.name ? <strong>{manager.name}</strong> : null}
                  {manager.email ? <small>{manager.email}</small> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="company-details-modal__empty">
            {t.company.details.noManagers}
          </p>
        )}
      </section>

      <section className="company-details-modal__section">
        <h3>{t.company.details.booths}</h3>
        {details.booths.length ? (
          <ul className="company-details-modal__booth-list">
            {details.booths.map((booth, index) => (
              <li key={`${booth.label ?? booth.number ?? "booth"}-${index}`}>
                <strong>
                  {booth.label || booth.number}
                </strong>
                <dl className="company-details-modal__facts">
                  {booth.number ? (
                    <div>
                      <dt>{t.company.details.boothNumber}</dt>
                      <dd>{booth.number}</dd>
                    </div>
                  ) : null}
                  {booth.hall ? (
                    <div>
                      <dt>{t.company.details.hall}</dt>
                      <dd>{booth.hall}</dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className="company-details-modal__empty">
            {t.company.details.noBooths}
          </p>
        )}
      </section>

    </div>
  );
}

export function CompanyDetailsModal({
  company,
  detailsState,
  onClose,
  onRetry,
}: CompanyDetailsModalProps) {
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
      className="company-details-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-busy={detailsState?.isLoading ?? true}
        aria-labelledby="company-details-modal-title"
        aria-modal="true"
        className="company-details-modal__dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="company-details-modal__header">
          <div>
            <h2 id="company-details-modal-title">{t.company.details.title}</h2>
            <p>{company.name}</p>
          </div>
          <ModalCloseButton
            ariaLabel={t.company.details.closeAriaLabel}
            onClick={onClose}
          />
        </header>

        <div className="company-details-modal__scroll-area">
          {!detailsState || detailsState.isLoading ? (
            <CompanyDetailsSkeleton />
          ) : detailsState.error ? (
            <div className="company-details-modal__state" role="alert">
              <p>{detailsState.error}</p>
              <button onClick={() => onRetry(company.id)} type="button">
                {t.common.tryAgain}
              </button>
            </div>
          ) : detailsState.details ? (
            <CompanyDetailsContent
              company={company}
              details={detailsState.details}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

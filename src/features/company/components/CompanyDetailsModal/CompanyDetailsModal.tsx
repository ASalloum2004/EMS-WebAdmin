import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
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

function getSafeExternalUrl(value: string | null | undefined) {
  const normalizedValue = getTrimmedValue(value);

  try {
    const url = new URL(normalizedValue);

    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function formatCoordinate(value: number | string | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  return getTrimmedValue(value);
}

function CompanyExternalLink({
  label,
  notProvided,
  value,
}: {
  label: string;
  notProvided: string;
  value: string | null | undefined;
}) {
  const safeUrl = getSafeExternalUrl(value);

  if (!safeUrl) {
    return <span>{notProvided}</span>;
  }

  return (
    <a
      aria-label={`${label}: ${safeUrl}`}
      className="company-details-modal__external-link"
      href={safeUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span>{getTrimmedValue(value)}</span>
      <ExternalLink aria-hidden="true" size={14} strokeWidth={1.8} />
    </a>
  );
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

function GalleryImage({
  alt,
  fallback,
  source,
}: {
  alt: string;
  fallback: string;
  source: string;
}) {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [source]);

  return hasImageError ? (
    <span className="company-details-modal__gallery-fallback">
      {fallback}
    </span>
  ) : (
    <img alt={alt} onError={() => setHasImageError(true)} src={source} />
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
            <strong>{companyName || t.company.details.notProvided}</strong>
            <span>{businessSector || t.company.details.notProvided}</span>
          </div>
          <CompanyStatusBadge status={details.status} />
        </div>
        <div className="company-details-modal__description">
          <h4>{t.company.details.description}</h4>
          <p>{details.description || t.company.details.notProvided}</p>
        </div>
      </section>

      <div className="company-details-modal__section-grid">
        <section className="company-details-modal__section">
          <h3>{t.company.details.contactAndSocial}</h3>
          <dl className="company-details-modal__facts">
            <div>
              <dt>{t.company.table.phone}</dt>
              <dd dir={phone ? "ltr" : undefined}>
                {phone || t.company.details.notProvided}
              </dd>
            </div>
            <div>
              <dt>{t.company.details.website}</dt>
              <dd>
                <CompanyExternalLink
                  label={t.company.details.website}
                  notProvided={t.company.details.notProvided}
                  value={details.socialLinks?.website}
                />
              </dd>
            </div>
            <div>
              <dt>{t.company.details.linkedin}</dt>
              <dd>
                <CompanyExternalLink
                  label={t.company.details.linkedin}
                  notProvided={t.company.details.notProvided}
                  value={details.socialLinks?.linkedin}
                />
              </dd>
            </div>
          </dl>
        </section>

        <section className="company-details-modal__section">
          <h3>{t.company.details.headquarters}</h3>
          <dl className="company-details-modal__facts">
            <div>
              <dt>{t.company.details.latitude}</dt>
              <dd dir="ltr">
                {formatCoordinate(details.headquartersLat) ||
                  t.company.details.notProvided}
              </dd>
            </div>
            <div>
              <dt>{t.company.details.longitude}</dt>
              <dd dir="ltr">
                {formatCoordinate(details.headquartersLng) ||
                  t.company.details.notProvided}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="company-details-modal__section">
        <h3>{t.company.details.managers}</h3>
        {details.managers.length ? (
          <ul className="company-details-modal__manager-list">
            {details.managers.map((manager, index) => (
              <li key={`${manager.email ?? manager.name}-${index}`}>
                <ManagerAvatar manager={manager} />
                <span>
                  <strong>
                    {manager.name || t.company.details.notProvided}
                  </strong>
                  <small>{manager.email || t.company.details.notProvided}</small>
                  {manager.phone ? <small dir="ltr">{manager.phone}</small> : null}
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
                  {booth.label || booth.number || t.company.details.notProvided}
                </strong>
                <dl className="company-details-modal__facts">
                  <div>
                    <dt>{t.company.details.boothNumber}</dt>
                    <dd>{booth.number || t.company.details.notProvided}</dd>
                  </div>
                  <div>
                    <dt>{t.company.details.hall}</dt>
                    <dd>{booth.hall || t.company.details.notProvided}</dd>
                  </div>
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

      <section className="company-details-modal__section">
        <h3>{t.company.details.gallery}</h3>
        {details.gallery.length ? (
          <div className="company-details-modal__gallery">
            {details.gallery.map((galleryImage, index) => (
              <GalleryImage
                alt={`${companyName} ${t.company.details.galleryImage} ${index + 1}`}
                fallback={t.company.details.imageUnavailable}
                key={`${galleryImage}-${index}`}
                source={galleryImage}
              />
            ))}
          </div>
        ) : (
          <p className="company-details-modal__empty">
            {t.company.details.noGalleryImages}
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
      const lastFocusableElement = focusableElements.at(-1);

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
            <p>{company.name || t.company.details.notProvided}</p>
          </div>
          <ModalCloseButton
            ariaLabel={t.company.details.closeAriaLabel}
            onClick={onClose}
          />
        </header>

        <div className="company-details-modal__scroll-area">
          {!detailsState || detailsState.isLoading ? (
            <div
              aria-live="polite"
              className="company-details-modal__state"
              role="status"
            >
              <p>{t.company.details.loading}</p>
            </div>
          ) : null}

          {detailsState?.error ? (
            <div className="company-details-modal__state" role="alert">
              <p>{detailsState.error}</p>
              <button onClick={() => onRetry(company.id)} type="button">
                {t.common.tryAgain}
              </button>
            </div>
          ) : null}

          {detailsState?.details && !detailsState.isLoading ? (
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

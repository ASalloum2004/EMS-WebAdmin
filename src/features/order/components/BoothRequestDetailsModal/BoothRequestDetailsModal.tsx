import { useEffect, useRef, type ReactNode } from "react";
import {
  ApproveRequestIcon,
  CompanyIcon,
  ContactIcon,
  EmailIcon,
  GalleryIcon,
  InstagramIcon,
  LinkedinIcon,
  LocationIcon,
  NotesIcon,
  PhoneIcon,
  RejectRequestIcon,
  RequestOverviewIcon,
  ServiceIcon,
  VerifiedCompanyIcon,
  WebsiteIcon,
} from "../../../../assets/icons/orderIcons";
import { Card, ModalCloseButton } from "../../../../components";
import { useI18n, type I18nDictionary } from "../../../../i18n";
import type {
  BoothRequestApiData,
  BoothRequestDetailsViewModel,
  BoothRequestServiceViewModel,
} from "../../types";
import "./BoothRequestDetailsModal.scss";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface BoothRequestDetailsModalProps {
  details: BoothRequestDetailsViewModel;
  onClose: () => void;
  request: BoothRequestApiData;
}

interface DetailsCardProps {
  children: ReactNode;
  className?: string;
  icon: ReactNode;
  title: string;
}

function DetailsCard({
  children,
  className,
  icon,
  title,
}: DetailsCardProps) {
  return (
    <Card
      bodyClassName="booth-request-details-modal__card-body"
      className={`booth-request-details-modal__card${
        className ? ` ${className}` : ""
      }`}
      headerClassName="booth-request-details-modal__card-header"
      icon={icon}
      iconClassName="booth-request-details-modal__card-icon"
      title={title}
      titleClassName="booth-request-details-modal__card-title"
    >
      {children}
    </Card>
  );
}

function formatRequestDate(date: string, language: "en" | "ar") {
  const parsedDate = new Date(date.replace(" ", "T"));

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat(language === "ar" ? "ar-SY" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function formatCurrency(
  amount: number,
  currency: string,
  language: "en" | "ar",
) {
  return new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US", {
    currency,
    style: "currency",
  }).format(amount);
}

function RequestOverview({
  details,
  request,
  t,
  language,
}: {
  details: BoothRequestDetailsViewModel;
  language: "en" | "ar";
  request: BoothRequestApiData;
  t: I18nDictionary;
}) {
  const overviewItems = [
    {
      label: t.order.details.overview.submissionDate,
      value: formatRequestDate(request.created_at, language),
    },
    {
      label: t.order.details.overview.requestType,
      value: details.requestType,
    },
    {
      label: t.order.details.overview.allocatedSpace,
      value: `${t.order.table.boothPrefix} #${request.booth_id}`,
    },
    {
      label: t.order.details.overview.requestedServices,
      value: String(details.services.length),
    },
  ];

  return (
    <DetailsCard
      icon={
        <RequestOverviewIcon aria-hidden="true" size={19} strokeWidth={1.8} />
      }
      title={t.order.details.overview.title}
    >
      <dl className="booth-request-details-modal__overview-grid">
        {overviewItems.map((item) => (
          <div
            className="booth-request-details-modal__overview-item"
            key={item.label}
          >
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </DetailsCard>
  );
}

function ServiceRow({
  currency,
  language,
  service,
  t,
}: {
  currency: string;
  language: "en" | "ar";
  service: BoothRequestServiceViewModel;
  t: I18nDictionary;
}) {
  const rowTotal = service.quantity * service.unitPrice;

  return (
    <li className="booth-request-details-modal__service-row">
      <div className="booth-request-details-modal__service-identity">
        <span className="booth-request-details-modal__service-icon">
          <ServiceIcon aria-hidden="true" size={18} strokeWidth={1.8} />
        </span>
        <span>
          <strong>{service.name}</strong>
          <small>
            {t.order.details.services.category}: {service.category}
          </small>
        </span>
      </div>
      <span className="booth-request-details-modal__service-value">
        <small>{t.order.details.services.quantity}</small>
        <strong>{service.quantity}</strong>
      </span>
      <span className="booth-request-details-modal__service-value">
        <small>{t.order.details.services.unitPrice}</small>
        <strong>
          {formatCurrency(service.unitPrice, currency, language)}
        </strong>
      </span>
      <span className="booth-request-details-modal__service-value booth-request-details-modal__service-value--total">
        <small>{t.order.details.services.rowTotal}</small>
        <strong>{formatCurrency(rowTotal, currency, language)}</strong>
      </span>
    </li>
  );
}

function RequestedServices({
  details,
  language,
  t,
}: {
  details: BoothRequestDetailsViewModel;
  language: "en" | "ar";
  t: I18nDictionary;
}) {
  const total = details.services.reduce(
    (sum, service) => sum + service.quantity * service.unitPrice,
    0,
  );

  return (
    <DetailsCard
      className="booth-request-details-modal__services-card"
      icon={<ServiceIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={t.order.details.services.title}
    >
      <ul className="booth-request-details-modal__services-list">
        {details.services.map((service) => (
          <ServiceRow
            currency={details.currency}
            key={service.id}
            language={language}
            service={service}
            t={t}
          />
        ))}
      </ul>
      <div className="booth-request-details-modal__services-total">
        <span>{t.order.details.services.totalAmount}</span>
        <strong>{formatCurrency(total, details.currency, language)}</strong>
      </div>
    </DetailsCard>
  );
}

function CompanyProfile({
  details,
  request,
  t,
}: {
  details: BoothRequestDetailsViewModel;
  request: BoothRequestApiData;
  t: I18nDictionary;
}) {
  return (
    <DetailsCard
      icon={<CompanyIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={t.order.details.companyProfile.title}
    >
      <div className="booth-request-details-modal__profile-identity">
        <span className="booth-request-details-modal__avatar booth-request-details-modal__avatar--large">
          {details.company.initials}
        </span>
        <span>
          <strong>{details.company.name}</strong>
          {details.company.isVerified ? (
            <small className="booth-request-details-modal__verified">
              <VerifiedCompanyIcon
                aria-hidden="true"
                size={14}
                strokeWidth={2}
              />
              {t.order.details.companyProfile.verified}
            </small>
          ) : null}
        </span>
      </div>

      <dl className="booth-request-details-modal__profile-facts">
        <div>
          <dt>{t.order.details.companyProfile.companyId}</dt>
          <dd>#{request.company_id}</dd>
        </div>
        <div>
          <dt>{t.order.details.companyProfile.industry}</dt>
          <dd>{details.company.industry}</dd>
        </div>
        <div>
          <dt>{t.order.details.companyProfile.headquarters}</dt>
          <dd>
            <LocationIcon aria-hidden="true" size={15} strokeWidth={1.8} />
            {details.company.headquarters}
          </dd>
        </div>
      </dl>

      <p className="booth-request-details-modal__description">
        {details.company.description}
      </p>
    </DetailsCard>
  );
}

function ContactLink({
  children,
  href,
  icon,
}: {
  children: ReactNode;
  href: string;
  icon: ReactNode;
}) {
  return (
    <a className="booth-request-details-modal__contact-link" href={href}>
      {icon}
      <span>{children}</span>
    </a>
  );
}

function PointOfContact({
  details,
  t,
}: {
  details: BoothRequestDetailsViewModel;
  t: I18nDictionary;
}) {
  const { contact } = details;

  return (
    <DetailsCard
      icon={<ContactIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={t.order.details.contact.title}
    >
      <div className="booth-request-details-modal__contact-person">
        <span className="booth-request-details-modal__contact-avatar">
          <ContactIcon aria-hidden="true" size={20} strokeWidth={1.8} />
        </span>
        <span>
          <strong>{contact.name}</strong>
          <small>{contact.position}</small>
        </span>
      </div>

      <div className="booth-request-details-modal__contact-details">
        <ContactLink
          href={`mailto:${contact.email}`}
          icon={<EmailIcon aria-hidden="true" size={16} strokeWidth={1.8} />}
        >
          {contact.email}
        </ContactLink>
        <ContactLink
          href={`tel:${contact.phone.replace(/\s/g, "")}`}
          icon={<PhoneIcon aria-hidden="true" size={16} strokeWidth={1.8} />}
        >
          {contact.phone}
        </ContactLink>
      </div>

      <div
        aria-label={t.order.details.contact.socialLinks}
        className="booth-request-details-modal__social-links"
      >
        <a
          aria-label={t.order.details.contact.website}
          href={contact.socialLinks.website}
          rel="noreferrer"
          target="_blank"
        >
          <WebsiteIcon aria-hidden="true" size={17} strokeWidth={1.8} />
        </a>
        <a
          aria-label={t.order.details.contact.linkedin}
          href={contact.socialLinks.linkedin}
          rel="noreferrer"
          target="_blank"
        >
          <LinkedinIcon aria-hidden="true" size={17} strokeWidth={1.8} />
        </a>
        <a
          aria-label={t.order.details.contact.instagram}
          href={contact.socialLinks.instagram}
          rel="noreferrer"
          target="_blank"
        >
          <InstagramIcon aria-hidden="true" size={17} strokeWidth={1.8} />
        </a>
      </div>
    </DetailsCard>
  );
}

function AdditionalNotes({
  details,
  t,
}: {
  details: BoothRequestDetailsViewModel;
  t: I18nDictionary;
}) {
  return (
    <DetailsCard
      icon={<NotesIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={t.order.details.notes.title}
    >
      <p className="booth-request-details-modal__notes">{details.notes}</p>
    </DetailsCard>
  );
}

export function BoothRequestDetailsModal({
  details,
  onClose,
  request,
}: BoothRequestDetailsModalProps) {
  const { language, t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const statusLabel = t.order.status[request.status];

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
        return;
      }

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
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
      className="booth-request-details-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-describedby="booth-request-details-company-meta"
        aria-labelledby="booth-request-details-title"
        aria-modal="true"
        className="booth-request-details-modal__dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="booth-request-details-modal__header">
          <span className="booth-request-details-modal__avatar" aria-hidden="true">
            {details.company.initials}
          </span>
          <div className="booth-request-details-modal__header-copy">
            <div className="booth-request-details-modal__title-row">
              <h2 id="booth-request-details-title">{details.company.name}</h2>
              <span
                aria-label={`${t.order.table.status}: ${statusLabel}`}
                className={`booth-request-details-modal__status booth-request-details-modal__status--${request.status}`}
              >
                {statusLabel}
              </span>
            </div>
            <p id="booth-request-details-company-meta">
              <CompanyIcon aria-hidden="true" size={15} strokeWidth={1.8} />
              {details.company.industry}
              <span aria-hidden="true">•</span>
              {t.order.details.companyProfile.companyId} #{request.company_id}
            </p>
          </div>
          <ModalCloseButton
            ariaLabel={t.order.details.closeAriaLabel}
            className="booth-request-details-modal__close"
            onClick={onClose}
          />
        </header>

        <div className="booth-request-details-modal__scroll-area">
          <div
            aria-label={t.order.details.gallery.title}
            className="booth-request-details-modal__gallery"
            role="img"
          >
            <GalleryIcon aria-hidden="true" size={30} strokeWidth={1.6} />
            <span>
              <strong>{t.order.details.gallery.title}</strong>
              <small>{t.order.details.gallery.description}</small>
            </span>
          </div>

          <div className="booth-request-details-modal__content-grid">
            <div className="booth-request-details-modal__column">
              <RequestOverview
                details={details}
                language={language}
                request={request}
                t={t}
              />
              <RequestedServices details={details} language={language} t={t} />
              <AdditionalNotes details={details} t={t} />
            </div>

            <div className="booth-request-details-modal__column">
              <CompanyProfile details={details} request={request} t={t} />
              <PointOfContact details={details} t={t} />
            </div>
          </div>
        </div>

        <footer className="booth-request-details-modal__actions">
          <button
            className="booth-request-details-modal__action booth-request-details-modal__action--reject"
            type="button"
          >
            <RejectRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
            {t.order.details.actions.reject}
          </button>
          <button
            className="booth-request-details-modal__action booth-request-details-modal__action--approve"
            type="button"
          >
            <ApproveRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
            {t.order.details.actions.approve}
          </button>
        </footer>
      </section>
    </div>
  );
}

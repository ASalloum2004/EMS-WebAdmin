import { useEffect, useState, type ReactNode } from "react";
import {
  CompanyIcon,
  ContactIcon,
  LinkedinIcon,
  LocationIcon,
  PhoneIcon,
  VerifiedCompanyIcon,
  WebsiteIcon,
} from "../../../../assets/icons/orderIcons";
import type { I18nDictionary } from "../../../../i18n";
import type {
  BoothRequestCompanyDetails,
  BoothRequestDetailsApiData,
  BoothRequestStatus,
} from "../../types";
import { DetailsCard, formatPrice } from "./BoothRequestDetailsMainColumn";

export function getCompanyInitials(companyName: string) {
  const initials = companyName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "—";
}

function getSafeExternalUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function getCompanyStatusLabel(status: string, t: I18nDictionary) {
  const normalizedStatus = status.trim().toLowerCase();

  if (
    normalizedStatus === "pending" ||
    normalizedStatus === "approved" ||
    normalizedStatus === "rejected"
  ) {
    return t.order.status[normalizedStatus as BoothRequestStatus];
  }

  return status.trim() || t.order.details.emptyValue;
}

export function CompanyAvatar({
  className,
  company,
}: {
  className?: string;
  company: BoothRequestCompanyDetails;
}) {
  const logoUrl = getSafeExternalUrl(company.logo.trim());
  const [hasLogoError, setHasLogoError] = useState(false);

  useEffect(() => {
    setHasLogoError(false);
  }, [company.name, logoUrl]);

  return (
    <span
      aria-hidden="true"
      className={`booth-request-details-modal__avatar${
        className ? ` ${className}` : ""
      }`}
    >
      {logoUrl && !hasLogoError ? (
        <img
          alt=""
          onError={() => setHasLogoError(true)}
          src={logoUrl}
        />
      ) : (
        getCompanyInitials(company.name)
      )}
    </span>
  );
}

function formatCoordinates(
  latitude: number,
  longitude: number,
  language: "en" | "ar",
) {
  const formatter = new Intl.NumberFormat(
    language === "ar" ? "ar-SY" : "en-US",
    { maximumFractionDigits: 6 },
  );

  return `${formatter.format(latitude)}, ${formatter.format(longitude)}`;
}

function CompanyProfile({
  details,
  language,
  t,
}: {
  details: BoothRequestDetailsApiData;
  language: "en" | "ar";
  t: I18nDictionary;
}) {
  const companyId =
    Number.isFinite(details.company.id) && details.company.id > 0
      ? details.company.id
      : details.company_id;
  const description = details.company.description.trim();

  return (
    <DetailsCard
      icon={<CompanyIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={t.order.details.companyProfile.title}
    >
      <div className="booth-request-details-modal__profile-identity">
        <CompanyAvatar
          className="booth-request-details-modal__avatar--large"
          company={details.company}
        />
        <span>
          <strong>{details.company.name}</strong>
          <small className="booth-request-details-modal__verified">
            <VerifiedCompanyIcon
              aria-hidden="true"
              size={14}
              strokeWidth={2}
            />
            {getCompanyStatusLabel(details.company.status, t)}
          </small>
        </span>
      </div>

      <dl className="booth-request-details-modal__profile-facts">
        <div>
          <dt>{t.order.details.companyProfile.companyId}</dt>
          <dd>#{companyId}</dd>
        </div>
        <div>
          <dt>{t.order.details.companyProfile.industry}</dt>
          <dd>{details.company.business_sector}</dd>
        </div>
        <div>
          <dt>{t.order.details.companyProfile.headquarters}</dt>
          <dd>
            <LocationIcon aria-hidden="true" size={15} strokeWidth={1.8} />
            <span dir="ltr">
              {formatCoordinates(
                details.company.headquarters_lat,
                details.company.headquarters_lng,
                language,
              )}
            </span>
          </dd>
        </div>
        <div>
          <dt>{t.order.details.companyProfile.yearFounded}</dt>
          <dd>{details.company.year_founded}</dd>
        </div>
      </dl>

      <p className="booth-request-details-modal__description">
        {description || t.order.details.emptyValue}
      </p>
    </DetailsCard>
  );
}

function ContactMethodLink({
  accessibleLabel,
  className,
  href,
  icon,
  isExternal = false,
  label,
  value,
}: {
  accessibleLabel: string;
  className?: string;
  href: string;
  icon: ReactNode;
  isExternal?: boolean;
  label: string;
  value: string;
}) {
  return (
    <a
      aria-label={accessibleLabel}
      className={`booth-request-details-modal__contact-item${
        className ? ` ${className}` : ""
      }`}
      href={href}
      rel={isExternal ? "noopener noreferrer" : undefined}
      target={isExternal ? "_blank" : undefined}
    >
      <span className="booth-request-details-modal__contact-item-icon">
        {icon}
      </span>
      <span className="booth-request-details-modal__contact-item-copy">
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </a>
  );
}

function PointOfContact({
  details,
  t,
}: {
  details: BoothRequestDetailsApiData;
  t: I18nDictionary;
}) {
  const phone = details.company.phone.trim();
  const website = getSafeExternalUrl(
    details.company.social_links.website.trim(),
  );
  const linkedin = getSafeExternalUrl(
    details.company.social_links.linkedin.trim(),
  );
  const socialLinkCount = Number(Boolean(website)) + Number(Boolean(linkedin));
  const hasContactMethods = Boolean(phone || website || linkedin);

  return (
    <DetailsCard
      icon={<ContactIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={t.order.details.contact.title}
    >
      {hasContactMethods ? (
        <div className="booth-request-details-modal__contact-grid">
          {phone ? (
            <ContactMethodLink
              accessibleLabel={`${t.order.details.contact.phone}: ${phone}`}
              className="booth-request-details-modal__contact-item--phone"
              href={`tel:${phone.replace(/\s/g, "")}`}
              icon={
                <PhoneIcon aria-hidden="true" size={18} strokeWidth={1.8} />
              }
              label={t.order.details.contact.phone}
              value={phone}
            />
          ) : null}
          {website ? (
            <ContactMethodLink
              accessibleLabel={`${t.order.details.contact.website}: ${t.order.details.contact.visitWebsite}`}
              className={
                socialLinkCount === 1
                  ? "booth-request-details-modal__contact-item--social-single"
                  : undefined
              }
              href={website}
              icon={
                <WebsiteIcon
                  aria-hidden="true"
                  size={18}
                  strokeWidth={1.8}
                />
              }
              isExternal
              label={t.order.details.contact.website}
              value={t.order.details.contact.visitWebsite}
            />
          ) : null}
          {linkedin ? (
            <ContactMethodLink
              accessibleLabel={`${t.order.details.contact.linkedin}: ${t.order.details.contact.viewLinkedin}`}
              className={
                socialLinkCount === 1
                  ? "booth-request-details-modal__contact-item--social-single"
                  : undefined
              }
              href={linkedin}
              icon={<LinkedinIcon aria-hidden="true" size={18} strokeWidth={1.8} />}
              isExternal
              label={t.order.details.contact.linkedin}
              value={t.order.details.contact.viewLinkedin}
            />
          ) : null}
        </div>
      ) : (
        <p className="booth-request-details-modal__contact-empty">
          {t.order.details.contact.empty}
        </p>
      )}
    </DetailsCard>
  );
}

function TotalAmount({
  details,
  language,
  t,
}: {
  details: BoothRequestDetailsApiData;
  language: "en" | "ar";
  t: I18nDictionary;
}) {
  return (
    <DetailsCard
      className="booth-request-details-modal__total-card"
      title={t.order.details.services.totalAmount}
    >
      <strong className="booth-request-details-modal__total-amount">
        {formatPrice(details.final_price, language)}
      </strong>
    </DetailsCard>
  );
}

interface BoothRequestDetailsSideColumnProps {
  details: BoothRequestDetailsApiData;
  language: "en" | "ar";
  t: I18nDictionary;
}

export function BoothRequestDetailsSideColumn({
  details,
  language,
  t,
}: BoothRequestDetailsSideColumnProps) {
  return (
    <div className="booth-request-details-modal__column booth-request-details-modal__column--side">
      <CompanyProfile details={details} language={language} t={t} />
      <PointOfContact details={details} t={t} />
      <TotalAmount details={details} language={language} t={t} />
    </div>
  );
}

import { useEffect, useState } from "react";
import "./CompanyLogo.scss";

export function getCompanyInitials(companyName: string) {
  const initials = companyName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart.charAt(0).toUpperCase())
    .join("");

  return initials || "C";
}

export function CompanyLogo({
  logo,
  name,
  large = false,
}: {
  logo: string | null;
  name: string;
  large?: boolean;
}) {
  const [hasLogoError, setHasLogoError] = useState(false);
  const logoSource = logo?.trim() ?? "";

  useEffect(() => {
    setHasLogoError(false);
  }, [logoSource]);

  return (
    <span
      aria-hidden="true"
      className={`company-logo${large ? " company-logo--large" : ""}`}
    >
      {logoSource && !hasLogoError ? (
        <img
          alt=""
          loading="lazy"
          onError={() => setHasLogoError(true)}
          src={logoSource}
        />
      ) : (
        getCompanyInitials(name)
      )}
    </span>
  );
}

import { useEffect, useState } from "react";
import { useI18n } from "../../../i18n";
import { AppLink } from "../../../router/AppLink";
import "./AdminAppbar.scss";

interface AdminAppbarProps {
  adminAvatarUrl?: string;
  adminName: string;
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((namePart) => namePart[0]?.toUpperCase() ?? "")
      .join("") || "A"
  );
}

export function AdminAppbar({ adminAvatarUrl, adminName }: AdminAppbarProps) {
  const { t } = useI18n();
  const [hasAvatarLoadError, setHasAvatarLoadError] = useState(false);
  const shouldShowAvatarImage = Boolean(
    adminAvatarUrl && !hasAvatarLoadError,
  );

  useEffect(() => {
    setHasAvatarLoadError(false);
  }, [adminAvatarUrl]);

  return (
    <header className="admin-appbar">
      <h1 className="admin-appbar__title">{t.layout.appbar.title}</h1>

      <AppLink
        href="/profile"
        className="admin-appbar__avatar-button"
        aria-label={t.layout.appbar.openProfileMenu}
      >
        {shouldShowAvatarImage ? (
          <img
            className="admin-appbar__avatar"
            src={adminAvatarUrl}
            alt={t.layout.appbar.adminProfileAlt}
            onError={() => setHasAvatarLoadError(true)}
          />
        ) : (
          <span className="admin-appbar__avatar-fallback" aria-hidden="true">
            {getInitials(adminName)}
          </span>
        )}
      </AppLink>
    </header>
  );
}

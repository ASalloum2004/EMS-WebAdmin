import adminAvatar from "../../../assets/AdminAppbar/Admin-avatar.svg";
import { useI18n } from "../../../i18n";
import "./AdminAppbar.scss";

export function AdminAppbar() {
  const { t } = useI18n();

  return (
    <header className="admin-appbar">
      <h1 className="admin-appbar__title">{t.layout.appbar.title}</h1>

      <button
        type="button"
        className="admin-appbar__avatar-button"
        aria-label={t.layout.appbar.openProfileMenu}
      >
        <img
          className="admin-appbar__avatar"
          src={adminAvatar}
          alt={t.layout.appbar.adminProfileAlt}
        />
      </button>
    </header>
  );
}

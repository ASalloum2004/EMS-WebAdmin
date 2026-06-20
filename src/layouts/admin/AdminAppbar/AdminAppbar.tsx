import adminAvatar from "../../../assets/AdminAppbar/Admin-avatar.svg";
import "./AdminAppbar.scss";

export function AdminAppbar() {
  return (
    <header className="admin-appbar">
      <h1 className="admin-appbar__title">Admin Dashboard</h1>

      <button
        type="button"
        className="admin-appbar__avatar-button"
        aria-label="Open admin profile menu"
      >
        <img
          className="admin-appbar__avatar"
          src={adminAvatar}
          alt="Admin profile"
        />
      </button>
    </header>
  );
}
import { resetPasswordIcon } from "../../../../assets/Profile";
import "./ChangePasswordCard.scss";

export function ChangePasswordCard() {
  return (
    <section className="change-password-card">
      <div className="change-password-card__header">
        <h2 className="change-password-card__title">Change Password</h2>

        <span className="change-password-card__icon-container" aria-hidden="true">
          <img
            className="change-password-card__icon"
            src={resetPasswordIcon}
            alt=""
          />
        </span>
      </div>

      <div className="change-password-card__actions">
        <button type="button" className="change-password-card__button">
          Update Password
        </button>
      </div>
    </section>
  );
}
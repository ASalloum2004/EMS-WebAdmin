import { Card } from "../../../../components";
import { resetPasswordIcon } from "../../../../assets/Profile";
import "./ChangePasswordCard.scss";

export function ChangePasswordCard() {
  return (
    <Card
      className="change-password-card"
      title="Change Password"
      icon={
        <img
          className="change-password-card__icon"
          src={resetPasswordIcon}
          alt=""
        />
      }
      iconClassName="change-password-card__icon-container"
    >
      <div className="change-password-card__actions">
        <button type="button" className="change-password-card__button">
          Update Password
        </button>
      </div>
    </Card>
  );
}

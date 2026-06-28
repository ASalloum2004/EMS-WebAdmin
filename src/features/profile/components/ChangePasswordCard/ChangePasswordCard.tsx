import { useState } from "react";
import { Card } from "../../../../components";
import { resetPasswordIcon } from "../../../../assets/Profile";
import { ChangePasswordModal } from "../ChangePasswordModal";
import "./ChangePasswordCard.scss";

export function ChangePasswordCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
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
          <button
            type="button"
            className="change-password-card__button"
            onClick={() => setIsModalOpen(true)}
          >
            Change Password
          </button>
        </div>
      </Card>

      {isModalOpen ? (
        <ChangePasswordModal onClose={() => setIsModalOpen(false)} />
      ) : null}
    </>
  );
}

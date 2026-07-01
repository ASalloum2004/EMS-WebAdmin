import { useState } from "react";
import { Card } from "../../../../components";
import { resetPasswordIcon } from "../../../../assets/Profile";
import { useI18n } from "../../../../i18n";
import { ChangePasswordModal } from "../ChangePasswordModal";
import "./ChangePasswordCard.scss";

export function ChangePasswordCard() {
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card
        className="change-password-card"
        title={t.profile.changePassword}
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
            {t.profile.changePassword}
          </button>
        </div>
      </Card>

      {isModalOpen ? (
        <ChangePasswordModal onClose={() => setIsModalOpen(false)} />
      ) : null}
    </>
  );
}

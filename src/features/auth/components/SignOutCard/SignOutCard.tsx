import { useState } from "react";
import { Card } from "../../../../components";
import { useAuth } from "../../../../context";
import signOutIcon from "../../../../assets/auth/signout.svg";
import { SignOutConfirmModal } from "../SignOutConfirmModal";
import "./SignOutCard.scss";

export function SignOutCard() {
  const { signOut } = useAuth();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  function handleConfirmSignOut() {
    setIsConfirmOpen(false);
    signOut();
  }

  return (
    <>
      <Card
        className="sign-out-card"
        title="Account Access"
        icon={
          <img
            className="sign-out-card__icon-image"
            src={signOutIcon}
            alt=""
            aria-hidden="true"
          />
        }
        iconClassName="sign-out-card__icon"
      >
        <div className="sign-out-card__actions">
          <button
            className="sign-out-card__button"
            type="button"
            aria-haspopup="dialog"
            onClick={() => setIsConfirmOpen(true)}
          >
            Sign Out
          </button>
        </div>
      </Card>

      {isConfirmOpen && (
        <SignOutConfirmModal
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmSignOut}
        />
      )}
    </>
  );
}

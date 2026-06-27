import { useState } from "react";
import { Card } from "../../../../components";
import { useAuth } from "../../../../context";
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.333 3.333H5.833A1.667 1.667 0 0 0 4.167 5v10a1.667 1.667 0 0 0 1.666 1.667h2.5M12.5 13.333 15.833 10 12.5 6.667M15.833 10h-10"
              stroke="currentColor"
              strokeWidth="1.667"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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

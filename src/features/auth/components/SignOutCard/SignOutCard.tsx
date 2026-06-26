import { useLogout } from "../../hooks";
import "./SignOutCard.scss";

export function SignOutCard() {
  const { error, handleLogout, isLoggingOut } = useLogout();

  return (
    <section className="sign-out-card" aria-labelledby="sign-out-card-title">
      <div className="sign-out-card__header">
        <span className="sign-out-card__icon" aria-hidden="true">
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
        </span>
        <h2 id="sign-out-card-title">Account Access</h2>
      </div>

      <div className="sign-out-card__actions">
        <button
          className="sign-out-card__button"
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </button>

        {error && <p className="sign-out-card__error">{error}</p>}
      </div>
    </section>
  );
}

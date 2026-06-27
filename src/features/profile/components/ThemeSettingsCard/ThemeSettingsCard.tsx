import { Card } from "../../../../components";
import { darkModeIcon, lightModeIcon } from "../../../../assets/Profile";
import "./ThemeSettingsCard.scss";

export function ThemeSettingsCard() {
  return (
    <Card className="theme-settings-card" title="Choose Theme">
      <div
        className="theme-settings-card__toggle"
        role="group"
        aria-label="Choose theme"
      >
        <button
          type="button"
          className="theme-settings-card__option theme-settings-card__option--active"
        >
          <img
            className="theme-settings-card__option-icon"
            src={lightModeIcon}
            alt=""
            aria-hidden="true"
          />
          <span>Light</span>
        </button>

        <button type="button" className="theme-settings-card__option">
          <img
            className="theme-settings-card__option-icon"
            src={darkModeIcon}
            alt=""
            aria-hidden="true"
          />
          <span>Dark</span>
        </button>
      </div>

      <button type="button" className="theme-settings-card__button">
        Save Theme
      </button>
    </Card>
  );
}

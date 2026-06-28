import { Card } from "../../../../components";
import { useTheme } from "../../../../context";
import { darkModeIcon, lightModeIcon } from "../../../../assets/Profile";
import "./ThemeSettingsCard.scss";

function getOptionClassName(isActive: boolean) {
  return isActive
    ? "theme-settings-card__option theme-settings-card__option--active"
    : "theme-settings-card__option";
}

export function ThemeSettingsCard() {
  const { isDarkMode, setTheme, theme } = useTheme();

  return (
    <Card className="theme-settings-card" title="Choose Theme">
      <div
        className="theme-settings-card__toggle"
        role="group"
        aria-label="Choose theme"
      >
        <button
          type="button"
          className={getOptionClassName(theme === "light")}
          aria-pressed={theme === "light"}
          onClick={() => setTheme("light")}
        >
          <img
            className="theme-settings-card__option-icon"
            src={lightModeIcon}
            alt=""
            aria-hidden="true"
          />
          <span>Light</span>
        </button>

        <button
          type="button"
          className={getOptionClassName(isDarkMode)}
          aria-pressed={isDarkMode}
          onClick={() => setTheme("dark")}
        >
          <img
            className="theme-settings-card__option-icon"
            src={darkModeIcon}
            alt=""
            aria-hidden="true"
          />
          <span>Dark</span>
        </button>
      </div>

      <button
        type="button"
        className="theme-settings-card__button"
        onClick={() => setTheme(theme)}
      >
        Save Theme
      </button>
    </Card>
  );
}

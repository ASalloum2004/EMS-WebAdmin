import { Card } from "../../../../components";
import { useTheme } from "../../../../context";
import { useI18n } from "../../../../i18n";
import { darkModeIcon, lightModeIcon } from "../../../../assets/Profile";
import "./ThemeSettingsCard.scss";

function getOptionClassName(isActive: boolean) {
  return isActive
    ? "theme-settings-card__option theme-settings-card__option--active"
    : "theme-settings-card__option";
}

export function ThemeSettingsCard() {
  const { t } = useI18n();
  const { isDarkMode, setTheme, theme } = useTheme();

  return (
    <Card className="theme-settings-card" title={t.profile.theme}>
      <div
        className="theme-settings-card__toggle"
        role="group"
        aria-label={t.profile.theme}
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
          <span>{t.profile.lightTheme}</span>
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
          <span>{t.profile.darkTheme}</span>
        </button>
      </div>
    </Card>
  );
}

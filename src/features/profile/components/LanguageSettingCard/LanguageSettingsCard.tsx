import type { ChangeEvent, CSSProperties } from "react";
import { Card } from "../../../../components";
import { languageIcon } from "../../../../assets/Profile";
import { useI18n } from "../../../../i18n";
import "./LanguageSettingsCard.scss";

function createIconStyle(icon: string) {
  return {
    "--icon-url": `url("${icon}")`,
  } as CSSProperties;
}

export function LanguageSettingsCard() {
  const { language, setLanguage, t } = useI18n();

  function handleLanguageChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLanguage = event.target.value;

    if (nextLanguage === "en" || nextLanguage === "ar") {
      setLanguage(nextLanguage);
    }
  }

  return (
    <Card
      className="language-settings-card"
      title={t.profile.language}
      icon={
        <span
          className="language-settings-card__icon"
          style={createIconStyle(languageIcon)}
        />
      }
      iconClassName="language-settings-card__icon-container"
    >
      <div className="language-settings-card__field">
        <label className="language-settings-card__label" htmlFor="language">
          {t.profile.preferredLanguage}
        </label>

        <div className="language-settings-card__select-wrapper">
          <select
            id="language"
            className="language-settings-card__select"
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="en">{t.profile.english}</option>
            <option value="ar">{t.profile.arabic}</option>
          </select>
        </div>
      </div>
    </Card>
  );
}

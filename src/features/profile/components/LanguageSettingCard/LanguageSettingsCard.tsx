import type { CSSProperties } from "react";
import { languageIcon } from "../../../../assets/Profile";
import "./LanguageSettingsCard.scss";

function createIconStyle(icon: string) {
  return {
    "--icon-url": `url("${icon}")`,
  } as CSSProperties;
}

export function LanguageSettingsCard() {
  return (
    <section className="language-settings-card">
      <div className="language-settings-card__header">
        <h2 className="language-settings-card__title">Language Settings</h2>

        <span
          className="language-settings-card__icon-container"
          aria-hidden="true"
        >
          <span
            className="language-settings-card__icon"
            style={createIconStyle(languageIcon)}
          />
        </span>
      </div>

      <div className="language-settings-card__body">
        <div className="language-settings-card__field">
          <label className="language-settings-card__label" htmlFor="language">
            Choose Preferred Language
          </label>

          <div className="language-settings-card__select-wrapper">
            <select id="language" className="language-settings-card__select">
              <option value="ar">(Arabic) العربية</option>
              <option value="en">(English) English</option>
            </select>
          </div>
        </div>

        <div className="language-settings-card__actions">
          <button type="button" className="language-settings-card__button">
            حفظ التغييرات
          </button>
        </div>
      </div>
    </section>
  );
}

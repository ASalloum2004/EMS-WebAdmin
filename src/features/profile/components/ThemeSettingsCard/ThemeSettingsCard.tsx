import "./ThemeSettingsCard.scss";

export function ThemeSettingsCard() {
  return (
    <section className="theme-settings-card">
      <h2 className="theme-settings-card__title">Choose Theme</h2>

      <div className="theme-settings-card__toggle" role="group" aria-label="Choose theme">
        <button
          type="button"
          className="theme-settings-card__option theme-settings-card__option--active"
        >
          <span className="theme-settings-card__option-icon" aria-hidden="true">
            ☼
          </span>
          <span>Light</span>
        </button>

        <button type="button" className="theme-settings-card__option">
          <span className="theme-settings-card__option-icon" aria-hidden="true">
            ◑
          </span>
          <span>Dark</span>
        </button>
      </div>

      <button type="button" className="theme-settings-card__button">
        Save Theme
      </button>
    </section>
  );
}
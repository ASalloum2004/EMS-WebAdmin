import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useI18n, type I18nDictionary } from "../../../../i18n";
import type { BoothApiData, UpdateBoothPayload } from "../../types";
import "./ManagementBoothEditModal.scss";

type BoothEditFormState = {
  area: string;
  number: string;
  price: string;
};

interface ManagementBoothEditModalProps {
  booth: BoothApiData;
  error?: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSave: (payload: UpdateBoothPayload) => Promise<void>;
}

function getFormValidationMessage(
  formState: BoothEditFormState,
  t: I18nDictionary,
) {
  const boothNumber = formState.number.trim();
  const area = Number(formState.area);
  const price = Number(formState.price);

  if (!boothNumber) {
    return t.management.validation.boothNumberRequired;
  }

  if (formState.area.trim() === "" || !Number.isFinite(area) || area < 0) {
    return t.management.validation.invalidBoothArea;
  }

  if (formState.price.trim() === "" || !Number.isFinite(price) || price < 0) {
    return t.management.validation.invalidBoothPrice;
  }

  return "";
}

export function ManagementBoothEditModal({
  booth,
  error = "",
  isSubmitting,
  onCancel,
  onSave,
}: ManagementBoothEditModalProps) {
  const { t } = useI18n();
  const [formState, setFormState] = useState<BoothEditFormState>({
    area: String(booth.area),
    number: booth.number,
    price: booth.price,
  });

  useEffect(() => {
    setFormState({
      area: String(booth.area),
      number: booth.number,
      price: booth.price,
    });
  }, [booth]);

  const validationMessage = useMemo(() => {
    return getFormValidationMessage(formState, t);
  }, [formState, t]);

  function updateField(field: keyof BoothEditFormState, value: string) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (validationMessage || isSubmitting) {
      return;
    }

    await onSave({
      number: formState.number.trim(),
      area: Number(formState.area),
      price: Number(formState.price),
    });
  }

  return (
    <div className="management-booth-modal" role="presentation">
      <div className="management-booth-modal__backdrop" />
      <form
        className="management-booth-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booth-edit-title"
        onSubmit={handleSubmit}
      >
        <div className="management-booth-modal__header">
          <h2 id="booth-edit-title">{t.management.booths.editTitle}</h2>
          <p>
            {t.management.booths.number}: {booth.number}
          </p>
        </div>

        <label className="management-booth-modal__field">
          <span>{t.management.filters.boothNumber}</span>
          <input
            type="text"
            value={formState.number}
            onChange={(event) => updateField("number", event.target.value)}
          />
        </label>

        <label className="management-booth-modal__field">
          <span>{t.management.booths.area}</span>
          <input
            type="number"
            min="0"
            step="1"
            value={formState.area}
            onChange={(event) => updateField("area", event.target.value)}
          />
        </label>

        <label className="management-booth-modal__field">
          <span>{t.management.booths.price}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formState.price}
            onChange={(event) => updateField("price", event.target.value)}
          />
        </label>

        {validationMessage ? (
          <p className="management-booth-modal__message" role="alert">
            {validationMessage}
          </p>
        ) : null}

        {error ? (
          <p className="management-booth-modal__message" role="alert">
            {error}
          </p>
        ) : null}

        <div className="management-booth-modal__actions">
          <button
            className="management-booth-modal__button management-booth-modal__button--secondary"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t.common.cancel}
          </button>
          <button
            className="management-booth-modal__button management-booth-modal__button--primary"
            type="submit"
            disabled={isSubmitting || Boolean(validationMessage)}
          >
            {isSubmitting ? t.common.saving : t.common.save}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useI18n } from "../../../../i18n";
import type { EventHall, UpdateEventHallPricePayload } from "../../types";
import "./ManagementEventHallEditModal.scss";

interface ManagementEventHallEditModalProps {
  error?: string;
  eventHall: EventHall;
  isSubmitting: boolean;
  onCancel: () => void;
  onSave: (payload: UpdateEventHallPricePayload) => Promise<void>;
}

export function isValidEventHallPrice(value: string) {
  if (!value.trim()) {
    return false;
  }

  const price = Number(value);

  return Number.isFinite(price) && price >= 0;
}

export function ManagementEventHallEditModal({
  error = "",
  eventHall,
  isSubmitting,
  onCancel,
  onSave,
}: ManagementEventHallEditModalProps) {
  const { t } = useI18n();
  const [pricePerHour, setPricePerHour] = useState(eventHall.price_per_hour);

  useEffect(() => {
    setPricePerHour(eventHall.price_per_hour);
  }, [eventHall]);

  const validationMessage = useMemo(() => {
    return isValidEventHallPrice(pricePerHour)
      ? ""
      : t.management.validation.invalidEventHallPrice;
  }, [pricePerHour, t.management.validation.invalidEventHallPrice]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (validationMessage || isSubmitting) {
      return;
    }

    await onSave({
      pricePerHour: Number(pricePerHour),
    });
  }

  return (
    <div className="management-booth-modal" role="presentation">
      <div className="management-booth-modal__backdrop" />
      <form
        className="management-booth-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-hall-edit-title"
        onSubmit={handleSubmit}
      >
        <div className="management-booth-modal__header">
          <h2 id="event-hall-edit-title">
            {t.management.eventHalls.editPriceTitle}
          </h2>
          <p>#{eventHall.id}</p>
        </div>

        <label className="management-booth-modal__field">
          <span>{t.management.eventHalls.pricePerHour}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={pricePerHour}
            onChange={(event) => setPricePerHour(event.target.value)}
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

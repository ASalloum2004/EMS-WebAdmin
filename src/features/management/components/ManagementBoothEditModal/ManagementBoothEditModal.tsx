import { useEffect, useMemo, useState, type FormEvent } from "react";
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

function getFormValidationMessage(formState: BoothEditFormState) {
  const boothNumber = formState.number.trim();
  const area = Number(formState.area);
  const price = Number(formState.price);

  if (!boothNumber) {
    return "Booth number is required.";
  }

  if (formState.area.trim() === "" || !Number.isFinite(area) || area < 0) {
    return "Area must be a valid number greater than or equal to 0.";
  }

  if (formState.price.trim() === "" || !Number.isFinite(price) || price < 0) {
    return "Price must be a valid number greater than or equal to 0.";
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
    return getFormValidationMessage(formState);
  }, [formState]);

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
          <h2 id="booth-edit-title">Edit Booth</h2>
          <p>#{booth.id}</p>
        </div>

        <label className="management-booth-modal__field">
          <span>Booth Number</span>
          <input
            type="text"
            value={formState.number}
            onChange={(event) => updateField("number", event.target.value)}
          />
        </label>

        <label className="management-booth-modal__field">
          <span>Area</span>
          <input
            type="number"
            min="0"
            step="1"
            value={formState.area}
            onChange={(event) => updateField("area", event.target.value)}
          />
        </label>

        <label className="management-booth-modal__field">
          <span>Price</span>
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
            Cancel
          </button>
          <button
            className="management-booth-modal__button management-booth-modal__button--primary"
            type="submit"
            disabled={isSubmitting || Boolean(validationMessage)}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

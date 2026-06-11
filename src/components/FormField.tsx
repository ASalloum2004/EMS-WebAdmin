import type { HTMLInputTypeAttribute, ReactNode } from "react";

interface FormFieldProps {
  autoComplete?: string;
  iconSrc: string;
  name: string;
  onChange: (value: string) => void;
  placeholder: string;
  rightElement?: ReactNode;
  type: HTMLInputTypeAttribute;
  value: string;
}

export function FormField({
  autoComplete,
  iconSrc,
  name,
  onChange,
  placeholder,
  rightElement,
  type,
  value,
}: FormFieldProps) {
  return (
    <div className="form-field">
      <img
        src={iconSrc}
        alt=""
        className="form-field-icon"
        aria-hidden="true"
      />

      <input
        aria-label={placeholder}
        autoComplete={autoComplete}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      {rightElement && <div className="form-field-action">{rightElement}</div>}
    </div>
  );
}

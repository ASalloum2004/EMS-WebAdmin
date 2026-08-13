import { BusFront } from "lucide-react";
import "./ManagementHeader.scss";

interface ManagementHeaderProps {
  actionLabel: string;
  busLabel: string;
  description: string;
  onActionClick?: () => void;
  title: string;
}

export function ManagementHeader({
  actionLabel,
  busLabel,
  description,
  onActionClick,
  title,
}: ManagementHeaderProps) {
  return (
    <header className="management-header">
      <div className="management-header__copy">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="management-header__actions">
        <button
          className="management-header__action management-header__action--with-icon"
          type="button"
        >
          <BusFront aria-hidden="true" size={18} strokeWidth={2} />
          <span>{busLabel}</span>
        </button>

        <button
          className="management-header__action"
          type="button"
          onClick={onActionClick}
        >
          {actionLabel}
        </button>
      </div>
    </header>
  );
}

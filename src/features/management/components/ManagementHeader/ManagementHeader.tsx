import "./ManagementHeader.scss";

interface ManagementHeaderProps {
  actionLabel: string;
  description: string;
  onActionClick?: () => void;
  title: string;
}

export function ManagementHeader({
  actionLabel,
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

      <button
        className="management-header__action"
        type="button"
        onClick={onActionClick}
      >
        {actionLabel}
      </button>
    </header>
  );
}

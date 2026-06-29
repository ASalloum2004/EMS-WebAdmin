import "./ManagementHeader.scss";

interface ManagementHeaderProps {
  actionLabel: string;
  description: string;
  title: string;
}

export function ManagementHeader({
  actionLabel,
  description,
  title,
}: ManagementHeaderProps) {
  return (
    <header className="management-header">
      <div className="management-header__copy">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <button className="management-header__action" type="button">
        {actionLabel}
      </button>
    </header>
  );
}

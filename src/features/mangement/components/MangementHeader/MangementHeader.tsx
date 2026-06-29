import "./MangementHeader.scss";

interface MangementHeaderProps {
  actionLabel: string;
  description: string;
  title: string;
}

export function MangementHeader({
  actionLabel,
  description,
  title,
}: MangementHeaderProps) {
  return (
    <header className="mangement-header">
      <div className="mangement-header__copy">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <button className="mangement-header__action" type="button">
        {actionLabel}
      </button>
    </header>
  );
}

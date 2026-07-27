import "./ModalCloseButton.scss";

interface ModalCloseButtonProps {
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ModalCloseButton({
  ariaLabel = "Close",
  className,
  disabled = false,
  onClick,
  title,
}: ModalCloseButtonProps) {
  return (
    <button
      className={classNames("modal-close-button", className)}
      disabled={disabled}
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
    />
  );
}

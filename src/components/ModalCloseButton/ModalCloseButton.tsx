import "./ModalCloseButton.scss";

interface ModalCloseButtonProps {
  ariaLabel?: string;
  className?: string;
  onClick: () => void;
  title?: string;
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ModalCloseButton({
  ariaLabel = "Close",
  className,
  onClick,
  title,
}: ModalCloseButtonProps) {
  return (
    <button
      className={classNames("modal-close-button", className)}
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
    />
  );
}

import {
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import "./Card.scss";

interface CardProps extends Omit<ComponentPropsWithoutRef<"section">, "title"> {
  actions?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
  footer?: ReactNode;
  footerClassName?: string;
  headerClassName?: string;
  icon?: ReactNode;
  iconClassName?: string;
  subtitle?: ReactNode;
  title?: ReactNode;
  titleClassName?: string;
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  actions,
  bodyClassName,
  children,
  className,
  footer,
  footerClassName,
  headerClassName,
  icon,
  iconClassName,
  subtitle,
  title,
  titleClassName,
  ...sectionProps
}: CardProps) {
  const generatedTitleId = useId();
  const hasHeader = Boolean(title || subtitle || icon || actions);
  const labelledBy =
    sectionProps["aria-labelledby"] ?? (title ? generatedTitleId : undefined);

  return (
    <section
      {...sectionProps}
      aria-labelledby={labelledBy}
      className={classNames("card", className)}
    >
      {hasHeader && (
        <div className={classNames("card__header", headerClassName)}>
          {(title || subtitle) && (
            <div className="card__heading">
              {title && (
                <h2
                  className={classNames("card__title", titleClassName)}
                  id={generatedTitleId}
                >
                  {title}
                </h2>
              )}
              {subtitle && <p className="card__subtitle">{subtitle}</p>}
            </div>
          )}

          {(icon || actions) && (
            <div className="card__header-meta">
              {icon && (
                <span
                  className={classNames("card__icon", iconClassName)}
                  aria-hidden="true"
                >
                  {icon}
                </span>
              )}
              {actions}
            </div>
          )}
        </div>
      )}

      <div className={classNames("card__body", bodyClassName)}>{children}</div>

      {footer && (
        <div className={classNames("card__footer", footerClassName)}>
          {footer}
        </div>
      )}
    </section>
  );
}

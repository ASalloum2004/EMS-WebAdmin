import type { KeyboardEvent, ReactNode } from "react";
import "./DataTable.scss";

export type DataTableColumn<T> = {
  className?: string;
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  supportingText?: (item: T) => ReactNode;
  variant?: "primary" | "metric" | "badge";
};

export type DataTableProps<T> = {
  actions?: (item: T) => ReactNode;
  ariaLabel?: string;
  className?: string;
  columns: Array<DataTableColumn<T>>;
  emptyMessage?: string;
  getItemAriaLabel?: (item: T) => string;
  getItemKey: (item: T) => string | number;
  isItemInteractive?: (item: T) => boolean;
  items: T[];
  onItemClick?: (item: T) => void;
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function handleDataTableRowKeyDown<T>(
  event: KeyboardEvent<HTMLElement>,
  item: T,
  onItemClick: (item: T) => void,
) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  onItemClick(item);
}

export function DataTable<T>({
  actions,
  ariaLabel,
  className,
  columns,
  emptyMessage = "No items found.",
  getItemAriaLabel,
  getItemKey,
  isItemInteractive,
  items,
  onItemClick,
}: DataTableProps<T>) {
  if (!items.length) {
    return (
      <p className={classNames("data-table__empty", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <section
      className={classNames("data-table", className)}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const itemKey = getItemKey(item);
        const isInteractive =
          Boolean(onItemClick) && (isItemInteractive?.(item) ?? true);

        return (
          <article
            aria-label={getItemAriaLabel?.(item)}
            className={classNames(
              "data-table__row",
              actions && "data-table__row--has-actions",
              isInteractive && "data-table__row--interactive",
            )}
            key={itemKey}
            onClick={isInteractive ? () => onItemClick?.(item) : undefined}
            onKeyDown={
              isInteractive && onItemClick
                ? (event) =>
                    handleDataTableRowKeyDown(event, item, onItemClick)
                : undefined
            }
            role={isInteractive ? "button" : undefined}
            tabIndex={isInteractive ? 0 : undefined}
          >
            {columns.map((column, index) => {
              const variant =
                column.variant ?? (index === 0 ? "primary" : "metric");
              const supportingText = column.supportingText?.(item);

              return (
                <div
                  className={classNames(
                    "data-table__cell",
                    `data-table__cell--${variant}`,
                    column.className,
                  )}
                  key={column.key}
                >
                  {variant === "primary" ? (
                    <>
                      <h2 className="data-table__primary-value">
                        {column.render(item)}
                      </h2>
                      {supportingText ? (
                        <p className="data-table__supporting-text">
                          {supportingText}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <span className="data-table__label">{column.label}</span>
                      <span className="data-table__value">
                        {column.render(item)}
                      </span>
                    </>
                  )}
                </div>
              );
            })}

            {actions ? (
              <div className="data-table__actions">{actions(item)}</div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

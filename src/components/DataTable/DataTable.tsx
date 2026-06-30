import type { ReactNode } from "react";
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
  getItemKey: (item: T) => string | number;
  items: T[];
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function DataTable<T>({
  actions,
  ariaLabel,
  className,
  columns,
  emptyMessage = "No items found.",
  getItemKey,
  items,
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

        return (
          <article
            className={classNames(
              "data-table__row",
              actions && "data-table__row--has-actions",
            )}
            key={itemKey}
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

import { useMemo } from "react";
import { useI18n } from "../../i18n";
import "./TableFooter.scss";

export type TableFooterProps = {
  currentPage: number;
  perPage: number;
  totalItems?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  showSinglePage?: boolean;
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clampPage(page: number, totalPages: number) {
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.min(Math.max(1, Math.trunc(page)), totalPages);
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
  let startPage = currentPage - pagesBeforeCurrent;
  let endPage = currentPage + pagesBeforeCurrent;

  if (startPage < 1) {
    startPage = 1;
    endPage = maxVisiblePages;
  }

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = totalPages - maxVisiblePages + 1;
  }

  return Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index,
  );
}

export function TableFooter({
  currentPage,
  perPage,
  totalItems,
  totalPages,
  onPageChange,
  className,
  showSinglePage = false,
}: TableFooterProps) {
  const { t } = useI18n();
  const safeTotalItems =
    typeof totalItems === "number" && Number.isFinite(totalItems)
      ? Math.max(0, Math.trunc(totalItems))
      : 0;
  const safePerPage =
    Number.isFinite(perPage) && perPage > 0
      ? Math.max(1, Math.trunc(perPage))
      : 1;
  const safeTotalPages =
    typeof totalPages === "number" &&
    Number.isFinite(totalPages) &&
    totalPages > 0
      ? Math.max(1, Math.trunc(totalPages))
      : Math.max(1, Math.ceil(safeTotalItems / safePerPage));
  const activePage = clampPage(currentPage, safeTotalPages);

  const pageNumbers = useMemo(
    () => getPageNumbers(activePage, safeTotalPages),
    [activePage, safeTotalPages],
  );

  function handlePageChange(page: number) {
    const nextPage = clampPage(page, safeTotalPages);

    if (nextPage === activePage) {
      return;
    }

    onPageChange?.(nextPage);
  }

  if (safeTotalPages <= 1 && !showSinglePage) {
    return null;
  }

  return (
    <nav className={classNames("table-footer", className)}>
      <div className="table-footer__controls">
        {activePage > 1 ? (
          <button
            className="table-footer__button table-footer__button--arrow"
            type="button"
            aria-label={t.common.previousPage}
            onClick={() => handlePageChange(activePage - 1)}
          >
            <svg
              className="table-footer__icon"
              viewBox="0 0 20 20"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M12.72 15.78a.75.75 0 0 1-1.06 0l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 1 1 1.06 1.06L8 10l4.72 4.72a.75.75 0 0 1 0 1.06Z" />
            </svg>
          </button>
        ) : null}

        {pageNumbers.map((page) => (
          <button
            className={classNames(
              "table-footer__button table-footer__button--page",
              page === activePage && "table-footer__button--active",
            )}
            type="button"
            aria-current={page === activePage ? "page" : undefined}
            key={page}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}

        {activePage < safeTotalPages ? (
          <button
            className="table-footer__button table-footer__button--arrow"
            type="button"
            aria-label={t.common.nextPage}
            onClick={() => handlePageChange(activePage + 1)}
          >
            <svg
              className="table-footer__icon"
              viewBox="0 0 20 20"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M7.28 4.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 0 1-1.06-1.06L12 10 7.28 5.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        ) : null}
      </div>
    </nav>
  );
}

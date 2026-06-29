import "./MangementPagination.scss";

export function MangementPagination() {
  return (
    <footer className="mangement-pagination">
      <p>Showing 1-5 of halls-booth mangements</p>

      <div className="mangement-pagination__actions" aria-label="Pagination">
        <button
          className="mangement-pagination__button mangement-pagination__button--disabled"
          type="button"
          disabled
        >
          Previous
        </button>
        <button className="mangement-pagination__button" type="button">
          Next
        </button>
      </div>
    </footer>
  );
}

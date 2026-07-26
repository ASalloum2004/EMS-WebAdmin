import { SearchFilterBar, TableFooter } from "../../../components";
import { useI18n } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
import {
  CompanyDetailsModal,
  CompanyFiltersPanel,
  CompanyTable,
  CompanyViewTabs,
} from "../components";
import { useCompanies, useCompanyDetails } from "../hooks";
import "./CompanyPage.scss";

export function CompanyPage() {
  const { t } = useI18n();
  const companiesState = useCompanies(t.company.table.loadError);
  const companyDetails = useCompanyDetails(t.company.details.loadError);
  const selectedCompany = companiesState.companies.find(
    (company) => company.id === companyDetails.selectedCompanyId,
  );
  const emptyMessage = companiesState.hasActiveCriteria
    ? t.company.table.noResults
    : t.company.table.empty;

  function handleSearchChange(value: string) {
    companiesState.setSearchValue(value);
    companyDetails.closeCompany();
  }

  function handleApplyFilters() {
    companiesState.filters.applyFilters();
    companyDetails.closeCompany();
  }

  function handleClearFilters() {
    companiesState.filters.clearFilters();
    companyDetails.closeCompany();
  }

  function handlePageChange(page: number) {
    companiesState.setCurrentPage(page);
    companyDetails.closeCompany();
  }

  return (
    <ManagementLayout>
      <div className="company-page">
        <header className="company-page__header">
          <h1>{t.company.title}</h1>
          <p>{t.company.description}</p>
        </header>

        <CompanyViewTabs />

        <section
          aria-busy={companiesState.isLoading}
          aria-label={t.company.panelAriaLabel}
          className="company-page__panel"
        >
          <div className="company-page__search">
            <SearchFilterBar
              filterAriaLabel={t.company.filters.filterAriaLabel}
              filterLabel={t.common.filter}
              inputAriaLabel={t.company.search.ariaLabel}
              onChange={handleSearchChange}
              onFilterClick={companiesState.filters.toggleFilterPanel}
              placeholder={t.company.search.placeholder}
              showFilterButton
              value={companiesState.searchValue}
            />

            {companiesState.filters.isFilterPanelOpen ? (
              <CompanyFiltersPanel
                filters={companiesState.filters.draftFilters}
                onApply={handleApplyFilters}
                onChange={companiesState.filters.setDraftFilters}
                onClear={handleClearFilters}
              />
            ) : null}
          </div>

          <div className="company-page__divider" />

          {companiesState.isLoading ? (
            <p className="company-page__state" role="status">
              {t.company.table.loading}
            </p>
          ) : null}

          {!companiesState.isLoading && companiesState.error ? (
            <div className="company-page__state" role="alert">
              <p>{companiesState.error || t.company.table.loadError}</p>
              <button
                onClick={() => void companiesState.refetch()}
                type="button"
              >
                {t.common.tryAgain}
              </button>
            </div>
          ) : null}

          {!companiesState.isLoading && !companiesState.error ? (
            <CompanyTable
              companies={companiesState.companies}
              emptyMessage={emptyMessage}
              onOpenCompany={companyDetails.openCompany}
            />
          ) : null}

          {!companiesState.isLoading &&
          !companiesState.error &&
          companiesState.companies.length ? (
            <TableFooter
              className="company-page__footer"
              currentPage={companiesState.currentPage}
              onPageChange={handlePageChange}
              perPage={companiesState.perPage}
              showSinglePage
              totalItems={companiesState.totalItems}
              totalPages={companiesState.totalPages}
            />
          ) : null}
        </section>

        {selectedCompany ? (
          <CompanyDetailsModal
            company={selectedCompany}
            detailsState={companyDetails.detailsState}
            onClose={companyDetails.closeCompany}
            onRetry={(companyId) => {
              void companyDetails.retryDetails(companyId);
            }}
          />
        ) : null}
      </div>
    </ManagementLayout>
  );
}

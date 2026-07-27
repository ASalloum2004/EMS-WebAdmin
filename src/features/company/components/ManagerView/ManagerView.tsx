import { useState, type ChangeEvent } from "react";
import { SearchFilterBar, TableFooter } from "../../../../components";
import { useI18n } from "../../../../i18n";
import { useManagerDetails, useManagers } from "../../hooks";
import type { ManagerListItem, ManagerSearchField } from "../../types";
import { ManagerDetailsModal } from "../ManagerDetailsModal";
import { ManagerListSkeleton } from "../skeletons";
import { ManagerTable } from "../ManagerTable";
import "./ManagerView.scss";

function isManagerSearchField(value: string): value is ManagerSearchField {
  return value === "name" || value === "email" || value === "phone";
}

export function ManagerView() {
  const { t } = useI18n();
  const managersState = useManagers(t.company.manager.table.loadError);
  const managerDetails = useManagerDetails(
    t.company.manager.details.loadError,
  );
  const [selectedManager, setSelectedManager] =
    useState<ManagerListItem | null>(null);
  const emptyMessage = managersState.hasActiveSearch
    ? t.company.manager.table.noResults
    : t.company.manager.table.empty;
  const searchCopy = t.company.manager.search.fields[
    managersState.searchField
  ];

  function closeManager() {
    setSelectedManager(null);
    managerDetails.closeManager();
  }

  function handleSearchChange(value: string) {
    managersState.setSearchValue(value);
    closeManager();
  }

  function handleSearchFieldChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextField = event.target.value;

    if (!isManagerSearchField(nextField)) {
      return;
    }

    managersState.setSearchField(nextField);
    closeManager();
  }

  function handlePageChange(page: number) {
    managersState.setCurrentPage(page);
    closeManager();
  }

  function handleOpenManager(manager: ManagerListItem) {
    setSelectedManager(manager);
    managerDetails.openManager(manager.internalId);
  }

  return (
    <>
      <section
        aria-busy={managersState.isLoading || managersState.isRefreshing}
        aria-label={t.company.manager.panelAriaLabel}
        className="company-page__panel manager-view"
        id="company-directory-manager-panel"
        role="tabpanel"
      >
        <div className="manager-view__search-controls">
          <label className="manager-view__search-field">
            <span>{t.company.manager.search.fieldLabel}</span>
            <select
              onChange={handleSearchFieldChange}
              value={managersState.searchField}
            >
              <option value="name">
                {t.company.manager.search.fields.name.label}
              </option>
              <option value="email">
                {t.company.manager.search.fields.email.label}
              </option>
              <option value="phone">
                {t.company.manager.search.fields.phone.label}
              </option>
            </select>
          </label>

          <SearchFilterBar
            className="manager-view__search"
            inputAriaLabel={searchCopy.ariaLabel}
            onChange={handleSearchChange}
            placeholder={searchCopy.placeholder}
            showFilterButton={false}
            value={managersState.searchValue}
          />
        </div>

        <div className="company-page__divider" />

        {!managersState.isLoading &&
        managersState.error &&
        managersState.managers.length ? (
          <div className="company-page__state" role="alert">
            <p>{managersState.error || t.company.manager.table.loadError}</p>
            <button
              onClick={() => void managersState.refetch()}
              type="button"
            >
              {t.common.tryAgain}
            </button>
          </div>
        ) : null}

        {managersState.isLoading ? (
          <ManagerListSkeleton />
        ) : managersState.error && !managersState.managers.length ? (
          <div className="company-page__state" role="alert">
            <p>{managersState.error || t.company.manager.table.loadError}</p>
            <button
              onClick={() => void managersState.refetch()}
              type="button"
            >
              {t.common.tryAgain}
            </button>
          </div>
        ) : (
          <ManagerTable
            emptyMessage={emptyMessage}
            managers={managersState.managers}
            onOpenManager={handleOpenManager}
          />
        )}

        {!managersState.isLoading && managersState.managers.length ? (
          <TableFooter
            className="manager-view__footer"
            currentPage={managersState.currentPage}
            onPageChange={handlePageChange}
            perPage={managersState.perPage}
            showPageSizeSelector={false}
            showSinglePage
            totalItems={managersState.totalItems}
            totalPages={managersState.totalPages}
          />
        ) : null}
      </section>

      {selectedManager ? (
        <ManagerDetailsModal
          detailsState={managerDetails.detailsState}
          manager={selectedManager}
          onClose={closeManager}
          onRetry={(managerId) => {
            void managerDetails.retryDetails(managerId);
          }}
        />
      ) : null}
    </>
  );
}

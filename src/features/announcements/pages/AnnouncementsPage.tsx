import { useState } from "react";
import { SearchFilterBar } from "../../../components";
import { useI18n } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
import {
  AnnouncementComposer,
  AnnouncementDeleteDialog,
  AnnouncementEditModal,
  AnnouncementFiltersPanel,
  AnnouncementList,
} from "../components";
import {
  useAnnouncementActions,
  useAnnouncementDetails,
  useAnnouncements,
} from "../hooks";
import type {
  Announcement,
  AnnouncementFormValues,
  AnnouncementUpdateValues,
} from "../types";
import "./AnnouncementsPage.scss";

export function AnnouncementsPage() {
  const { t } = useI18n();
  const announcementsState = useAnnouncements(
    t.announcements.list.loadError,
  );
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<
    number | null
  >(null);
  const [pendingDeletion, setPendingDeletion] =
    useState<Announcement | null>(null);
  const detailsState = useAnnouncementDetails(
    selectedAnnouncementId,
    t.announcements.edit.loadError,
  );
  const actions = useAnnouncementActions({
    createErrorFallback: t.announcements.feedback.createError,
    createSuccessFallback: t.announcements.feedback.createSuccess,
    deleteErrorFallback: t.announcements.feedback.deleteError,
    deleteSuccessFallback: t.announcements.feedback.deleteSuccess,
    updateErrorFallback: t.announcements.feedback.updateError,
    updateSuccessFallback: t.announcements.feedback.updateSuccess,
  });

  async function handleCreate(formValues: AnnouncementFormValues) {
    const succeeded = await actions.runCreate(formValues);

    if (succeeded) {
      await announcementsState.refetch(false);
    }

    return succeeded;
  }

  async function handleUpdate(formValues: AnnouncementUpdateValues) {
    if (selectedAnnouncementId === null) {
      return false;
    }

    const succeeded = await actions.runUpdate(
      selectedAnnouncementId,
      formValues,
    );

    if (succeeded) {
      setSelectedAnnouncementId(null);
      await announcementsState.refetch(false);
    }

    return succeeded;
  }

  async function handleDelete() {
    if (!pendingDeletion) {
      return;
    }

    const succeeded = await actions.runDelete(pendingDeletion.id);

    if (!succeeded) {
      return;
    }

    setPendingDeletion(null);
    setSelectedAnnouncementId(null);

    if (
      announcementsState.announcements.length === 1 &&
      announcementsState.currentPage > 1
    ) {
      announcementsState.setCurrentPage(
        announcementsState.currentPage - 1,
      );
      return;
    }

    await announcementsState.refetch(false);
  }

  function openEditor(announcementId: number) {
    actions.clearUpdateErrors();
    actions.clearDeleteError();
    setSelectedAnnouncementId(announcementId);
  }

  function closeEditor() {
    if (actions.updatePending || actions.deletePending) {
      return;
    }

    actions.clearUpdateErrors();
    setPendingDeletion(null);
    setSelectedAnnouncementId(null);
  }

  const emptyTitle = announcementsState.hasActiveCriteria
    ? t.announcements.list.noResults
    : t.announcements.list.empty;
  const emptyDescription = announcementsState.hasActiveCriteria
    ? t.announcements.list.noResultsDescription
    : t.announcements.list.emptyDescription;

  return (
    <ManagementLayout>
      <div className="announcements-page">
        <header className="announcements-page__header">
          <h1>{t.announcements.title}</h1>
          <p>{t.announcements.description}</p>
        </header>

        {actions.successMessage ? (
          <div
            className="announcements-page__feedback"
            role="status"
          >
            <span>{actions.successMessage}</span>
            <button
              aria-label={t.announcements.feedback.dismiss}
              onClick={actions.clearSuccessMessage}
              type="button"
            >
              {t.common.close}
            </button>
          </div>
        ) : null}

        <div className="announcements-page__grid">
          <AnnouncementComposer
            error={actions.createError}
            fieldErrors={actions.createFieldErrors}
            isPending={actions.createPending}
            onClearErrors={actions.clearCreateErrors}
            onCreate={handleCreate}
          />

          <section
            aria-label={t.announcements.list.panelAriaLabel}
            className="announcements-page__list-column"
          >
            <SearchFilterBar
              className="announcements-page__search"
              filterAriaLabel={t.announcements.filters.filterAriaLabel}
              filterLabel={t.common.filter}
              inputAriaLabel={t.announcements.search.ariaLabel}
              isFilterActive={
                announcementsState.filters.hasActiveFilters
              }
              onChange={announcementsState.setSearchQuery}
              onFilterClick={
                announcementsState.filters.toggleFilterPanel
              }
              placeholder={t.announcements.search.placeholder}
              showFilterButton
              value={announcementsState.searchQuery}
            />

            {announcementsState.filters.isFilterPanelOpen ? (
              <AnnouncementFiltersPanel
                filters={announcementsState.filters.draftFilters}
                onApply={announcementsState.filters.applyFilters}
                onChange={
                  announcementsState.filters.setDraftFilters
                }
                onClear={announcementsState.filters.clearFilters}
              />
            ) : null}

            <AnnouncementList
              announcements={announcementsState.announcements}
              emptyDescription={emptyDescription}
              emptyTitle={emptyTitle}
              error={announcementsState.error}
              isLoading={announcementsState.listLoading}
              pagination={{
                currentPage: announcementsState.currentPage,
                perPage: announcementsState.perPage,
                totalItems: announcementsState.totalItems,
                totalPages: announcementsState.totalPages,
              }}
              onPageChange={announcementsState.setCurrentPage}
              onRetry={() => void announcementsState.refetch(true)}
              onSelect={openEditor}
            />
          </section>
        </div>
      </div>

      {selectedAnnouncementId !== null ? (
        <AnnouncementEditModal
          announcement={detailsState.announcement}
          detailsError={detailsState.error}
          detailsLoading={detailsState.detailsLoading}
          fieldErrors={actions.updateFieldErrors}
          isDeleteDialogOpen={Boolean(pendingDeletion)}
          isUpdatePending={actions.updatePending}
          key={selectedAnnouncementId}
          updateError={actions.updateError}
          onClearErrors={actions.clearUpdateErrors}
          onClose={closeEditor}
          onDelete={() => {
            if (detailsState.announcement) {
              actions.clearDeleteError();
              setPendingDeletion(detailsState.announcement);
            }
          }}
          onRetry={() => void detailsState.retry()}
          onSave={handleUpdate}
        />
      ) : null}

      {pendingDeletion ? (
        <AnnouncementDeleteDialog
          announcement={pendingDeletion}
          error={actions.deleteError}
          isPending={actions.deletePending}
          onCancel={() => {
            if (!actions.deletePending) {
              actions.clearDeleteError();
              setPendingDeletion(null);
            }
          }}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </ManagementLayout>
  );
}

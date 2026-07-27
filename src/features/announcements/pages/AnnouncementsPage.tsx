import { useState } from "react";
import { SearchFilterBar } from "../../../components";
import { useI18n } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
import {
  AnnouncementComposer,
  AnnouncementDeleteDialog,
  AnnouncementEditModal,
  AnnouncementList,
} from "../components";
import { useAnnouncements } from "../hooks";
import type { Announcement } from "../types";
import "./AnnouncementsPage.scss";

export function AnnouncementsPage() {
  const { t } = useI18n();
  const announcementsState = useAnnouncements();
  const [pendingDeletion, setPendingDeletion] =
    useState<Announcement | null>(null);

  return (
    <ManagementLayout>
      <div className="announcements-page">
        <header className="announcements-page__header">
          <h1>{t.announcements.title}</h1>
          <p>{t.announcements.description}</p>
        </header>

        <div className="announcements-page__grid">
          <AnnouncementComposer
            onCreate={announcementsState.createAnnouncement}
          />

          <section
            className="announcements-page__list-column"
            aria-label={t.announcements.list.panelAriaLabel}
          >
            <SearchFilterBar
              className="announcements-page__search"
              inputAriaLabel={t.announcements.search.ariaLabel}
              onChange={announcementsState.setSearchQuery}
              placeholder={t.announcements.search.placeholder}
              showFilterButton={false}
              value={announcementsState.searchQuery}
            />
            <AnnouncementList
              announcements={announcementsState.announcements}
              pagination={announcementsState.pagination}
              onPageChange={announcementsState.setCurrentPage}
              onSelect={announcementsState.selectAnnouncement}
            />
          </section>
        </div>
      </div>

      {announcementsState.selectedAnnouncement ? (
        <AnnouncementEditModal
          announcement={announcementsState.selectedAnnouncement}
          isDeleteDialogOpen={Boolean(pendingDeletion)}
          onClose={announcementsState.closeEditor}
          onDelete={() =>
            setPendingDeletion(announcementsState.selectedAnnouncement)
          }
          onSave={(draft) =>
            announcementsState.updateAnnouncement(
              announcementsState.selectedAnnouncement!.id,
              draft,
            )
          }
        />
      ) : null}

      {pendingDeletion ? (
        <AnnouncementDeleteDialog
          announcement={pendingDeletion}
          onCancel={() => setPendingDeletion(null)}
          onConfirm={() => {
            announcementsState.deleteAnnouncement(pendingDeletion.id);
            setPendingDeletion(null);
          }}
        />
      ) : null}
    </ManagementLayout>
  );
}


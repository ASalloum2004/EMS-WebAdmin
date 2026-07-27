import { useEffect, useMemo, useState } from "react";
import { announcementMockData } from "../data/announcementMockData";
import type {
  Announcement,
  AnnouncementDraft,
  AnnouncementPaginationMeta,
} from "../types";

const ANNOUNCEMENTS_PER_PAGE = 4;

export function filterAnnouncementsByTitle(
  announcements: Announcement[],
  searchQuery: string,
) {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return announcements;
  }

  return announcements.filter((announcement) =>
    announcement.title.toLocaleLowerCase().includes(normalizedQuery),
  );
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    announcementMockData.map((announcement) => ({ ...announcement })),
  );
  const [searchQuery, setSearchQueryState] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const filteredAnnouncements = useMemo(
    () => filterAnnouncementsByTitle(announcements, searchQuery),
    [announcements, searchQuery],
  );
  const lastPage = Math.max(
    1,
    Math.ceil(filteredAnnouncements.length / ANNOUNCEMENTS_PER_PAGE),
  );
  const pageAnnouncements = useMemo(() => {
    const pageStart = (currentPage - 1) * ANNOUNCEMENTS_PER_PAGE;
    return filteredAnnouncements.slice(
      pageStart,
      pageStart + ANNOUNCEMENTS_PER_PAGE,
    );
  }, [currentPage, filteredAnnouncements]);
  const pagination: AnnouncementPaginationMeta = {
    current_page: currentPage,
    per_page: ANNOUNCEMENTS_PER_PAGE,
    total: filteredAnnouncements.length,
    last_page: lastPage,
  };

  useEffect(() => {
    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [currentPage, lastPage]);

  function setSearchQuery(value: string) {
    setSearchQueryState(value);
    setCurrentPage(1);
  }

  function createAnnouncement(draft: AnnouncementDraft) {
    setAnnouncements((currentAnnouncements) => {
      const nextId =
        currentAnnouncements.reduce(
          (highestId, announcement) =>
            Math.max(highestId, announcement.id),
          0,
        ) + 1;

      return [{ id: nextId, ...draft }, ...currentAnnouncements];
    });
    setSearchQueryState("");
    setCurrentPage(1);
  }

  function updateAnnouncement(
    announcementId: number,
    draft: AnnouncementDraft,
  ) {
    setAnnouncements((currentAnnouncements) =>
      currentAnnouncements.map((announcement) =>
        announcement.id === announcementId
          ? { id: announcementId, ...draft }
          : announcement,
      ),
    );
    setSelectedAnnouncement(null);
  }

  function deleteAnnouncement(announcementId: number) {
    setAnnouncements((currentAnnouncements) =>
      currentAnnouncements.filter(
        (announcement) => announcement.id !== announcementId,
      ),
    );
    setSelectedAnnouncement(null);
  }

  return {
    announcements: pageAnnouncements,
    closeEditor: () => setSelectedAnnouncement(null),
    createAnnouncement,
    deleteAnnouncement,
    pagination,
    searchQuery,
    selectAnnouncement: setSelectedAnnouncement,
    selectedAnnouncement,
    setCurrentPage,
    setSearchQuery,
    updateAnnouncement,
  };
}


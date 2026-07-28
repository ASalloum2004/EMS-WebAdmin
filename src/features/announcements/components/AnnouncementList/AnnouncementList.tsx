import { useEffect, useState } from "react";
import { Image, Paperclip } from "lucide-react";
import { addApiMediaRevision } from "../../../../api";
import { Card, TableFooter } from "../../../../components";
import { useI18n } from "../../../../i18n";
import { isImageMedia } from "../../data/announcementMedia";
import type {
  Announcement,
  AnnouncementMediaRevision,
  AnnouncementPagination,
} from "../../types";
import { AnnouncementListSkeleton } from "../skeletons";
import "./AnnouncementList.scss";

interface AnnouncementListProps {
  announcements: Announcement[];
  emptyDescription: string;
  emptyTitle: string;
  error: string;
  isLoading: boolean;
  isRefreshing: boolean;
  mediaRevisions?: Readonly<
    Partial<Record<number, AnnouncementMediaRevision>>
  >;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onSelect: (announcementId: number) => void;
  pagination: AnnouncementPagination;
}

export function AnnouncementList({
  announcements,
  emptyDescription,
  emptyTitle,
  error,
  isLoading,
  isRefreshing,
  mediaRevisions = {},
  onPageChange,
  onRetry,
  onSelect,
  pagination,
}: AnnouncementListProps) {
  const { t } = useI18n();

  return (
    <Card
      aria-busy={isLoading || isRefreshing}
      className="announcement-list-card"
      title={t.announcements.list.title}
      footer={
        !isLoading && !error && pagination.totalItems > 0 ? (
          <TableFooter
            currentPage={pagination.currentPage}
            onPageChange={onPageChange}
            perPage={pagination.perPage}
            showPageSizeSelector={false}
            showSinglePage
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
          />
        ) : undefined
      }
      footerClassName="announcement-list-card__footer"
    >
      {isLoading ? <AnnouncementListSkeleton /> : null}

      {!isLoading && error ? (
        <div className="announcement-list__state" role="alert">
          <p>{error}</p>
          <button onClick={onRetry} type="button">
            {t.common.tryAgain}
          </button>
        </div>
      ) : null}

      {!isLoading && !error && announcements.length ? (
        <div className="announcement-list" role="list">
          {announcements.map((announcement) => {
            const mediaRevision = mediaRevisions[announcement.id];
            const displayMediaUrl =
              mediaRevision?.mediaUrl === announcement.media
                ? addApiMediaRevision(
                    announcement.media,
                    mediaRevision.revision,
                  )
                : announcement.media;

            return (
              <div key={announcement.id} role="listitem">
                <button
                  aria-label={`${t.announcements.list.openEdit} ${announcement.title}`}
                  className={
                    announcement.media
                      ? "announcement-list__row"
                      : "announcement-list__row announcement-list__row--without-media"
                  }
                  type="button"
                  onClick={() => onSelect(announcement.id)}
                >
                  {displayMediaUrl ? (
                    <AnnouncementMedia media={displayMediaUrl} />
                  ) : null}

                  <span className="announcement-list__copy">
                    <strong>{announcement.title}</strong>
                    <span>{announcement.description}</span>
                  </span>

                  <span className="announcement-list__badges">
                    <span className="announcement-list__badge announcement-list__badge--receiver">
                      {t.announcements.audience[announcement.receiver]}
                    </span>
                    <span
                      className={
                        announcement.isDraft
                          ? "announcement-list__badge announcement-list__badge--draft"
                          : "announcement-list__badge announcement-list__badge--published"
                      }
                    >
                      {announcement.isDraft
                        ? t.announcements.status.draft
                        : t.announcements.status.published}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {!isLoading && !error && !announcements.length ? (
        <div className="announcement-list__empty">
          <MegaphoneEmptyState />
          <strong>{emptyTitle}</strong>
          <span>{emptyDescription}</span>
        </div>
      ) : null}
    </Card>
  );
}

function AnnouncementMedia({ media }: { media: string }) {
  const { t } = useI18n();
  const [hasImageError, setHasImageError] = useState(false);
  const showImage = isImageMedia(media) && !hasImageError;

  useEffect(() => {
    setHasImageError(false);
  }, [media]);

  return (
    <span className="announcement-list__media">
      {showImage ? (
        <img
          alt=""
          loading="lazy"
          src={media}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <Paperclip
          aria-label={t.announcements.media.attached}
          size={19}
          strokeWidth={1.8}
        />
      )}
    </span>
  );
}

function MegaphoneEmptyState() {
  return (
    <span className="announcement-list__empty-icon" aria-hidden="true">
      <Image size={22} strokeWidth={1.7} />
    </span>
  );
}

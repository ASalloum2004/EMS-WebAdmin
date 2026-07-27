import { Image, Paperclip } from "lucide-react";
import { Card, TableFooter } from "../../../../components";
import { useI18n } from "../../../../i18n";
import { isImageMedia } from "../../data/announcementMedia";
import type {
  Announcement,
  AnnouncementPaginationMeta,
  AnnouncementReceiver,
} from "../../types";
import "./AnnouncementList.scss";

interface AnnouncementListProps {
  announcements: Announcement[];
  pagination: AnnouncementPaginationMeta;
  onPageChange: (page: number) => void;
  onSelect: (announcement: Announcement) => void;
}

function normalizeReceiver(receiver: string): AnnouncementReceiver {
  const normalizedReceiver = receiver.trim().toLocaleLowerCase();

  if (normalizedReceiver === "exhibitors") {
    return "exhibitors";
  }

  if (normalizedReceiver === "visitors") {
    return "visitors";
  }

  return "all";
}

export function AnnouncementList({
  announcements,
  pagination,
  onPageChange,
  onSelect,
}: AnnouncementListProps) {
  const { t } = useI18n();

  return (
    <Card
      className="announcement-list-card"
      title={t.announcements.list.title}
      footer={
        pagination.total > 0 ? (
          <TableFooter
            currentPage={pagination.current_page}
            onPageChange={onPageChange}
            perPage={pagination.per_page}
            showPageSizeSelector={false}
            showSinglePage
            totalItems={pagination.total}
            totalPages={pagination.last_page}
          />
        ) : undefined
      }
      footerClassName="announcement-list-card__footer"
    >
      {announcements.length ? (
        <div className="announcement-list" role="list">
          {announcements.map((announcement) => {
            const receiver = normalizeReceiver(announcement.receiver);
            const statusLabel = announcement.is_active
              ? t.announcements.status.active
              : t.announcements.status.inactive;

            return (
              <div key={announcement.id} role="listitem">
                <button
                  className={
                    announcement.media
                      ? "announcement-list__row"
                      : "announcement-list__row announcement-list__row--without-media"
                  }
                  type="button"
                  aria-label={`${t.announcements.list.openEdit} ${announcement.title}`}
                  onClick={() => onSelect(announcement)}
                >
                  {announcement.media ? (
                    <span className="announcement-list__media">
                      {isImageMedia(announcement.media) ? (
                        <img src={announcement.media} alt="" />
                      ) : (
                        <Paperclip
                          aria-label={t.announcements.media.attached}
                          size={19}
                          strokeWidth={1.8}
                        />
                      )}
                    </span>
                  ) : null}

                  <span className="announcement-list__copy">
                    <strong>{announcement.title}</strong>
                    <span>{announcement.description}</span>
                  </span>

                  <span className="announcement-list__badges">
                    <span className="announcement-list__badge announcement-list__badge--receiver">
                      {t.announcements.audience[receiver]}
                    </span>
                    <span
                      className={
                        announcement.is_active
                          ? "announcement-list__badge announcement-list__badge--active"
                          : "announcement-list__badge announcement-list__badge--inactive"
                      }
                    >
                      {statusLabel}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="announcement-list__empty">
          <MegaphoneEmptyState />
          <strong>{t.announcements.list.empty}</strong>
          <span>{t.announcements.list.emptyDescription}</span>
        </div>
      )}
    </Card>
  );
}

function MegaphoneEmptyState() {
  return (
    <span className="announcement-list__empty-icon" aria-hidden="true">
      <Image size={22} strokeWidth={1.7} />
    </span>
  );
}

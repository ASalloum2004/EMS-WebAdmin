import { Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./AnnouncementListSkeleton.scss";

type AnnouncementSkeletonRow = {
  descriptionWidth: string;
  id: number;
  receiverWidth: number;
  statusWidth: number;
  titleWidth: string;
};

const SKELETON_ROWS: AnnouncementSkeletonRow[] = [
  {
    descriptionWidth: "92%",
    id: 1,
    receiverWidth: 82,
    statusWidth: 64,
    titleWidth: "58%",
  },
  {
    descriptionWidth: "76%",
    id: 2,
    receiverWidth: 70,
    statusWidth: 76,
    titleWidth: "68%",
  },
  {
    descriptionWidth: "86%",
    id: 3,
    receiverWidth: 88,
    statusWidth: 64,
    titleWidth: "52%",
  },
  {
    descriptionWidth: "70%",
    id: 4,
    receiverWidth: 74,
    statusWidth: 76,
    titleWidth: "62%",
  },
];

export function AnnouncementListSkeleton() {
  const { t } = useI18n();

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.announcements.list.loading}
      </span>
      <div
        aria-hidden="true"
        className="announcement-list announcement-list-skeleton"
      >
        {SKELETON_ROWS.map((row) => (
          <div
            className="announcement-list__row announcement-list-skeleton__row"
            key={row.id}
          >
            <Skeleton
              className="announcement-list-skeleton__media"
              height={44}
              variant="rect"
              width={44}
            />
            <span className="announcement-list__copy announcement-list-skeleton__copy">
              <Skeleton height={18} width={row.titleWidth} />
              <Skeleton height={14} width={row.descriptionWidth} />
              <Skeleton height={14} width="64%" />
            </span>
            <span className="announcement-list__badges">
              <Skeleton
                height={25}
                variant="pill"
                width={row.receiverWidth}
              />
              <Skeleton
                height={25}
                variant="pill"
                width={row.statusWidth}
              />
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

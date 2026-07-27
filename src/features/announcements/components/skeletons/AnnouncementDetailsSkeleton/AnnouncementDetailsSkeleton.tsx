import { Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./AnnouncementDetailsSkeleton.scss";

const AUDIENCE_PLACEHOLDERS = [82, 74, 68] as const;

export function AnnouncementDetailsSkeleton() {
  const { t } = useI18n();

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.announcements.edit.loading}
      </span>
      <div aria-hidden="true" className="announcement-details-skeleton">
        <span className="announcement-details-skeleton__field">
          <Skeleton height={12} width={62} />
          <Skeleton height={44} variant="rect" width="100%" />
        </span>
        <span className="announcement-details-skeleton__field">
          <Skeleton height={12} width={88} />
          <Skeleton height={132} variant="rect" width="100%" />
        </span>
        <span className="announcement-details-skeleton__audience">
          <Skeleton height={12} width={94} />
          <span>
            {AUDIENCE_PLACEHOLDERS.map((width) => (
              <Skeleton
                height={32}
                key={width}
                variant="pill"
                width={width}
              />
            ))}
          </span>
        </span>
        <span className="announcement-details-skeleton__status">
          <Skeleton height={18} variant="rect" width={18} />
          <span>
            <Skeleton height={14} width={96} />
            <Skeleton height={11} width={154} />
          </span>
        </span>
        <span className="announcement-details-skeleton__field">
          <Skeleton height={12} width={54} />
          <Skeleton height={54} variant="rect" width="100%" />
        </span>
      </div>
    </>
  );
}

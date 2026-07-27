import { Card, Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./ProfileIdentitySkeleton.scss";

export function ProfileIdentitySkeleton() {
  const { t } = useI18n();

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.common.loading}
      </span>
      <Card
        aria-busy="true"
        aria-hidden="true"
        className="profile-identity-card profile-identity-skeleton"
      >
        <div className="profile-identity-card__header">
          <div className="profile-identity-card__avatar-wrapper profile-identity-skeleton__avatar">
            <Skeleton height={120} variant="circle" width={120} />
          </div>
          <Skeleton height={32} width={188} />
          <Skeleton height={18} width={112} />
        </div>
        <div className="profile-identity-card__fields">
          {[164, 218].map((valueWidth) => (
            <div className="profile-identity-card__field" key={valueWidth}>
              <Skeleton height={12} width={58} />
              <Skeleton height={20} width={valueWidth} />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

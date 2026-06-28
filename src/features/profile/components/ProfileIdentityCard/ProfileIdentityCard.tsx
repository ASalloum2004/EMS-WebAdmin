import { Card } from "../../../../components";
import { cameraIcon, pencilIcon } from "../../../../assets/Profile";
import "./ProfileIdentityCard.scss";

interface ProfileIdentityCardProps {
  name: string;
  role: string;
  email: string;
  avatarUrl?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileIdentityCard({
  name,
  role,
  email,
  avatarUrl,
}: ProfileIdentityCardProps) {
  return (
    <Card className="profile-identity-card">
      <div className="profile-identity-card__header">
        <div className="profile-identity-card__avatar-wrapper">
          <div className="profile-identity-card__avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${name} profile`} />
            ) : (
              <span>{getInitials(name)}</span>
            )}
          </div>

          <button
            type="button"
            className="profile-identity-card__avatar-action"
            aria-label="Change profile photo"
          >
            <img src={cameraIcon} alt="" aria-hidden="true" />
          </button>
        </div>

        <div>
          <h2>{name}</h2>
          <p>{role}</p>
        </div>
      </div>

      <div className="profile-identity-card__fields">
        <div className="profile-identity-card__field profile-identity-card__field--editable">
          <span className="profile-identity-card__label">Name</span>
          <span className="profile-identity-card__value">{name}</span>

          <button
            type="button"
            className="profile-identity-card__field-edit-button"
            aria-label="Edit profile name"
          >
            <img src={pencilIcon} alt="" aria-hidden="true" />
          </button>
        </div>

        <div className="profile-identity-card__field">
          <span className="profile-identity-card__label">Email</span>
          <span className="profile-identity-card__value">{email}</span>
        </div>
      </div>
    </Card>
  );
}

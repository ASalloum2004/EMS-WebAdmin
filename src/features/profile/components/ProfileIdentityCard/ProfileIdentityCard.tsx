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
    <section className="profile-identity-card">
      <div className="profile-identity-card__header">
        <div className="profile-identity-card__avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt={`${name} profile`} />
          ) : (
            <span>{getInitials(name)}</span>
          )}
        </div>

        <div>
          <h2>{name}</h2>
          <p>{role}</p>
        </div>
      </div>

      <div className="profile-identity-card__fields">
        <div className="profile-identity-card__field">
          <span className="profile-identity-card__label">Name</span>
          <span className="profile-identity-card__value">{name}</span>
        </div>

        <div className="profile-identity-card__field">
          <span className="profile-identity-card__label">Email</span>
          <span className="profile-identity-card__value">{email}</span>
        </div>
      </div>
    </section>
  );
}
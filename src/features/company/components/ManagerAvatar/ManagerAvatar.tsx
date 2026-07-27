import { useEffect, useState } from "react";
import { getCompanyInitials } from "../CompanyLogo";
import "./ManagerAvatar.scss";

type ManagerAvatarProps = {
  large?: boolean;
  manager: {
    avatar: string | null;
    name: string;
  };
};

export function ManagerAvatar({
  large = false,
  manager,
}: ManagerAvatarProps) {
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const avatarSource =
    typeof manager.avatar === "string" ? manager.avatar.trim() : "";

  useEffect(() => {
    setHasAvatarError(false);
  }, [avatarSource]);

  return (
    <span
      aria-hidden="true"
      className={`manager-avatar${large ? " manager-avatar--large" : ""}`}
    >
      {avatarSource && !hasAvatarError ? (
        <img
          alt=""
          onError={() => setHasAvatarError(true)}
          src={avatarSource}
        />
      ) : (
        getCompanyInitials(manager.name)
      )}
    </span>
  );
}

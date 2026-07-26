import { useEffect, useState } from "react";
import type { Manager } from "../../types";
import { getCompanyInitials } from "../CompanyLogo";
import "./ManagerAvatar.scss";

type ManagerAvatarProps = {
  large?: boolean;
  manager: Pick<Manager, "avatar" | "name">;
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

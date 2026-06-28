import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Card } from "../../../../components";
import { cameraIcon, pencilIcon } from "../../../../assets/Profile";
import "./ProfileIdentityCard.scss";

const AVATAR_ACCEPTED_TYPES = "image/jpeg,image/png,image/jpg,image/webp";

interface ProfileIdentityCardProps {
  name: string;
  role: string;
  email: string;
  avatarUrl?: string;
  feedbackMessage?: string;
  isEditingName?: boolean;
  isUpdating?: boolean;
  nameInputValue?: string;
  onAvatarFileSelect?: (file: File | null) => void;
  onCancelNameEdit?: () => void;
  onEditName?: () => void;
  onNameInputChange?: (value: string) => void;
  onSaveName?: () => void;
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
  feedbackMessage = "",
  isEditingName = false,
  isUpdating = false,
  nameInputValue = name,
  onAvatarFileSelect,
  onCancelNameEdit,
  onEditName,
  onNameInputChange,
  onSaveName,
}: ProfileIdentityCardProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [hasAvatarLoadError, setHasAvatarLoadError] = useState(false);
  const shouldShowAvatarImage = Boolean(avatarUrl && !hasAvatarLoadError);
  const nameFieldClassName = `profile-identity-card__field profile-identity-card__field--editable${
    isEditingName ? " profile-identity-card__field--editing" : ""
  }`;

  useEffect(() => {
    setHasAvatarLoadError(false);
  }, [avatarUrl]);

  function handleAvatarActionClick() {
    avatarInputRef.current?.click();
  }

  function handleAvatarInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.currentTarget.files?.[0] ?? null;

    onAvatarFileSelect?.(selectedFile);
    event.currentTarget.value = "";
  }

  return (
    <Card className="profile-identity-card">
      <div className="profile-identity-card__header">
        <div className="profile-identity-card__avatar-wrapper">
          <div className="profile-identity-card__avatar">
            {shouldShowAvatarImage ? (
              <img
                src={avatarUrl}
                alt=""
                aria-hidden="true"
                onError={() => setHasAvatarLoadError(true)}
              />
            ) : (
              <span>{getInitials(name)}</span>
            )}
          </div>

          <button
            type="button"
            className="profile-identity-card__avatar-action"
            aria-label="Change profile photo"
            disabled={isUpdating}
            onClick={handleAvatarActionClick}
          >
            <img src={cameraIcon} alt="" aria-hidden="true" />
          </button>

          <input
            ref={avatarInputRef}
            className="profile-identity-card__avatar-input"
            type="file"
            accept={AVATAR_ACCEPTED_TYPES}
            onChange={handleAvatarInputChange}
          />
        </div>

        <div>
          <h2>{name}</h2>
          <p>{role}</p>
        </div>
      </div>

      <div className="profile-identity-card__fields">
        <div className={nameFieldClassName}>
          <span className="profile-identity-card__label">Name</span>

          {isEditingName ? (
            <>
              <input
                className="profile-identity-card__name-input"
                type="text"
                value={nameInputValue}
                aria-label="Profile name"
                disabled={isUpdating}
                onChange={(event) => onNameInputChange?.(event.target.value)}
              />

              <div className="profile-identity-card__field-actions">
                <button
                  type="button"
                  className="profile-identity-card__action-button profile-identity-card__action-button--primary"
                  disabled={isUpdating}
                  onClick={onSaveName}
                >
                  {isUpdating ? "Saving" : "Save"}
                </button>

                <button
                  type="button"
                  className="profile-identity-card__action-button"
                  disabled={isUpdating}
                  onClick={onCancelNameEdit}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="profile-identity-card__value">{name}</span>

              <button
                type="button"
                className="profile-identity-card__field-edit-button"
                aria-label="Edit profile name"
                disabled={isUpdating}
                onClick={onEditName}
              >
                <img src={pencilIcon} alt="" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        <div className="profile-identity-card__field">
          <span className="profile-identity-card__label">Email</span>
          <span className="profile-identity-card__value">{email}</span>
        </div>
      </div>

      {feedbackMessage ? (
        <p
          className="profile-identity-card__feedback"
          aria-live="polite"
          role="alert"
        >
          {feedbackMessage}
        </p>
      ) : null}
    </Card>
  );
}

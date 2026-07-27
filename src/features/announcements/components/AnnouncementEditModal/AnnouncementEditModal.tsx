import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ImagePlus, Paperclip, Trash2, X } from "lucide-react";
import { ModalCloseButton, Skeleton } from "../../../../components";
import { useI18n } from "../../../../i18n";
import {
  ANNOUNCEMENT_DESCRIPTION_MAX_LENGTH,
  ANNOUNCEMENT_MEDIA_MAX_LENGTH,
  ANNOUNCEMENT_TITLE_MAX_LENGTH,
} from "../../api";
import {
  getMediaLength,
  isImageMedia,
  readMediaFile,
} from "../../data/announcementMedia";
import type {
  Announcement,
  AnnouncementFieldErrors,
  AnnouncementFormReceiver,
  AnnouncementMediaUpdate,
  AnnouncementUpdateValues,
} from "../../types";
import "./AnnouncementEditModal.scss";

const receiverOptions: AnnouncementFormReceiver[] = [
  "exhibitors",
  "visitors",
  "all",
];

interface AnnouncementEditModalProps {
  announcement: Announcement | null;
  detailsError: string;
  detailsLoading: boolean;
  fieldErrors: AnnouncementFieldErrors;
  isDeleteDialogOpen: boolean;
  isUpdatePending: boolean;
  onClearErrors: () => void;
  onClose: () => void;
  onDelete: () => void;
  onRetry: () => void;
  onSave: (announcement: AnnouncementUpdateValues) => Promise<boolean>;
  updateError: string;
}

export function AnnouncementEditModal({
  announcement,
  detailsError,
  detailsLoading,
  fieldErrors,
  isDeleteDialogOpen,
  isUpdatePending,
  onClearErrors,
  onClose,
  onDelete,
  onRetry,
  onSave,
  updateError,
}: AnnouncementEditModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const mediaInputId = useId();
  const mediaErrorId = useId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [receiver, setReceiver] =
    useState<AnnouncementFormReceiver>("all");
  const [isDraft, setIsDraft] = useState(true);
  const [media, setMedia] = useState<string | null>(null);
  const [mediaName, setMediaName] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [mediaUpdate, setMediaUpdate] =
    useState<AnnouncementMediaUpdate>("preserve");
  const [mediaInputKey, setMediaInputKey] = useState(0);
  const mediaReadIdRef = useRef(0);
  const isSaveDisabled =
    isUpdatePending || !title.trim() || !description.trim();

  useLayoutEffect(() => {
    if (!announcement) {
      return;
    }

    setTitle(announcement.title);
    setDescription(announcement.description);
    setReceiver(
      announcement.receiver === "unknown" ? "all" : announcement.receiver,
    );
    setIsDraft(announcement.isDraft);
    setMedia(announcement.media);
    setMediaName("");
    setMediaError("");
    setMediaUpdate("preserve");
    setMediaInputKey((currentKey) => currentKey + 1);
  }, [announcement]);

  useEffect(() => {
    if (isDeleteDialogOpen || isUpdatePending) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDeleteDialogOpen, isUpdatePending, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      mediaReadIdRef.current += 1;
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function clearMedia() {
    mediaReadIdRef.current += 1;
    setMedia(null);
    setMediaName("");
    setMediaError("");
    setMediaUpdate("remove");
    setMediaInputKey((currentKey) => currentKey + 1);
    onClearErrors();
  }

  async function handleMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    const mediaReadId = mediaReadIdRef.current + 1;
    mediaReadIdRef.current = mediaReadId;
    setMediaError("");
    onClearErrors();

    try {
      const nextMedia = await readMediaFile(file);

      if (mediaReadId !== mediaReadIdRef.current) {
        return;
      }

      if (getMediaLength(nextMedia) > ANNOUNCEMENT_MEDIA_MAX_LENGTH) {
        setMediaError(t.announcements.media.tooLarge);
        setMediaInputKey((currentKey) => currentKey + 1);
        return;
      }

      setMedia(nextMedia);
      setMediaName(file.name);
      setMediaUpdate("replace");
    } catch {
      if (mediaReadId === mediaReadIdRef.current) {
        setMediaError(t.announcements.media.readError);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!announcement || isSaveDisabled || mediaError) {
      return;
    }

    await onSave({
      description: description.trim(),
      isDraft,
      media,
      mediaUpdate,
      receiver,
      title: title.trim(),
    });
  }

  const canClose = !isUpdatePending && !isDeleteDialogOpen;

  return (
    <div className="announcement-edit-modal" role="presentation">
      <div
        className="announcement-edit-modal__backdrop"
        onClick={canClose ? onClose : undefined}
      />
      <form
        aria-busy={detailsLoading || isUpdatePending}
        aria-labelledby={titleId}
        aria-modal="true"
        className="announcement-edit-modal__panel"
        role="dialog"
        onSubmit={handleSubmit}
      >
        <header className="announcement-edit-modal__header">
          <div>
            <h2 id={titleId}>{t.announcements.edit.title}</h2>
            <p>{t.announcements.edit.description}</p>
          </div>
          <ModalCloseButton
            ariaLabel={t.announcements.edit.closeAriaLabel}
            disabled={!canClose}
            onClick={onClose}
          />
        </header>

        {detailsLoading ? (
          <AnnouncementEditSkeleton label={t.announcements.edit.loading} />
        ) : null}

        {!detailsLoading && detailsError ? (
          <div className="announcement-edit-modal__state" role="alert">
            <p>{detailsError}</p>
            <button onClick={onRetry} type="button">
              {t.common.tryAgain}
            </button>
          </div>
        ) : null}

        {!detailsLoading && !detailsError && announcement ? (
          <>
            <div className="announcement-edit-modal__body">
              <label className="announcement-form__field">
                <span>{t.announcements.fields.title}</span>
                <input
                  aria-invalid={Boolean(fieldErrors.title)}
                  disabled={isUpdatePending}
                  maxLength={ANNOUNCEMENT_TITLE_MAX_LENGTH}
                  required
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    onClearErrors();
                  }}
                />
                {fieldErrors.title ? (
                  <span className="announcement-form__error" role="alert">
                    {fieldErrors.title}
                  </span>
                ) : null}
              </label>

              <label className="announcement-form__field">
                <span>{t.announcements.fields.description}</span>
                <textarea
                  aria-invalid={Boolean(fieldErrors.description)}
                  disabled={isUpdatePending}
                  maxLength={ANNOUNCEMENT_DESCRIPTION_MAX_LENGTH}
                  required
                  rows={7}
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    onClearErrors();
                  }}
                />
                {fieldErrors.description ? (
                  <span className="announcement-form__error" role="alert">
                    {fieldErrors.description}
                  </span>
                ) : null}
              </label>

              <fieldset className="announcement-form__audience">
                <legend>{t.announcements.fields.receiver}</legend>
                <div className="announcement-form__audience-options">
                  {receiverOptions.map((option) => (
                    <label key={option}>
                      <input
                        checked={receiver === option}
                        disabled={isUpdatePending}
                        name="edit-announcement-receiver"
                        type="radio"
                        value={option}
                        onChange={() => {
                          setReceiver(option);
                          onClearErrors();
                        }}
                      />
                      <span>{t.announcements.audience[option]}</span>
                    </label>
                  ))}
                </div>
                {fieldErrors.receiver ? (
                  <span className="announcement-form__error" role="alert">
                    {fieldErrors.receiver}
                  </span>
                ) : null}
              </fieldset>

              <label className="announcement-form__status">
                <input
                  checked={isDraft}
                  disabled={isUpdatePending}
                  type="checkbox"
                  onChange={(event) => {
                    setIsDraft(event.target.checked);
                    onClearErrors();
                  }}
                />
                <span>
                  <strong>{t.announcements.fields.draft}</strong>
                  <small>{t.announcements.fields.draftHelper}</small>
                </span>
              </label>

              <div className="announcement-form__media-field">
                <span className="announcement-form__label">
                  {t.announcements.fields.media}
                </span>

                {media ? (
                  <div className="announcement-form__media-preview">
                    {isImageMedia(media) ? (
                      <img
                        alt={t.announcements.media.previewAlt}
                        loading="lazy"
                        src={media}
                      />
                    ) : (
                      <Paperclip
                        aria-hidden="true"
                        size={20}
                        strokeWidth={1.8}
                      />
                    )}
                    <span>{
                      mediaName || t.announcements.media.attached
                    }</span>
                    <button
                      aria-label={t.announcements.media.remove}
                      disabled={isUpdatePending}
                      type="button"
                      onClick={clearMedia}
                    >
                      <X aria-hidden="true" size={17} />
                    </button>
                  </div>
                ) : (
                  <div className="announcement-edit-modal__no-media">
                    <span>{t.announcements.media.none}</span>
                    <label htmlFor={mediaInputId}>
                      <ImagePlus
                        aria-hidden="true"
                        size={17}
                        strokeWidth={1.8}
                      />
                      {t.announcements.media.add}
                    </label>
                  </div>
                )}

                {media ? (
                  <label
                    className="announcement-edit-modal__replace-media"
                    htmlFor={mediaInputId}
                  >
                    <ImagePlus
                      aria-hidden="true"
                      size={17}
                      strokeWidth={1.8}
                    />
                    {t.announcements.media.replace}
                  </label>
                ) : null}

                <input
                  accept="image/*,application/pdf"
                  aria-describedby={
                    mediaError || fieldErrors.media
                      ? mediaErrorId
                      : undefined
                  }
                  aria-invalid={Boolean(mediaError || fieldErrors.media)}
                  className="announcement-form__file-input"
                  disabled={isUpdatePending}
                  id={mediaInputId}
                  key={mediaInputKey}
                  type="file"
                  onChange={handleMediaChange}
                />
                {mediaError || fieldErrors.media ? (
                  <span
                    className="announcement-form__error"
                    id={mediaErrorId}
                    role="alert"
                  >
                    {mediaError || fieldErrors.media}
                  </span>
                ) : null}
              </div>

              {updateError ? (
                <p className="announcement-form__feedback" role="alert">
                  {updateError}
                </p>
              ) : null}
            </div>

            <footer className="announcement-edit-modal__actions">
              <button
                className="announcement-edit-modal__button announcement-edit-modal__button--delete"
                disabled={isUpdatePending}
                type="button"
                onClick={onDelete}
              >
                <Trash2 aria-hidden="true" size={17} strokeWidth={1.9} />
                {t.announcements.actions.delete}
              </button>
              <span className="announcement-edit-modal__action-group">
                <button
                  className="announcement-edit-modal__button announcement-edit-modal__button--secondary"
                  disabled={isUpdatePending}
                  type="button"
                  onClick={onClose}
                >
                  {t.common.cancel}
                </button>
                <button
                  className="announcement-edit-modal__button announcement-edit-modal__button--primary"
                  disabled={isSaveDisabled || Boolean(mediaError)}
                  type="submit"
                >
                  {isUpdatePending
                    ? t.announcements.actions.saving
                    : t.announcements.actions.save}
                </button>
              </span>
            </footer>
          </>
        ) : null}
      </form>
    </div>
  );
}

function AnnouncementEditSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-label={label}
      className="announcement-edit-modal__skeleton"
      role="status"
    >
      <Skeleton height={44} width="100%" />
      <Skeleton height={132} width="100%" />
      <Skeleton height={48} width="100%" />
      <Skeleton height={72} width="100%" />
    </div>
  );
}

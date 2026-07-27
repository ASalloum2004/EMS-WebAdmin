import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ImagePlus, Paperclip, Trash2, X } from "lucide-react";
import { ModalCloseButton } from "../../../../components";
import { useI18n } from "../../../../i18n";
import {
  isImageMedia,
  readMediaFile,
} from "../../data/announcementMedia";
import type {
  Announcement,
  AnnouncementDraft,
  AnnouncementReceiver,
} from "../../types";
import "./AnnouncementEditModal.scss";

const receiverOptions: AnnouncementReceiver[] = [
  "exhibitors",
  "visitors",
  "all",
];

interface AnnouncementEditModalProps {
  announcement: Announcement;
  isDeleteDialogOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onSave: (announcement: AnnouncementDraft) => void;
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

export function AnnouncementEditModal({
  announcement,
  isDeleteDialogOpen,
  onClose,
  onDelete,
  onSave,
}: AnnouncementEditModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const mediaInputId = useId();
  const [title, setTitle] = useState(announcement.title);
  const [description, setDescription] = useState(announcement.description);
  const [receiver, setReceiver] = useState<AnnouncementReceiver>(() =>
    normalizeReceiver(announcement.receiver),
  );
  const [isActive, setIsActive] = useState(announcement.is_active);
  const [media, setMedia] = useState<string | null>(announcement.media);
  const [mediaName, setMediaName] = useState("");
  const [mediaInputKey, setMediaInputKey] = useState(0);
  const isSaveDisabled = !title.trim() || !description.trim();

  useEffect(() => {
    if (isDeleteDialogOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDeleteDialogOpen, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function clearMedia() {
    setMedia(null);
    setMediaName("");
    setMediaInputKey((currentKey) => currentKey + 1);
  }

  async function handleMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    try {
      setMedia(await readMediaFile(file));
      setMediaName(file.name);
    } catch {
      clearMedia();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaveDisabled) {
      return;
    }

    onSave({
      description: description.trim(),
      is_active: isActive,
      media,
      receiver,
      title: title.trim(),
    });
  }

  return (
    <div className="announcement-edit-modal" role="presentation">
      <div className="announcement-edit-modal__backdrop" onClick={onClose} />
      <form
        className="announcement-edit-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
      >
        <header className="announcement-edit-modal__header">
          <div>
            <h2 id={titleId}>{t.announcements.edit.title}</h2>
            <p>{t.announcements.edit.description}</p>
          </div>
          <ModalCloseButton
            ariaLabel={t.announcements.edit.closeAriaLabel}
            onClick={onClose}
          />
        </header>

        <div className="announcement-edit-modal__body">
          <label className="announcement-form__field">
            <span>{t.announcements.fields.title}</span>
            <input
              required
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="announcement-form__field">
            <span>{t.announcements.fields.description}</span>
            <textarea
              required
              rows={7}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <fieldset className="announcement-form__audience">
            <legend>{t.announcements.fields.receiver}</legend>
            <div className="announcement-form__audience-options">
              {receiverOptions.map((option) => (
                <label key={option}>
                  <input
                    checked={receiver === option}
                    name="edit-announcement-receiver"
                    type="radio"
                    value={option}
                    onChange={() => setReceiver(option)}
                  />
                  <span>{t.announcements.audience[option]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="announcement-form__status">
            <input
              checked={isActive}
              type="checkbox"
              onChange={(event) => setIsActive(event.target.checked)}
            />
            <span>
              <strong>{t.announcements.fields.active}</strong>
              <small>{t.announcements.fields.activeHelper}</small>
            </span>
          </label>

          <div className="announcement-form__media-field">
            <span className="announcement-form__label">
              {t.announcements.fields.media}
            </span>

            {media ? (
              <div className="announcement-form__media-preview">
                {isImageMedia(media) ? (
                  <img src={media} alt={t.announcements.media.previewAlt} />
                ) : (
                  <Paperclip aria-hidden="true" size={20} strokeWidth={1.8} />
                )}
                <span>{mediaName || t.announcements.media.attached}</span>
                <button
                  aria-label={t.announcements.media.remove}
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
                  <ImagePlus aria-hidden="true" size={17} strokeWidth={1.8} />
                  {t.announcements.media.add}
                </label>
              </div>
            )}

            {media ? (
              <label
                className="announcement-edit-modal__replace-media"
                htmlFor={mediaInputId}
              >
                <ImagePlus aria-hidden="true" size={17} strokeWidth={1.8} />
                {t.announcements.media.replace}
              </label>
            ) : null}

            <input
              accept="image/*,application/pdf"
              id={mediaInputId}
              key={mediaInputKey}
              className="announcement-form__file-input"
              type="file"
              onChange={handleMediaChange}
            />
          </div>
        </div>

        <footer className="announcement-edit-modal__actions">
          <button
            className="announcement-edit-modal__button announcement-edit-modal__button--delete"
            type="button"
            onClick={onDelete}
          >
            <Trash2 aria-hidden="true" size={17} strokeWidth={1.9} />
            {t.announcements.actions.delete}
          </button>
          <span className="announcement-edit-modal__action-group">
            <button
              className="announcement-edit-modal__button announcement-edit-modal__button--secondary"
              type="button"
              onClick={onClose}
            >
              {t.common.cancel}
            </button>
            <button
              className="announcement-edit-modal__button announcement-edit-modal__button--primary"
              disabled={isSaveDisabled}
              type="submit"
            >
              {t.announcements.actions.save}
            </button>
          </span>
        </footer>
      </form>
    </div>
  );
}


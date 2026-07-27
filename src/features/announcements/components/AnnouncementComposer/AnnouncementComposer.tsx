import {
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ImagePlus, Megaphone, Paperclip, X } from "lucide-react";
import { Card } from "../../../../components";
import { useI18n } from "../../../../i18n";
import {
  isImageMedia,
  readMediaFile,
} from "../../data/announcementMedia";
import type {
  AnnouncementDraft,
  AnnouncementReceiver,
} from "../../types";
import "./AnnouncementComposer.scss";

const receiverOptions: AnnouncementReceiver[] = [
  "exhibitors",
  "visitors",
  "all",
];

interface AnnouncementComposerProps {
  onCreate: (announcement: AnnouncementDraft) => void;
}

export function AnnouncementComposer({
  onCreate,
}: AnnouncementComposerProps) {
  const { t } = useI18n();
  const mediaInputId = useId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [receiver, setReceiver] = useState<AnnouncementReceiver>("all");
  const [isActive, setIsActive] = useState(true);
  const [media, setMedia] = useState<string | null>(null);
  const [mediaName, setMediaName] = useState("");
  const [mediaInputKey, setMediaInputKey] = useState(0);
  const isCreateDisabled = !title.trim() || !description.trim();

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

    if (isCreateDisabled) {
      return;
    }

    onCreate({
      description: description.trim(),
      is_active: isActive,
      media,
      receiver,
      title: title.trim(),
    });
    setTitle("");
    setDescription("");
    setReceiver("all");
    setIsActive(true);
    clearMedia();
  }

  return (
    <Card
      className="announcement-composer"
      icon={<Megaphone aria-hidden="true" size={22} strokeWidth={1.8} />}
      iconClassName="announcement-composer__icon"
      title={t.announcements.composer.title}
    >
      <form className="announcement-form" onSubmit={handleSubmit}>
        <fieldset className="announcement-form__audience">
          <legend>{t.announcements.fields.receiver}</legend>
          <div className="announcement-form__audience-options">
            {receiverOptions.map((option) => (
              <label key={option}>
                <input
                  checked={receiver === option}
                  name="announcement-receiver"
                  type="radio"
                  value={option}
                  onChange={() => setReceiver(option)}
                />
                <span>{t.announcements.audience[option]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="announcement-form__field">
          <span>{t.announcements.fields.title}</span>
          <input
            required
            type="text"
            value={title}
            placeholder={t.announcements.fields.titlePlaceholder}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="announcement-form__field">
          <span>{t.announcements.fields.description}</span>
          <textarea
            required
            rows={6}
            value={description}
            placeholder={t.announcements.fields.descriptionPlaceholder}
            onChange={(event) => setDescription(event.target.value)}
          />
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
            <label className="announcement-form__upload" htmlFor={mediaInputId}>
              <ImagePlus aria-hidden="true" size={20} strokeWidth={1.8} />
              <span>
                <strong>{t.announcements.media.choose}</strong>
                <small>{t.announcements.media.helper}</small>
              </span>
            </label>
          )}

          <input
            accept="image/*,application/pdf"
            id={mediaInputId}
            key={mediaInputKey}
            className="announcement-form__file-input"
            type="file"
            onChange={handleMediaChange}
          />
        </div>

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

        <button
          className="announcement-form__submit"
          disabled={isCreateDisabled}
          type="submit"
        >
          <Megaphone aria-hidden="true" size={18} strokeWidth={1.9} />
          <span>{t.announcements.actions.create}</span>
        </button>
      </form>
    </Card>
  );
}


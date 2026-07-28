import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ImagePlus, Megaphone, Paperclip, X } from "lucide-react";
import { Card } from "../../../../components";
import { useI18n } from "../../../../i18n";
import {
  ANNOUNCEMENT_DESCRIPTION_MAX_LENGTH,
  ANNOUNCEMENT_MEDIA_MAX_BYTES,
  ANNOUNCEMENT_TITLE_MAX_LENGTH,
} from "../../api";
import {
  ANNOUNCEMENT_MEDIA_ACCEPTED_TYPES,
  getAnnouncementMediaValidationError,
  isImageMediaFile,
} from "../../data/announcementMedia";
import type {
  AnnouncementFieldErrors,
  AnnouncementFormReceiver,
  AnnouncementFormValues,
} from "../../types";
import "./AnnouncementComposer.scss";

const receiverOptions: AnnouncementFormReceiver[] = [
  "exhibitors",
  "visitors",
  "all",
];

interface AnnouncementComposerProps {
  error: string;
  fieldErrors: AnnouncementFieldErrors;
  isPending: boolean;
  onClearErrors: () => void;
  onCreate: (announcement: AnnouncementFormValues) => Promise<boolean>;
}

export function AnnouncementComposer({
  error,
  fieldErrors,
  isPending,
  onClearErrors,
  onCreate,
}: AnnouncementComposerProps) {
  const { t } = useI18n();
  const mediaInputId = useId();
  const mediaErrorId = useId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [receiver, setReceiver] =
    useState<AnnouncementFormReceiver>("all");
  const [isDraft, setIsDraft] = useState(true);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [mediaInputKey, setMediaInputKey] = useState(0);
  const mediaPreviewUrlRef = useRef("");
  const isCreateDisabled =
    isPending || !title.trim() || !description.trim();

  useEffect(
    () => () => {
      if (mediaPreviewUrlRef.current) {
        URL.revokeObjectURL(mediaPreviewUrlRef.current);
        mediaPreviewUrlRef.current = "";
      }
    },
    [],
  );

  function replaceMediaPreview(nextPreviewUrl: string) {
    if (mediaPreviewUrlRef.current) {
      URL.revokeObjectURL(mediaPreviewUrlRef.current);
    }

    mediaPreviewUrlRef.current = nextPreviewUrl;
    setMediaPreviewUrl(nextPreviewUrl);
  }

  function clearMedia() {
    replaceMediaPreview("");
    setMediaFile(null);
    setMediaError("");
    setMediaInputKey((currentKey) => currentKey + 1);
    onClearErrors();
  }

  function handleMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    onClearErrors();
    const validationError = getAnnouncementMediaValidationError(
      file,
      ANNOUNCEMENT_MEDIA_MAX_BYTES,
    );

    if (validationError) {
      setMediaError(t.announcements.media[validationError]);
      setMediaInputKey((currentKey) => currentKey + 1);
      return;
    }

    const nextPreviewUrl = isImageMediaFile(file)
      ? URL.createObjectURL(file)
      : "";

    replaceMediaPreview(nextPreviewUrl);
    setMediaFile(file);
    setMediaError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCreateDisabled || mediaError) {
      return;
    }

    const succeeded = await onCreate({
      description: description.trim(),
      isDraft,
      mediaFile,
      receiver,
      title: title.trim(),
    });

    if (!succeeded) {
      return;
    }

    setTitle("");
    setDescription("");
    setReceiver("all");
    setIsDraft(true);
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
                  disabled={isPending}
                  name="announcement-receiver"
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

        <label className="announcement-form__field">
          <span>{t.announcements.fields.title}</span>
          <input
            aria-invalid={Boolean(fieldErrors.title)}
            disabled={isPending}
            maxLength={ANNOUNCEMENT_TITLE_MAX_LENGTH}
            required
            type="text"
            value={title}
            placeholder={t.announcements.fields.titlePlaceholder}
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
            disabled={isPending}
            maxLength={ANNOUNCEMENT_DESCRIPTION_MAX_LENGTH}
            required
            rows={6}
            value={description}
            placeholder={t.announcements.fields.descriptionPlaceholder}
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

        <div className="announcement-form__media-field">
          <span className="announcement-form__label">
            {t.announcements.fields.media}
          </span>

          {mediaFile ? (
            <div className="announcement-form__media-preview">
              {mediaPreviewUrl ? (
                <img
                  alt={t.announcements.media.previewAlt}
                  loading="lazy"
                  src={mediaPreviewUrl}
                />
              ) : (
                <Paperclip aria-hidden="true" size={20} strokeWidth={1.8} />
              )}
              <span>{mediaFile.name}</span>
              <button
                aria-label={t.announcements.media.remove}
                disabled={isPending}
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
            accept={ANNOUNCEMENT_MEDIA_ACCEPTED_TYPES.join(",")}
            aria-describedby={
              mediaError || fieldErrors.media ? mediaErrorId : undefined
            }
            aria-invalid={Boolean(mediaError || fieldErrors.media)}
            className="announcement-form__file-input"
            disabled={isPending}
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

        <label className="announcement-form__status">
          <input
            checked={isDraft}
            disabled={isPending}
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
        {fieldErrors.isDraft ? (
          <span className="announcement-form__error" role="alert">
            {fieldErrors.isDraft}
          </span>
        ) : null}

        {error ? (
          <p className="announcement-form__feedback" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="announcement-form__submit"
          disabled={isCreateDisabled || Boolean(mediaError)}
          type="submit"
        >
          <Megaphone aria-hidden="true" size={18} strokeWidth={1.9} />
          <span>
            {isPending
              ? t.announcements.actions.creating
              : t.announcements.actions.create}
          </span>
        </button>
      </form>
    </Card>
  );
}

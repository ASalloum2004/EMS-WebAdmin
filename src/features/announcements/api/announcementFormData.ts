import { getAnnouncementApiReceiver } from "../mappers";
import type {
  AnnouncementFormValues,
  AnnouncementUpdateValues,
} from "../types";

function appendAnnouncementFields(
  formData: FormData,
  values: AnnouncementFormValues,
) {
  formData.append("title", values.title.trim());
  formData.append("description", values.description.trim());
  formData.append(
    "receiver",
    getAnnouncementApiReceiver(values.receiver),
  );
  formData.append("is_active", values.isDraft ? "1" : "0");
}

export function buildCreateAnnouncementFormData(
  values: AnnouncementFormValues,
) {
  const formData = new FormData();

  appendAnnouncementFields(formData, values);

  if (values.mediaFile) {
    formData.append("media", values.mediaFile, values.mediaFile.name);
  }

  return formData;
}

export function buildUpdateAnnouncementFormData(
  values: AnnouncementUpdateValues,
) {
  const formData = new FormData();

  formData.append("_method", "PATCH");
  appendAnnouncementFields(formData, values);

  if (values.mediaUpdate === "replace") {
    if (!values.mediaFile) {
      throw new Error("A replacement media file is required.");
    }

    formData.append("media", values.mediaFile, values.mediaFile.name);
  } else if (values.mediaUpdate === "remove") {
    // Laravel converts an empty multipart scalar to null before validating the
    // backend's nullable media field. This is distinct from the string "null".
    formData.append("media", "");
  }

  return formData;
}

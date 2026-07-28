import { apiRequest } from "../../../api";
import type { AnnouncementFormValues } from "../types";
import {
  ANNOUNCEMENTS_PATH,
  normalizeAnnouncementActionResponse,
} from "./announcementApiShared";
import { buildCreateAnnouncementFormData } from "./announcementFormData";

export async function createAnnouncement(
  formValues: AnnouncementFormValues,
  signal?: AbortSignal,
) {
  const response = await apiRequest<unknown>(ANNOUNCEMENTS_PATH, {
    body: buildCreateAnnouncementFormData(formValues),
    method: "POST",
    requiresAuth: true,
    signal,
  });

  return normalizeAnnouncementActionResponse(response);
}

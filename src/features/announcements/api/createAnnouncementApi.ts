import { apiRequest } from "../../../api";
import { mapAnnouncementFormValuesToRequest } from "../mappers";
import type { AnnouncementFormValues } from "../types";
import {
  ANNOUNCEMENTS_PATH,
  normalizeAnnouncementActionResponse,
} from "./announcementApiShared";

export async function createAnnouncement(
  formValues: AnnouncementFormValues,
  signal?: AbortSignal,
) {
  const response = await apiRequest<unknown>(ANNOUNCEMENTS_PATH, {
    body: JSON.stringify(mapAnnouncementFormValuesToRequest(formValues)),
    method: "POST",
    requiresAuth: true,
    signal,
  });

  return normalizeAnnouncementActionResponse(response);
}

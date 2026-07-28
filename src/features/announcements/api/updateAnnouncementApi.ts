import { apiRequest } from "../../../api";
import type { AnnouncementUpdateValues } from "../types";
import {
  buildAnnouncementPath,
  normalizeAnnouncementActionResponse,
} from "./announcementApiShared";
import { buildUpdateAnnouncementFormData } from "./announcementFormData";

export async function updateAnnouncement(
  announcementId: number,
  formValues: AnnouncementUpdateValues,
  signal?: AbortSignal,
) {
  const response = await apiRequest<unknown>(
    buildAnnouncementPath(announcementId),
    {
      body: buildUpdateAnnouncementFormData(formValues),
      method: "POST",
      requiresAuth: true,
      signal,
    },
  );

  return normalizeAnnouncementActionResponse(response);
}

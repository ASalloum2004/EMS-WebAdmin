import { apiRequest } from "../../../api";
import { mapAnnouncementUpdateValuesToRequest } from "../mappers";
import type { AnnouncementUpdateValues } from "../types";
import {
  buildAnnouncementPath,
  normalizeAnnouncementActionResponse,
} from "./announcementApiShared";

export async function updateAnnouncement(
  announcementId: number,
  formValues: AnnouncementUpdateValues,
  signal?: AbortSignal,
) {
  const response = await apiRequest<unknown>(
    buildAnnouncementPath(announcementId),
    {
      body: JSON.stringify(
        mapAnnouncementUpdateValuesToRequest(formValues),
      ),
      method: "PATCH",
      requiresAuth: true,
      signal,
    },
  );

  return normalizeAnnouncementActionResponse(response);
}

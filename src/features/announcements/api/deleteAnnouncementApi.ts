import { apiRequest } from "../../../api";
import {
  buildAnnouncementPath,
  normalizeAnnouncementActionResponse,
} from "./announcementApiShared";

export async function deleteAnnouncement(
  announcementId: number,
  signal?: AbortSignal,
) {
  const response = await apiRequest<unknown>(
    buildAnnouncementPath(announcementId),
    {
      method: "DELETE",
      requiresAuth: true,
      signal,
    },
  );

  return normalizeAnnouncementActionResponse(response);
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { ApiRequestError, isAbortError } from "../../../api";
import { useAuth } from "../../../context";
import { useI18n } from "../../../i18n";
import { getProfile } from "../api";
import {
  applyStoredProfileAvatarRevision,
  clearProfileSessionCache,
  getCachedProfile,
  setCachedProfile,
} from "../data";
import type { AdminProfile } from "../types";

interface ProfileContextValue {
  error: string;
  isLoading: boolean;
  profile: AdminProfile | null;
  refreshProfile: () => Promise<AdminProfile | null>;
  setProfile: (profile: AdminProfile | null) => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

interface ActiveProfileRequest {
  controller: AbortController;
  id: symbol;
  promise: Promise<AdminProfile | null>;
  sessionUserId: string;
}

type SessionRecord = Record<string, unknown>;

function isSessionRecord(value: unknown): value is SessionRecord {
  return typeof value === "object" && value !== null;
}

function getSessionUserId(value: unknown): string | null {
  if (!isSessionRecord(value)) {
    return null;
  }

  const user = value.user;

  if (isSessionRecord(user)) {
    const userId = user.id;

    if (
      (typeof userId === "string" && userId.trim()) ||
      typeof userId === "number"
    ) {
      return String(userId);
    }
  }

  return getSessionUserId(value.data);
}

function getProfileSessionId(session: unknown) {
  if (!session) {
    return null;
  }

  // Older/staged API responses may wrap the authenticated user in `data`.
  // Login and logout still clear this session-scoped cache when no id exists.
  return getSessionUserId(session) ?? "authenticated-session";
}

function getValidationErrorMessage(errors: Record<string, unknown> = {}) {
  return ["name", "avatar"]
    .flatMap((field) => getFieldMessages(errors[field]))
    .join(" ");
}

function getFieldMessages(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(isNonEmptyString);
  }

  return isNonEmptyString(value) ? [value] : [];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

export function getProfileErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  const validationMessage =
    error instanceof ApiRequestError
      ? getValidationErrorMessage(error.errors)
      : "";

  if (validationMessage) {
    return validationMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { t } = useI18n();
  const sessionUserId = getProfileSessionId(session);
  const [profile, setProfileState] = useState<AdminProfile | null>(() =>
    sessionUserId ? getCachedProfile(sessionUserId) : null,
  );
  const [profileSessionUserId, setProfileSessionUserId] =
    useState(sessionUserId);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(sessionUserId && !getCachedProfile(sessionUserId)),
  );
  const activeRequestRef = useRef<ActiveProfileRequest | null>(null);
  const currentSessionUserIdRef = useRef(sessionUserId);
  currentSessionUserIdRef.current = sessionUserId;

  const refreshProfile = useCallback(() => {
    if (!sessionUserId) {
      return Promise.resolve(null);
    }

    const activeRequest = activeRequestRef.current;

    if (activeRequest?.sessionUserId === sessionUserId) {
      return activeRequest.promise;
    }

    setError("");
    setIsLoading(true);
    const controller = new AbortController();
    const requestId = Symbol("profile-request");

    const requestPromise = (async () => {
      try {
        const nextProfile = applyStoredProfileAvatarRevision(
          await getProfile(controller.signal),
        );

        if (currentSessionUserIdRef.current !== sessionUserId) {
          return null;
        }

        setCachedProfile(sessionUserId, nextProfile);
        setProfileState(nextProfile);
        setProfileSessionUserId(sessionUserId);
        return nextProfile;
      } catch (profileError) {
        if (
          !isAbortError(profileError) &&
          currentSessionUserIdRef.current === sessionUserId
        ) {
          setError(
            getProfileErrorMessage(profileError, t.profile.loadError),
          );
        }

        return null;
      } finally {
        if (activeRequestRef.current?.id === requestId) {
          activeRequestRef.current = null;
        }

        if (currentSessionUserIdRef.current === sessionUserId) {
          setIsLoading(false);
        }
      }
    })();

    activeRequestRef.current = {
      controller,
      id: requestId,
      promise: requestPromise,
      sessionUserId,
    };

    return requestPromise;
  }, [sessionUserId, t.profile.loadError]);

  useEffect(() => {
    const activeRequest = activeRequestRef.current;

    if (activeRequest && activeRequest.sessionUserId !== sessionUserId) {
      activeRequest.controller.abort();
      activeRequestRef.current = null;
    }

    setError("");

    if (!sessionUserId) {
      setProfileState(null);
      setProfileSessionUserId(null);
      setIsLoading(false);
      return;
    }

    const cachedProfile = getCachedProfile(sessionUserId);

    if (cachedProfile) {
      setProfileState(cachedProfile);
      setProfileSessionUserId(sessionUserId);
      setIsLoading(false);
      return;
    }

    setProfileState(null);
    setProfileSessionUserId(sessionUserId);
    setIsLoading(true);
    void refreshProfile();
  }, [refreshProfile, sessionUserId]);

  const setProfile = useCallback(
    (nextProfile: AdminProfile | null) => {
      setProfileState(nextProfile);
      setProfileSessionUserId(sessionUserId);

      if (!sessionUserId) {
        return;
      }

      if (nextProfile) {
        setCachedProfile(sessionUserId, nextProfile);
      } else {
        clearProfileSessionCache();
      }
    },
    [sessionUserId],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      error,
      isLoading,
      profile: profileSessionUserId === sessionUserId ? profile : null,
      refreshProfile,
      setProfile,
    }),
    [
      error,
      isLoading,
      profile,
      profileSessionUserId,
      refreshProfile,
      sessionUserId,
      setProfile,
    ],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfileContext must be used within ProfileProvider");
  }

  return context;
}

export function useOptionalProfileContext() {
  return useContext(ProfileContext);
}

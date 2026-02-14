import { useEffect, useMemo, useState } from 'react';

import { useCards } from '@/hooks/useCards';
import { db } from '@/services/instant';

const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_DAYS = 7;
const REVIEW_EVENTS_LIMIT = 5000;

type RawSettingsRecord = {
  id: string;
  profileName?: unknown;
  avatarPath?: unknown;
};

type RawReviewEventRecord = {
  id: string;
  reviewedAt?: unknown;
};

export type ProfileSeriesPoint = {
  dayStart: number;
  label: string;
  value: number;
};

type DownloadUrlResponse = {
  url?: unknown;
  downloadUrl?: unknown;
  signedUrl?: unknown;
  data?: {
    url?: unknown;
    downloadUrl?: unknown;
    signedUrl?: unknown;
  };
};

const startOfLocalDay = (value: number): number => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const formatDayLabel = (dayStart: number) =>
  new Date(dayStart).toLocaleDateString(undefined, { weekday: 'short' });

const toOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickDownloadUrl = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as DownloadUrlResponse;
  const direct = [record.url, record.downloadUrl, record.signedUrl];
  for (const candidate of direct) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }

  const nested = record.data ? [record.data.url, record.data.downloadUrl, record.data.signedUrl] : [];
  for (const candidate of nested) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
};

const extractEmailHandle = (email: string | null): string | null => {
  if (!email) {
    return null;
  }

  const atIndex = email.indexOf('@');
  if (atIndex <= 0) {
    return email;
  }

  return email.slice(0, atIndex);
};

const buildConsecutiveStreak = (dayKeys: Set<number>, todayKey: number): number => {
  const startKey = dayKeys.has(todayKey) ? todayKey : dayKeys.has(todayKey - 1) ? todayKey - 1 : null;
  if (startKey === null) {
    return 0;
  }

  let streak = 0;
  for (let cursor = startKey; dayKeys.has(cursor); cursor -= 1) {
    streak += 1;
  }
  return streak;
};

const buildSeries = (countsByDay: Map<number, number>, startDay: number): ProfileSeriesPoint[] => {
  return Array.from({ length: CHART_DAYS }, (_, offset) => {
    const dayStart = startDay + offset * DAY_MS;
    const dayKey = Math.floor(dayStart / DAY_MS);
    return {
      dayStart,
      label: formatDayLabel(dayStart),
      value: countsByDay.get(dayKey) ?? 0,
    };
  });
};

export function useProfileStats() {
  const auth = db.useAuth();
  const user = auth.user;
  const { cards, loading: cardsLoading, error: cardsError } = useCards();
  const profileQuery = db.useQuery(
    user
      ? {
          settings: {
            $: {
              where: {
                ownerId: user.id,
              },
              limit: 1,
            },
          },
          reviewEvents: {
            $: {
              where: {
                ownerId: user.id,
              },
              order: {
                reviewedAt: 'desc',
              },
              limit: REVIEW_EVENTS_LIMIT,
            },
          },
        }
      : null
  );

  const [avatarDownloadUrl, setAvatarDownloadUrl] = useState<string | null>(null);

  const settingsRecord = (profileQuery.data?.settings?.[0] ?? null) as RawSettingsRecord | null;
  const avatarPath = toOptionalString(settingsRecord?.avatarPath);
  const profileName = toOptionalString(settingsRecord?.profileName);
  const email = toOptionalString(user?.email);
  const fallbackName = extractEmailHandle(email) ?? 'Learner';
  const displayName = profileName ?? fallbackName;

  useEffect(() => {
    let cancelled = false;

    const resolveAvatarUrl = async () => {
      if (!avatarPath) {
        setAvatarDownloadUrl(null);
        return;
      }

      try {
        const result = await db.storage.getDownloadUrl(avatarPath);
        if (!cancelled) {
          setAvatarDownloadUrl(pickDownloadUrl(result));
        }
      } catch {
        if (!cancelled) {
          setAvatarDownloadUrl(null);
        }
      }
    };

    resolveAvatarUrl();

    return () => {
      cancelled = true;
    };
  }, [avatarPath]);

  const now = Date.now();
  const todayStart = startOfLocalDay(now);
  const todayKey = Math.floor(todayStart / DAY_MS);
  const seriesStart = todayStart - (CHART_DAYS - 1) * DAY_MS;
  const seriesEndExclusive = todayStart + CHART_DAYS * DAY_MS;

  const reviewTimestamps = useMemo(() => {
    const rows = (profileQuery.data?.reviewEvents ?? []) as RawReviewEventRecord[];
    return rows
      .map((event) => (typeof event.reviewedAt === 'number' && Number.isFinite(event.reviewedAt) ? event.reviewedAt : null))
      .filter((value): value is number => value !== null);
  }, [profileQuery.data?.reviewEvents]);

  const reviewsToday = useMemo(
    () => reviewTimestamps.filter((timestamp) => timestamp >= todayStart && timestamp < todayStart + DAY_MS).length,
    [reviewTimestamps, todayStart]
  );

  const streakDays = useMemo(() => {
    if (!reviewTimestamps.length) {
      return 0;
    }

    const dayKeys = new Set(reviewTimestamps.map((timestamp) => Math.floor(startOfLocalDay(timestamp) / DAY_MS)));
    return buildConsecutiveStreak(dayKeys, todayKey);
  }, [reviewTimestamps, todayKey]);

  const activity7d = useMemo(() => {
    const countsByDay = new Map<number, number>();
    reviewTimestamps.forEach((timestamp) => {
      if (timestamp < seriesStart || timestamp >= todayStart + DAY_MS) {
        return;
      }
      const dayKey = Math.floor(startOfLocalDay(timestamp) / DAY_MS);
      countsByDay.set(dayKey, (countsByDay.get(dayKey) ?? 0) + 1);
    });
    return buildSeries(countsByDay, seriesStart);
  }, [reviewTimestamps, seriesStart, todayStart]);

  const dueForecast7d = useMemo(() => {
    const countsByDay = new Map<number, number>();
    cards.forEach((card) => {
      const dueAt = typeof card.dueAt === 'number' && Number.isFinite(card.dueAt) ? card.dueAt : null;
      if (dueAt === null) {
        return;
      }

      const boundedDueAt = dueAt < todayStart ? todayStart : dueAt;
      if (boundedDueAt >= seriesEndExclusive) {
        return;
      }

      const dayKey = Math.floor(startOfLocalDay(boundedDueAt) / DAY_MS);
      countsByDay.set(dayKey, (countsByDay.get(dayKey) ?? 0) + 1);
    });

    return buildSeries(countsByDay, todayStart);
  }, [cards, seriesEndExclusive, todayStart]);

  const totalCards = cards.length;
  const dueNow = cards.filter((card) => card.dueAt <= now).length;

  const userImageUrl = toOptionalString(user?.imageURL);
  const avatarUrl = avatarDownloadUrl ?? userImageUrl;

  const loading = auth.isLoading || (!!user && (profileQuery.isLoading || cardsLoading));
  const error = auth.error?.message ?? profileQuery.error?.message ?? cardsError ?? null;

  return {
    displayName,
    secondaryText: email ?? 'Signed in',
    avatarPath,
    avatarUrl,
    streakDays,
    dueNow,
    reviewsToday,
    totalCards,
    activity7d,
    dueForecast7d,
    loading,
    error,
  };
}

import { useMemo } from 'react';

import { toDeckSummary, type RawDeckRecord } from '@/services/explore/mappers';
import { db } from '@/services/instant';
import type { DeckSummary, ExploreSection, ExploreSectionId } from '@/types/explore';

type UseExploreFeedResult = {
  sections: ExploreSection[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
};

type DeckFeedQueryState = {
  data?: {
    decks?: RawDeckRecord[];
  };
  isLoading: boolean;
  error?: {
    message?: string;
  } | null;
};

const toDecks = (rows: RawDeckRecord[] | undefined): DeckSummary[] => (rows ?? []).map(toDeckSummary);

const toSection = (id: ExploreSectionId, title: string, rows: RawDeckRecord[] | undefined): ExploreSection => ({
  id,
  title,
  decks: toDecks(rows),
});

export const useExploreFeed = (): UseExploreFeedResult => {
  const trendingQuery = db.useQuery(
    {
      decks: {
        $: {
          where: {
            isPublished: true,
          },
          order: {
            trendingScore: 'desc',
          },
          limit: 12,
        },
      },
    } as any
  ) as DeckFeedQueryState;

  const recommendedQuery = db.useQuery(
    {
      decks: {
        $: {
          where: {
            isPublished: true,
          },
          order: {
            recommendedScore: 'desc',
          },
          limit: 12,
        },
      },
    } as any
  ) as DeckFeedQueryState;

  const newestQuery = db.useQuery(
    {
      decks: {
        $: {
          where: {
            isPublished: true,
          },
          order: {
            publishedAt: 'desc',
          },
          limit: 12,
        },
      },
    } as any
  ) as DeckFeedQueryState;

  const loading = trendingQuery.isLoading || recommendedQuery.isLoading || newestQuery.isLoading;

  const error =
    trendingQuery.error?.message ?? recommendedQuery.error?.message ?? newestQuery.error?.message ?? null;

  const sections = useMemo(() => {
    const builtSections = [
      toSection('trending', 'Trending', trendingQuery.data?.decks),
      toSection('recommended', 'Recommended for you', recommendedQuery.data?.decks),
      toSection('new', 'Newly published', newestQuery.data?.decks),
    ];

    return builtSections.filter((section) => section.decks.length > 0);
  }, [newestQuery.data?.decks, recommendedQuery.data?.decks, trendingQuery.data?.decks]);

  return {
    sections,
    loading,
    error,
    isEmpty: !loading && sections.length === 0,
  };
};

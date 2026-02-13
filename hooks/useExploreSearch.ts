import { useEffect, useMemo, useState } from 'react';

import { toDeckSummary, type RawDeckRecord } from '@/services/explore/mappers';
import { db } from '@/services/instant';
import { EXPLORE_CATEGORIES, type DeckSummary, type ExploreCategory } from '@/types/explore';

type UseExploreSearchResult = {
  query: string;
  minCharsMet: boolean;
  loading: boolean;
  error: string | null;
  deckResults: DeckSummary[];
  categoryResults: ExploreCategory[];
};

type DeckSearchQueryState = {
  data?: {
    decks?: RawDeckRecord[];
  };
  isLoading: boolean;
  error?: {
    message?: string;
  } | null;
};

const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_MS = 300;

const toDecks = (rows: RawDeckRecord[] | undefined): DeckSummary[] => (rows ?? []).map(toDeckSummary);

export const useExploreSearch = (rawQuery: string): UseExploreSearchResult => {
  const [debouncedQuery, setDebouncedQuery] = useState(rawQuery.trim());

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(rawQuery.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [rawQuery]);

  const normalizedQuery = debouncedQuery.toLowerCase();

  const categoryResults = useMemo(() => {
    if (normalizedQuery.length < MIN_SEARCH_LENGTH) {
      return [];
    }

    return EXPLORE_CATEGORIES.filter((category) => {
      const labelMatches = category.label.toLowerCase().includes(normalizedQuery);
      const idMatches = category.id.includes(normalizedQuery.replace(/\s+/g, '_'));
      return labelMatches || idMatches;
    });
  }, [normalizedQuery]);

  const categoryIdClauses = useMemo(
    () => categoryResults.map((category) => ({ categoryId: category.id })),
    [categoryResults]
  );

  const minCharsMet = debouncedQuery.length >= MIN_SEARCH_LENGTH;

  const decksQuery = db.useQuery(
    minCharsMet
      ? ({
          decks: {
            $: {
              where: {
                isPublished: true,
                or: [
                  {
                    title: {
                      $ilike: `%${debouncedQuery}%`,
                    },
                  },
                  {
                    subtitle: {
                      $ilike: `%${debouncedQuery}%`,
                    },
                  },
                  {
                    ownerDisplayName: {
                      $ilike: `%${debouncedQuery}%`,
                    },
                  },
                  ...categoryIdClauses,
                ],
              },
              order: {
                recommendedScore: 'desc',
              },
              limit: 30,
            },
          },
        } as any)
      : null
  ) as DeckSearchQueryState;

  const deckResults = useMemo(() => toDecks(decksQuery.data?.decks), [decksQuery.data?.decks]);

  return {
    query: debouncedQuery,
    minCharsMet,
    loading: minCharsMet && decksQuery.isLoading,
    error: minCharsMet ? (decksQuery.error?.message ?? null) : null,
    deckResults,
    categoryResults,
  };
};

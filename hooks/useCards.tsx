import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { id } from '@instantdb/react-native';

import { db } from '@/services/instant';
import { createInitialReviewMeta, scheduleReview } from '@/services/review/fsrs';
import type { Card, CardInput, ReviewRating } from '@/types/card';
import { isReviewState } from '@/types/card';

type CardContextValue = {
  cards: Card[];
  loading: boolean;
  error: string | null;
  refreshCards: () => Promise<void>;
  addCard: (input: CardInput) => Promise<Card>;
  updateCard: (card: Card) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  clearCards: () => Promise<void>;
  getCardById: (id: string) => Card | undefined;
  gradeCardReview: (id: string, rating: ReviewRating) => Promise<void>;
};

type RawCard = {
  id: string;
  deckName?: unknown;
  title?: unknown;
  frontText?: unknown;
  backText?: unknown;
  imageUris?: unknown;
  reviewState?: unknown;
  dueAt?: unknown;
  stability?: unknown;
  difficulty?: unknown;
  elapsedDays?: unknown;
  scheduledDays?: unknown;
  learningSteps?: unknown;
  reps?: unknown;
  lapses?: unknown;
  lastReviewAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const CardContext = createContext<CardContextValue | null>(null);

const parseImageUris = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
};

const toOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const toOptionalNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const compactObject = <T extends object>(value: T): Partial<T> =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;

const toCard = (row: RawCard): Card => {
  const now = Date.now();
  const createdAt = toNumber(row.createdAt, now);
  const defaultReviewMeta = createInitialReviewMeta(createdAt);

  return {
    id: row.id,
    deckName: toOptionalString(row.deckName),
    title: typeof row.title === 'string' ? row.title : '',
    frontText: typeof row.frontText === 'string' ? row.frontText : '',
    backText: typeof row.backText === 'string' ? row.backText : '',
    imageUris: parseImageUris(row.imageUris),
    reviewState: isReviewState(row.reviewState) ? row.reviewState : defaultReviewMeta.reviewState,
    dueAt: toNumber(row.dueAt, defaultReviewMeta.dueAt),
    stability: toOptionalNumber(row.stability),
    difficulty: toOptionalNumber(row.difficulty),
    elapsedDays: toOptionalNumber(row.elapsedDays),
    scheduledDays: toOptionalNumber(row.scheduledDays),
    learningSteps: toNumber(row.learningSteps, defaultReviewMeta.learningSteps),
    reps: toNumber(row.reps, defaultReviewMeta.reps),
    lapses: toNumber(row.lapses, defaultReviewMeta.lapses),
    lastReviewAt: toOptionalNumber(row.lastReviewAt),
    createdAt,
    updatedAt: toNumber(row.updatedAt, createdAt),
  };
};

export const CardsProvider = ({ children }: { children: ReactNode }) => {
  const auth = db.useAuth();
  const user = auth.user;
  const [mutationError, setMutationError] = useState<string | null>(null);

  const cardsQuery = db.useQuery(
    user
      ? {
          cards: {
            $: {
              where: {
                ownerId: user.id,
              },
              order: {
                createdAt: 'desc',
              },
            },
          },
        }
      : null
  );

  const cards = useMemo(() => {
    const rows = (cardsQuery.data?.cards ?? []) as RawCard[];
    return rows.map(toCard).sort((a, b) => b.createdAt - a.createdAt);
  }, [cardsQuery.data?.cards]);

  const loading = auth.isLoading || (!!user && cardsQuery.isLoading);
  const error = mutationError ?? auth.error?.message ?? cardsQuery.error?.message ?? null;

  const refreshCards = useCallback(async () => {
    // Instant queries are live; kept for compatibility with existing screens.
  }, []);

  const requireUserId = useCallback(() => {
    if (!user) {
      throw new Error('You must sign in to manage cards.');
    }

    return user.id;
  }, [user]);

  const addCard = useCallback(
    async (input: CardInput): Promise<Card> => {
      const ownerId = requireUserId();
      const now = Date.now();
      const nextId = id();
      const deckName = input.deckName?.trim();
      const title = input.title.trim();
      const frontText = input.frontText.trim();
      const backText = input.backText.trim();
      const imageUris = (input.imageUris ?? []).map((uri) => uri.trim()).filter(Boolean);
      const reviewMeta = createInitialReviewMeta(now);
      const nextCard: Card = {
        id: nextId,
        deckName: deckName && deckName.length > 0 ? deckName : undefined,
        title,
        frontText,
        backText,
        imageUris,
        ...reviewMeta,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await db.transact(
          db.tx.cards[nextId].update(
            compactObject({
              ownerId,
              deckName: deckName && deckName.length > 0 ? deckName : undefined,
              title,
              frontText,
              backText,
              imageUris,
              ...reviewMeta,
              createdAt: now,
              updatedAt: now,
            })
          )
        );
        setMutationError(null);
      } catch (err) {
        setMutationError(err instanceof Error ? err.message : 'Could not save card.');
        throw err;
      }

      return nextCard;
    },
    [requireUserId]
  );

  const updateCard = useCallback(
    async (card: Card): Promise<void> => {
      const ownerId = requireUserId();
      const now = Date.now();
      const deckName = card.deckName?.trim();
      const imageUris = (card.imageUris ?? []).map((uri) => uri.trim()).filter(Boolean);

      try {
        await db.transact(
          db.tx.cards[card.id].update(
            compactObject({
              ownerId,
              deckName: deckName && deckName.length > 0 ? deckName : undefined,
              title: card.title.trim(),
              frontText: card.frontText.trim(),
              backText: card.backText.trim(),
              imageUris,
              reviewState: card.reviewState,
              dueAt: card.dueAt,
              stability: card.stability,
              difficulty: card.difficulty,
              elapsedDays: card.elapsedDays,
              scheduledDays: card.scheduledDays,
              learningSteps: card.learningSteps,
              reps: card.reps,
              lapses: card.lapses,
              lastReviewAt: card.lastReviewAt,
              createdAt: card.createdAt,
              updatedAt: now,
            })
          )
        );
        setMutationError(null);
      } catch (err) {
        setMutationError(err instanceof Error ? err.message : 'Could not update card.');
        throw err;
      }
    },
    [requireUserId]
  );

  const gradeCardReview = useCallback(
    async (cardId: string, rating: ReviewRating): Promise<void> => {
      const ownerId = requireUserId();
      const card = cards.find((item) => item.id === cardId);
      if (!card) {
        throw new Error('Card not found.');
      }

      const now = Date.now();
      const reviewUpdate = scheduleReview(card, rating, now);

      try {
        await db.transact(
          db.tx.cards[card.id].update(
            compactObject({
              ownerId,
              ...reviewUpdate,
              updatedAt: now,
            })
          )
        );
        setMutationError(null);
      } catch (err) {
        setMutationError(err instanceof Error ? err.message : 'Could not save review result.');
        throw err;
      }
    },
    [cards, requireUserId]
  );

  const deleteCard = useCallback(
    async (cardId: string): Promise<void> => {
      try {
        requireUserId();
        await db.transact(db.tx.cards[cardId].delete());
        setMutationError(null);
      } catch (err) {
        setMutationError(err instanceof Error ? err.message : 'Could not delete card.');
        throw err;
      }
    },
    [requireUserId]
  );

  const clearCards = useCallback(async (): Promise<void> => {
    try {
      requireUserId();
      if (!cards.length) {
        return;
      }

      await db.transact(cards.map((card) => db.tx.cards[card.id].delete()));
      setMutationError(null);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Could not clear cards.');
      throw err;
    }
  }, [cards, requireUserId]);

  const getCardById = useCallback((id: string) => cards.find((card) => card.id === id), [cards]);

  const value = useMemo(
    () => ({
      cards,
      loading,
      error,
      refreshCards,
      addCard,
      updateCard,
      deleteCard,
      clearCards,
      getCardById,
      gradeCardReview,
    }),
    [
      addCard,
      cards,
      clearCards,
      deleteCard,
      error,
      getCardById,
      gradeCardReview,
      loading,
      refreshCards,
      updateCard,
    ]
  );

  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
};

const unavailableError = 'Cards context is unavailable.';

export const useCards = () => {
  const context = useContext(CardContext);
  if (!context) {
    return {
      cards: [],
      loading: false,
      error: unavailableError,
      refreshCards: async () => {},
      addCard: async () => ({
        id: '',
        title: '',
        frontText: '',
        backText: '',
        imageUris: [],
        reviewState: 'new' as const,
        dueAt: Date.now(),
        learningSteps: 0,
        reps: 0,
        lapses: 0,
        createdAt: 0,
        updatedAt: 0,
      }),
      updateCard: async () => {},
      deleteCard: async () => {},
      clearCards: async () => {},
      getCardById: () => undefined,
      gradeCardReview: async () => {},
    };
  }
  return context;
};

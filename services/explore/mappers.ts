import type { DeckCardPreview, DeckSummary } from '@/types/explore';
import { getExploreCategoryById } from '@/types/explore';

export type RawDeckRecord = {
  id: string;
  ownerId?: unknown;
  title?: unknown;
  subtitle?: unknown;
  description?: unknown;
  coverImageUri?: unknown;
  ownerDisplayName?: unknown;
  categoryId?: unknown;
  isPublished?: unknown;
  publishedAt?: unknown;
  cardCount?: unknown;
  downloadsCount?: unknown;
  likesCount?: unknown;
  savesCount?: unknown;
  averageRating?: unknown;
  ratingCount?: unknown;
  trendingScore?: unknown;
  recommendedScore?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RawCardPreviewRecord = {
  id: string;
  title?: unknown;
  frontText?: unknown;
  backText?: unknown;
};

const toString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }

  return value;
};

const toNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const toOptionalNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const toBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

export const toDeckSummary = (row: RawDeckRecord): DeckSummary => {
  const createdAt = toNumber(row.createdAt, Date.now());
  const categoryId = toString(row.categoryId, 'programming');

  return {
    id: row.id,
    ownerId: toString(row.ownerId),
    title: toString(row.title, 'Untitled deck'),
    subtitle: toString(row.subtitle),
    description: toString(row.description),
    coverImageUri: toOptionalString(row.coverImageUri),
    ownerDisplayName: toString(row.ownerDisplayName, 'Unknown author'),
    categoryId,
    category: getExploreCategoryById(categoryId),
    isPublished: toBoolean(row.isPublished),
    publishedAt: toOptionalNumber(row.publishedAt),
    cardCount: toNumber(row.cardCount),
    downloadsCount: toNumber(row.downloadsCount),
    likesCount: toNumber(row.likesCount),
    savesCount: toNumber(row.savesCount),
    averageRating: toNumber(row.averageRating),
    ratingCount: toNumber(row.ratingCount),
    trendingScore: toNumber(row.trendingScore),
    recommendedScore: toNumber(row.recommendedScore),
    createdAt,
    updatedAt: toNumber(row.updatedAt, createdAt),
  };
};

export const toDeckCardPreview = (row: RawCardPreviewRecord): DeckCardPreview => ({
  id: row.id,
  title: toString(row.title, 'Untitled card'),
  frontText: toString(row.frontText),
  backText: toString(row.backText),
});

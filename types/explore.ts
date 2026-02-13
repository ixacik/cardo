export const EXPLORE_CATEGORY_IDS = [
  'programming',
  'language',
  'science',
  'history',
  'business',
  'design',
  'math',
  'exam_prep',
] as const;

export type ExploreCategoryId = (typeof EXPLORE_CATEGORY_IDS)[number];

export type ExploreCategory = {
  id: ExploreCategoryId;
  label: string;
  accentColor: string;
  description: string;
};

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  {
    id: 'programming',
    label: 'Programming',
    accentColor: '#0a84ff',
    description: 'Software engineering, coding patterns, and APIs.',
  },
  {
    id: 'language',
    label: 'Language',
    accentColor: '#34c759',
    description: 'Vocabulary and grammar decks for language learners.',
  },
  {
    id: 'science',
    label: 'Science',
    accentColor: '#5e5ce6',
    description: 'Biology, chemistry, physics, and research topics.',
  },
  {
    id: 'history',
    label: 'History',
    accentColor: '#ff9f0a',
    description: 'Timelines, events, and notable figures.',
  },
  {
    id: 'business',
    label: 'Business',
    accentColor: '#ff375f',
    description: 'Operations, finance, marketing, and strategy.',
  },
  {
    id: 'design',
    label: 'Design',
    accentColor: '#64d2ff',
    description: 'UX, typography, systems, and visual language.',
  },
  {
    id: 'math',
    label: 'Math',
    accentColor: '#ffd60a',
    description: 'Foundational formulas and problem-solving drills.',
  },
  {
    id: 'exam_prep',
    label: 'Exam Prep',
    accentColor: '#bf5af2',
    description: 'Targeted review decks for tests and certifications.',
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  EXPLORE_CATEGORIES.map((category) => [category.id, category])
) as Record<ExploreCategoryId, ExploreCategory>;

export const getExploreCategoryById = (categoryId: string | null | undefined): ExploreCategory | undefined => {
  if (!categoryId || !(categoryId in CATEGORY_BY_ID)) {
    return undefined;
  }

  return CATEGORY_BY_ID[categoryId as ExploreCategoryId];
};

export type DeckSocialStats = {
  downloadsCount: number;
  likesCount: number;
  savesCount: number;
  averageRating: number;
  ratingCount: number;
};

export type DeckSummary = DeckSocialStats & {
  id: string;
  ownerId: string;
  ownerDisplayName: string;
  title: string;
  subtitle: string;
  description: string;
  coverImageUri?: string;
  categoryId: string;
  category?: ExploreCategory;
  isPublished: boolean;
  publishedAt?: number;
  cardCount: number;
  trendingScore: number;
  recommendedScore: number;
  createdAt: number;
  updatedAt: number;
};

export type DeckCardPreview = {
  id: string;
  title: string;
  frontText: string;
  backText: string;
};

export type DeckDetail = DeckSummary & {
  cards: DeckCardPreview[];
};

export type ExploreSectionId = 'trending' | 'recommended' | 'new';

export type ExploreSection = {
  id: ExploreSectionId;
  title: string;
  decks: DeckSummary[];
};

import { i } from '@instantdb/react-native';

const schema = i.schema({
  entities: {
    cards: i.entity({
      ownerId: i.string().indexed(),
      deckName: i.string().optional(),
      title: i.string(),
      frontText: i.string(),
      backText: i.string(),
      imageUris: i.json().optional(),
      reviewState: i.string().optional(),
      dueAt: i.number().indexed().optional(),
      stability: i.number().optional(),
      difficulty: i.number().optional(),
      elapsedDays: i.number().optional(),
      scheduledDays: i.number().optional(),
      learningSteps: i.number().optional(),
      reps: i.number().optional(),
      lapses: i.number().optional(),
      lastReviewAt: i.number().optional(),
      createdAt: i.number().indexed(),
      updatedAt: i.number().indexed(),
    }),
    decks: i.entity({
      ownerId: i.string().indexed(),
      title: i.string().indexed(),
      subtitle: i.string().optional().indexed(),
      description: i.string().optional(),
      coverImageUri: i.string().optional(),
      ownerDisplayName: i.string().optional().indexed(),
      categoryId: i.string().indexed(),
      isPublished: i.boolean().indexed(),
      publishedAt: i.number().optional().indexed(),
      cardCount: i.number().indexed(),
      downloadsCount: i.number().indexed(),
      likesCount: i.number().indexed(),
      savesCount: i.number().indexed(),
      averageRating: i.number().indexed(),
      ratingCount: i.number().indexed(),
      trendingScore: i.number().indexed(),
      recommendedScore: i.number().indexed(),
      createdAt: i.number().indexed(),
      updatedAt: i.number().indexed(),
    }),
    settings: i.entity({
      ownerId: i.string().indexed().unique(),
      profileName: i.string().optional(),
      updatedAt: i.number().indexed(),
    }),
  },
  links: {
    decksCards: {
      forward: {
        on: 'decks',
        has: 'many',
        label: 'cards',
      },
      reverse: {
        on: 'cards',
        has: 'one',
        label: 'deck',
      },
    },
  },
});

export default schema;

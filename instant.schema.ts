import { i } from '@instantdb/react-native';

const schema = i.schema({
  entities: {
    cards: i.entity({
      ownerId: i.string().indexed(),
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
    settings: i.entity({
      ownerId: i.string().indexed().unique(),
      profileName: i.string().optional(),
      updatedAt: i.number().indexed(),
    }),
  },
});

export default schema;

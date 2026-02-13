import type { InstantRules } from '@instantdb/react-native';

const rules = {
  $default: {
    allow: {
      $default: 'false',
    },
  },
  cards: {
    bind: {
      isOwner: 'auth.id != null && auth.id == data.ownerId',
      isPublishedDeck: 'true in data.ref("deck.isPublished")',
    },
    allow: {
      view: 'isOwner || isPublishedDeck',
      create: 'isOwner',
      update: 'isOwner',
      delete: 'isOwner',
      link: {
        deck: 'isOwner',
      },
      unlink: {
        deck: 'isOwner',
      },
    },
  },
  decks: {
    bind: {
      isOwner: 'auth.id != null && auth.id == data.ownerId',
    },
    allow: {
      view: 'data.isPublished == true || isOwner',
      create: 'isOwner',
      update: 'isOwner',
      delete: 'isOwner',
      link: {
        cards: 'isOwner',
      },
      unlink: {
        cards: 'isOwner',
      },
    },
  },
  settings: {
    bind: ['isOwner', 'auth.id != null && auth.id == data.ownerId'],
    allow: {
      view: 'isOwner',
      create: 'isOwner',
      update: 'isOwner',
      delete: 'isOwner',
    },
  },
} satisfies InstantRules;

export default rules;

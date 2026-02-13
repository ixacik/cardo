import type { InstantRules } from '@instantdb/react-native';

const rules = {
  $default: {
    allow: {
      $default: 'false',
    },
  },
  cards: {
    bind: ['isOwner', 'auth.id != null && auth.id == data.ownerId'],
    allow: {
      view: 'isOwner',
      create: 'isOwner',
      update: 'isOwner',
      delete: 'isOwner',
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

import { init } from '@instantdb/react-native';

import schema from '@/instant.schema';

const appId = process.env.EXPO_PUBLIC_INSTANT_APP_ID;

if (!appId) {
  throw new Error('Missing EXPO_PUBLIC_INSTANT_APP_ID. Add it to your environment.');
}

export const db = init({ appId, schema });

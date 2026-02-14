import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, TextField } from '@/components/ui';
import { useCards } from '@/hooks/useCards';
import { db } from '@/services/instant';

type DownloadUrlResponse = {
  url?: unknown;
  downloadUrl?: unknown;
  signedUrl?: unknown;
  data?: {
    url?: unknown;
    downloadUrl?: unknown;
    signedUrl?: unknown;
  };
};

const toOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickDownloadUrl = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as DownloadUrlResponse;
  const direct = [record.url, record.downloadUrl, record.signedUrl];
  for (const candidate of direct) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }

  const nested = record.data ? [record.data.url, record.data.downloadUrl, record.data.signedUrl] : [];
  for (const candidate of nested) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
};

const getInitials = (displayName: string): string => {
  const tokens = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) {
    return 'U';
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0] ?? ''}${tokens[1][0] ?? ''}`.toUpperCase();
};

export default function SettingsScreen() {
  const auth = db.useAuth();
  const insets = useSafeAreaInsets();
  const user = auth.user;
  const settingsQuery = db.useQuery(
    user
      ? {
          settings: {
            $: {
              where: {
                ownerId: user.id,
              },
              limit: 1,
            },
          },
        }
      : null
  );
  const settingsRecord = settingsQuery.data?.settings?.[0];
  const { clearCards } = useCards();
  const authErrorMessage = auth.error?.message ?? null;
  const settingsErrorMessage = settingsQuery.error?.message ?? null;

  const [profileName, setProfileName] = useState('');
  const [avatarPath, setAvatarPath] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [didHydrate, setDidHydrate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDidHydrate(false);
    setProfileName('');
    setAvatarPath('');
    setAvatarUrl(null);
    setFeedback('');
    setError(null);
  }, [user?.id]);

  useEffect(() => {
    if (!user || settingsQuery.isLoading || didHydrate) {
      return;
    }

    const nextProfileName = toOptionalString(settingsRecord?.profileName) ?? '';
    const nextAvatarPath = toOptionalString(settingsRecord?.avatarPath) ?? '';
    setProfileName(nextProfileName);
    setAvatarPath(nextAvatarPath);
    setDidHydrate(true);
  }, [didHydrate, settingsQuery.isLoading, settingsRecord?.avatarPath, settingsRecord?.profileName, user]);

  useEffect(() => {
    let cancelled = false;

    const resolveAvatar = async () => {
      const fallbackUserImage = toOptionalString(user?.imageURL);
      if (!avatarPath) {
        setAvatarUrl(fallbackUserImage);
        return;
      }

      try {
        const result = await db.storage.getDownloadUrl(avatarPath);
        if (!cancelled) {
          setAvatarUrl(pickDownloadUrl(result) ?? fallbackUserImage);
        }
      } catch {
        if (!cancelled) {
          setAvatarUrl(fallbackUserImage);
        }
      }
    };

    resolveAvatar();

    return () => {
      cancelled = true;
    };
  }, [avatarPath, user?.imageURL]);

  const persistSettings = async (nextProfileName: string, nextAvatarPath: string) => {
    if (!user) {
      throw new Error('You must sign in to update settings.');
    }

    const settingsId = settingsRecord?.id ?? user.id;
    await db.transact(
      db.tx.settings[settingsId].update({
        ownerId: user.id,
        profileName: nextProfileName,
        avatarPath: nextAvatarPath,
        updatedAt: Date.now(),
      })
    );
  };

  const saveProfile = async () => {
    const nextProfileName = profileName.trim();
    setProfileName(nextProfileName);
    setSaving(true);
    setFeedback('');
    setError(null);
    try {
      await persistSettings(nextProfileName, avatarPath);
      setFeedback('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const updateAvatar = async () => {
    if (!user) {
      return;
    }

    setSaving(true);
    setFeedback('');
    setError(null);
    let uploadedPath: string | null = null;
    const previousAvatarPath = avatarPath;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Allow photo access to upload an avatar.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets.length) {
        return;
      }

      const asset = result.assets[0];
      const fileUri = asset.uri;
      if (!fileUri) {
        throw new Error('Could not read selected image.');
      }

      const response = await fetch(fileUri);
      const blob = await response.blob();
      const fallbackFileName = `avatar-${Date.now()}.jpg`;
      const nextFileName = (asset.fileName ?? fallbackFileName).replace(/[^a-zA-Z0-9._-]/g, '_');
      const nextPath = `avatars/${user.id}/${Date.now()}-${nextFileName}`;

      uploadedPath = nextPath;
      await db.storage.uploadFile(nextPath, blob, {
        contentType: asset.mimeType ?? blob.type ?? 'image/jpeg',
      });
      await persistSettings(profileName.trim(), nextPath);
      setAvatarPath(nextPath);
      setFeedback('Avatar updated.');

      if (previousAvatarPath && previousAvatarPath !== nextPath) {
        void db.storage.delete(previousAvatarPath).catch(() => undefined);
      }
    } catch (err) {
      if (uploadedPath) {
        void db.storage.delete(uploadedPath).catch(() => undefined);
      }
      setError(err instanceof Error ? err.message : 'Could not update avatar.');
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    Alert.alert('Clear all cards', 'This will permanently delete all index cards in your account.', [
      { style: 'cancel', text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          setFeedback('');
          setError(null);
          try {
            await clearCards();
            setFeedback('All cards have been deleted.');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not clear cards.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const signOut = async () => {
    setSaving(true);
    setFeedback('');
    setError(null);
    try {
      await db.auth.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out.');
    } finally {
      setSaving(false);
    }
  };

  if (auth.isLoading || (user && settingsQuery.isLoading && !didHydrate)) {
    return (
      <View className="flex-1 items-center justify-center bg-app-light dark:bg-app-dark">
        <ActivityIndicator colorClassName="text-primary" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/sign-in" />;
  }

  const avatarInitials = getInitials(profileName || toOptionalString(user.email) || 'Learner');

  return (
    <ScrollView
      className="flex-1 bg-app-light dark:bg-app-dark"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-3"
      contentContainerStyle={{
        paddingTop: 20,
        paddingBottom: insets.bottom + 40,
        paddingLeft: insets.left + 20,
        paddingRight: insets.right + 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Card className="rounded-3xl" padding="lg">
        <ThemedText type="subtitle">Profile details</ThemedText>
        <View className="mt-3 flex-row items-center gap-3">
          <View className="size-20 overflow-hidden rounded-full bg-primary/15">
            {avatarUrl ? (
              <ExpoImage source={{ uri: avatarUrl }} className="size-full" contentFit="cover" />
            ) : (
              <View className="size-full items-center justify-center">
                <ThemedText className="text-2xl font-bold text-primary">{avatarInitials}</ThemedText>
              </View>
            )}
          </View>

          <View className="flex-1 gap-2">
            <ThemedText className="text-sm opacity-75">Avatar</ThemedText>
            <Button variant="secondary" loading={saving} onPress={updateAvatar}>
              Upload avatar
            </Button>
          </View>
        </View>

        <ThemedText className="mt-4">Display name</ThemedText>
        <View className="mt-2 gap-2.5">
          <TextField
            value={profileName}
            onChangeText={setProfileName}
            placeholder="Type a profile name"
            editable={!saving}
          />
          <Button loading={saving} onPress={saveProfile}>
            Save profile
          </Button>
        </View>
      </Card>

      <ThemedText className="mt-1">Storage</ThemedText>
      <Button variant="destructive" loading={saving} onPress={clearAll}>
        Clear all cards
      </Button>

      <ThemedText className="mt-1">Account</ThemedText>
      <Button variant="secondary" loading={saving} onPress={signOut}>
        Sign out
      </Button>

      {!!feedback && <ThemedText className="mt-2 text-success">{feedback}</ThemedText>}
      {error ? <ThemedText className="mt-2 text-danger">{error}</ThemedText> : null}
      {settingsErrorMessage ? <ThemedText className="mt-2 text-danger">{settingsErrorMessage}</ThemedText> : null}
      {authErrorMessage ? <ThemedText className="mt-2 text-danger">{authErrorMessage}</ThemedText> : null}
    </ScrollView>
  );
}

import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useCards } from '@/hooks/useCards';
import { cn } from '@/lib/cn';
import { db } from '@/services/instant';

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
  const [didHydrate, setDidHydrate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDidHydrate(false);
    setProfileName('');
    setFeedback('');
    setError(null);
  }, [user?.id]);

  useEffect(() => {
    if (!user || settingsQuery.isLoading || didHydrate) {
      return;
    }

    setProfileName(typeof settingsRecord?.profileName === 'string' ? settingsRecord.profileName : '');
    setDidHydrate(true);
  }, [didHydrate, settingsQuery.isLoading, settingsRecord?.profileName, user]);

  const persistSettings = async (nextProfileName: string) => {
    if (!user) {
      throw new Error('You must sign in to update settings.');
    }

    const settingsId = settingsRecord?.id ?? user.id;
    await db.transact(
      db.tx.settings[settingsId].update({
        ownerId: user.id,
        profileName: nextProfileName,
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
      await persistSettings(nextProfileName);
      setFeedback('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
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

  return (
    <View
      className="flex-1 bg-app-light dark:bg-app-dark"
      style={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: insets.bottom,
      }}
    >
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-3 px-5 pb-10 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subtitle">Profile</ThemedText>
        <ThemedText>Display name</ThemedText>
        <View className="gap-2.5">
          <TextInput
            value={profileName}
            onChangeText={setProfileName}
            placeholder="Type a profile name"
            placeholderTextColorClassName="text-subtle-light dark:text-subtle-dark"
            className="rounded-input border border-input-border-light bg-input-light px-3 py-2.5 text-fg-light dark:border-input-border-dark dark:bg-input-dark dark:text-fg-dark"
            editable={!saving}
          />
          <Pressable
            disabled={saving}
            onPress={saveProfile}
            className={cn(
              'items-center rounded-control bg-primary px-4 py-3',
              saving && 'opacity-60'
            )}
            style={({ pressed }) => ({ opacity: saving ? 0.6 : pressed ? 0.92 : 1 })}
          >
            <ThemedText className="font-semibold text-white">
              {saving ? 'Saving...' : 'Save profile'}
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText className="mt-1">Storage</ThemedText>
        <Pressable
          disabled={saving}
          onPress={clearAll}
          className={cn('items-center rounded-control bg-danger-strong px-4 py-3', saving && 'opacity-60')}
          style={({ pressed }) => ({ opacity: saving ? 0.6 : pressed ? 0.92 : 1 })}
        >
          <ThemedText className="font-semibold text-white">Clear all cards</ThemedText>
        </Pressable>

        <ThemedText className="mt-1">Account</ThemedText>
        <Pressable
          disabled={saving}
          onPress={signOut}
          className={cn(
            'items-center rounded-control border border-border-light bg-surface-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark',
            saving && 'opacity-60'
          )}
          style={({ pressed }) => ({ opacity: saving ? 0.6 : pressed ? 0.92 : 1 })}
        >
          <ThemedText className="font-semibold">Sign out</ThemedText>
        </Pressable>

        {!!feedback && <ThemedText className="mt-2 text-success">{feedback}</ThemedText>}
        {error ? <ThemedText className="mt-2 text-danger">{error}</ThemedText> : null}
        {settingsErrorMessage ? <ThemedText className="mt-2 text-danger">{settingsErrorMessage}</ThemedText> : null}
        {authErrorMessage ? <ThemedText className="mt-2 text-danger">{authErrorMessage}</ThemedText> : null}
      </ScrollView>
    </View>
  );
}

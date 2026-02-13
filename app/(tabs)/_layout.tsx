import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';

import { db } from '@/services/instant';

function CreateCardAccessory() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const isInline = placement === 'inline';

  if (!isInline) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create card"
      className="items-center justify-center px-2"
      onPress={() => router.push('/card/create')}
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}
    >
      <Ionicons name="add" size={24} color="#ffffff" />
    </Pressable>
  );
}

export default function TabLayout() {
  const { isLoading, user } = db.useAuth();
  const iosVersion =
    typeof Platform.Version === 'string'
      ? Number.parseInt(Platform.Version, 10)
      : Platform.Version;
  const isBottomAccessorySupported = Platform.OS === 'ios' && iosVersion >= 26;

  if (isLoading) {
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
    <NativeTabs
      blurEffect="systemChromeMaterial"
      minimizeBehavior={isBottomAccessorySupported ? 'onScrollDown' : undefined}
    >
      {isBottomAccessorySupported ? (
        <NativeTabs.BottomAccessory>
          <CreateCardAccessory />
        </NativeTabs.BottomAccessory>
      ) : null}
      <NativeTabs.Trigger name="(cards)">
        <NativeTabs.Trigger.Icon sf="house.fill" />
        <NativeTabs.Trigger.Label>Cards</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(explore)">
        <Icon sf="safari.fill" />
        <Label>Explore</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Icon sf="gear" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

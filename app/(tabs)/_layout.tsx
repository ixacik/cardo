import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { db } from '@/services/instant';

export default function TabLayout() {
  const { isLoading, user } = db.useAuth();
  const iosVersion =
    typeof Platform.Version === 'string'
      ? Number.parseInt(Platform.Version, 10)
      : Platform.Version;
  const isMinimizeBehaviorSupported = Platform.OS === 'ios' && iosVersion >= 26;

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
      minimizeBehavior={isMinimizeBehaviorSupported ? 'onScrollDown' : undefined}
    >
      <NativeTabs.Trigger name="(cards)">
        <Icon sf="house.fill" />
        <Label>Cards</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(explore)">
        <Icon sf="safari.fill" />
        <Label>Explore</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <Icon sf="gear" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { db } from '@/services/instant';

export default function TabLayout() {
  const { isLoading, user } = db.useAuth();

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
    <NativeTabs>
      <NativeTabs.Trigger name="(cards)">
        <Icon sf="house.fill" />
        <Label>Cards</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <Icon sf="gear" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

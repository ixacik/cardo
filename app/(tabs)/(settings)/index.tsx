import { Redirect } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { Bar, CartesianChart, Line } from 'victory-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProfileStats } from '@/hooks/useProfileStats';
import { db } from '@/services/instant';

import { Image as ExpoImage } from 'expo-image';

const toColorValue = (value: string | number | undefined, fallback: string) =>
  typeof value === 'string' ? value : fallback;

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

export default function ProfileScreen() {
  const auth = db.useAuth();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const [primary, info, mutedLight, mutedDark] = useCSSVariable([
    '--color-primary',
    '--color-info',
    '--color-muted-light',
    '--color-muted-dark',
  ]);

  const {
    displayName,
    secondaryText,
    avatarUrl,
    streakDays,
    dueNow,
    reviewsToday,
    totalCards,
    activity7d,
    dueForecast7d,
    loading,
    error,
  } = useProfileStats();

  if (!auth.user && !auth.isLoading) {
    return <Redirect href="/sign-in" />;
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-app-light dark:bg-app-dark">
        <ActivityIndicator colorClassName="text-primary" />
      </View>
    );
  }

  const axisLabelColor = toColorValue(isDark ? mutedDark : mutedLight, isDark ? '#9ba1a6' : '#687076');
  const axisLineColor = 'transparent';
  const primaryColor = toColorValue(primary, '#0a84ff');
  const infoColor = toColorValue(info, '#1565c0');
  const initials = getInitials(displayName);

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
        <View className="flex-row items-center gap-4">
          <View className="size-20 overflow-hidden rounded-full bg-primary/15">
            {avatarUrl ? (
              <ExpoImage source={{ uri: avatarUrl }} className="size-full" contentFit="cover" />
            ) : (
              <View className="size-full items-center justify-center">
                <ThemedText className="text-2xl font-bold text-primary">{initials}</ThemedText>
              </View>
            )}
          </View>

          <View className="flex-1 gap-1">
            <ThemedText type="title" className="text-[30px] leading-9">
              {displayName}
            </ThemedText>
            <ThemedText className="opacity-75">{secondaryText}</ThemedText>
            <ThemedText className="text-sm text-primary">Keep your momentum going this week.</ThemedText>
          </View>
        </View>
      </Card>

      <View className="flex-row gap-2.5">
        <Card className="flex-1 items-center" padding="sm">
          <ThemedText className="text-xs opacity-70">Streak</ThemedText>
          <ThemedText type="subtitle" className="mt-0.5">
            {streakDays}d
          </ThemedText>
        </Card>
        <Card className="flex-1 items-center" padding="sm">
          <ThemedText className="text-xs opacity-70">Due now</ThemedText>
          <ThemedText type="subtitle" className="mt-0.5">
            {dueNow}
          </ThemedText>
        </Card>
      </View>

      <View className="flex-row gap-2.5">
        <Card className="flex-1 items-center" padding="sm">
          <ThemedText className="text-xs opacity-70">Today reviews</ThemedText>
          <ThemedText type="subtitle" className="mt-0.5">
            {reviewsToday}
          </ThemedText>
        </Card>
        <Card className="flex-1 items-center" padding="sm">
          <ThemedText className="text-xs opacity-70">Total cards</ThemedText>
          <ThemedText type="subtitle" className="mt-0.5">
            {totalCards}
          </ThemedText>
        </Card>
      </View>

      {error ? (
        <Card className="rounded-2xl bg-danger/10">
          <ThemedText className="text-danger">{error}</ThemedText>
        </Card>
      ) : null}

      <Card className="rounded-2xl">
        <ThemedText type="defaultSemiBold">Review activity (7d)</ThemedText>
        <ThemedText className="mt-1 text-sm opacity-75">Daily graded cards over the last week.</ThemedText>
        <View className="mt-3 h-48">
          <CartesianChart
            data={activity7d}
            xKey="label"
            yKeys={['value']}
            axisOptions={{
              labelColor: axisLabelColor,
              lineColor: axisLineColor,
              tickCount: { x: 7, y: 4 },
              formatYLabel: (value) => `${value}`,
            }}
            domainPadding={{ left: 18, right: 18, top: 20 }}
          >
            {({ points, chartBounds }) => (
              <Bar
                points={points.value}
                chartBounds={chartBounds}
                color={primaryColor}
                roundedCorners={{ topLeft: 4, topRight: 4 }}
              />
            )}
          </CartesianChart>
        </View>
      </Card>

      <Card className="rounded-2xl">
        <ThemedText type="defaultSemiBold">Due forecast (next 7d)</ThemedText>
        <ThemedText className="mt-1 text-sm opacity-75">Cards scheduled in the upcoming week.</ThemedText>
        <View className="mt-3 h-48">
          <CartesianChart
            data={dueForecast7d}
            xKey="label"
            yKeys={['value']}
            axisOptions={{
              labelColor: axisLabelColor,
              lineColor: axisLineColor,
              tickCount: { x: 7, y: 4 },
              formatYLabel: (value) => `${value}`,
            }}
            domainPadding={{ left: 16, right: 16, top: 16 }}
          >
            {({ points }) => <Line points={points.value} color={infoColor} strokeWidth={3} />}
          </CartesianChart>
        </View>
      </Card>
    </ScrollView>
  );
}

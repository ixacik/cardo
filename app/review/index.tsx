import { ReviewFlipCard } from '@/components/review/review-flip-card';
import {
  ReviewConfetti,
  type ReviewConfettiRef,
} from '@/components/review/review-confetti';
import { ReviewGradeBar } from '@/components/review/review-grade-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui';
import { useCards } from '@/hooks/useCards';
import { db } from '@/services/instant';
import {
  hasDeckStudyOptions,
  resolveDeckStudyOptions,
  toDeckScope,
  type RawDeckStudyOptionsRecord,
} from '@/services/review/deck-options';
import {
  applyCustomStudyOverrides,
  isDailyStateRecordForDeck,
  parseDailyDeckState,
  type RawDailyDeckStateRecord,
} from '@/services/review/daily-state';
import { toLocalDayStamp } from '@/services/review/day';
import { parseReviewSettings } from '@/services/review/settings';
import {
  advanceStudySessionState,
  createStudySessionState,
  getCurrentQueueEntry,
  hasStudySessionWork,
  refreshStudySessionState,
  type StudySessionState,
} from '@/services/review/study-session-machine';
import {
  advanceEasyStreak,
  createInitialEasyStreakState,
} from '@/services/review/easy-streak';
import type { Card, ReviewRating } from '@/types/card';
import type { CustomStudyOptions } from '@/types/study';
import { id as createId } from '@instantdb/react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LIP_COLLAPSED_HEIGHT = 64;
const LIP_EXPANDED_HEIGHT = 248;
const FLIP_ANIMATION_CONFIG = {
  duration: 420,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
} as const;
const CONFETTI_PARTICLE_COUNT = 45;
const CONFETTI_DURATION_MS = 2450;
const EASY_CONFETTI_LEADOUT_MS = 280;

const waitFor = (durationMs: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, durationMs));

const toSingleParamValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }
  return undefined;
};

const decodeDeckName = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded.length > 0 ? decoded : undefined;
  } catch {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
};

const parsePositiveInt = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return parsed;
};

const parseFlag = (value: string | undefined): boolean => value === '1' || value === 'true';

type RawSettingsRecord = {
  dailyReviewGoal?: unknown;
  learnNewCardsPerSession?: unknown;
  reviewSessionLimit?: unknown;
  learnSessionLimit?: unknown;
};

const formatCountdown = (targetMs: number, nowMs: number): string => {
  const remainingMs = Math.max(targetMs - nowMs, 0);
  const totalSeconds = Math.ceil(remainingMs / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

const formatRemaining = (value: number): string => (value < 0 ? 'No cap' : String(Math.max(value, 0)));

export default function ReviewScreen() {
  const params = useLocalSearchParams<{
    deckName?: string;
    customNewDelta?: string;
    customReviewDelta?: string;
    forgotten?: string;
    ahead?: string;
  }>();

  const resolvedDeckName = decodeDeckName(toSingleParamValue(params.deckName));
  const requestedCustomStudy = useMemo<CustomStudyOptions>(
    () => ({
      addNewCards: parsePositiveInt(toSingleParamValue(params.customNewDelta)),
      addReviewCards: parsePositiveInt(toSingleParamValue(params.customReviewDelta)),
      includeForgotten: parseFlag(toSingleParamValue(params.forgotten)),
      includeReviewAhead: parseFlag(toSingleParamValue(params.ahead)),
    }),
    [params.ahead, params.customNewDelta, params.customReviewDelta, params.forgotten]
  );

  const { user, isLoading: authLoading } = db.useAuth();
  const { cards, loading: cardsLoading, gradeCardReview } = useCards();
  const insets = useSafeAreaInsets();

  const dayStamp = toLocalDayStamp(Date.now());

  const deckStudyOptionsQuery = db.useQuery(
    user
      ? {
          deckStudyOptions: {
            $: {
              where: {
                ownerId: user.id,
              },
            },
          },
        }
      : null
  );

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

  const dailyStateQuery = db.useQuery(
    user
      ? {
          dailyDeckStates: {
            $: {
              where: {
                ownerId: user.id,
                dayStamp,
              },
            },
          },
        }
      : null
  );

  const optionsRecords = useMemo(
    () => (deckStudyOptionsQuery.data?.deckStudyOptions ?? []) as RawDeckStudyOptionsRecord[],
    [deckStudyOptionsQuery.data?.deckStudyOptions]
  );
  const dailyStateRecords = useMemo(
    () => (dailyStateQuery.data?.dailyDeckStates ?? []) as RawDailyDeckStateRecord[],
    [dailyStateQuery.data?.dailyDeckStates]
  );
  const settingsRecord = (settingsQuery.data?.settings?.[0] ?? null) as RawSettingsRecord | null;

  const [sessionState, setSessionState] = useState<StudySessionState | null>(null);
  const [sessionCardsById, setSessionCardsById] = useState<Map<string, Card>>(() => new Map());
  const [easyStreak, setEasyStreak] = useState(createInitialEasyStreakState);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEasyCelebrating, setIsEasyCelebrating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUnmountedRef = useRef(false);
  const confettiRef = useRef<ReviewConfettiRef>(null);
  const customDeltaAppliedRef = useRef(false);
  const dailyStateRecordIdRef = useRef<string | null>(null);
  const flipProgress = useSharedValue(0);
  const gradeBounceTrigger = useSharedValue(0);
  const topBarTrackWidth = useSharedValue(0);
  const topBarProgress = useSharedValue(0);

  const persistDailyState = useCallback(
    async (nextDailyState: StudySessionState['dailyState'], preferredRecordId?: string) => {
      if (!user) {
        return;
      }

      const deckScope = toDeckScope(resolvedDeckName);
      const resolvedRecordId =
        preferredRecordId ??
        dailyStateRecordIdRef.current ??
        createId();
      dailyStateRecordIdRef.current = resolvedRecordId;
      await db.transact(
        db.tx.dailyDeckStates[resolvedRecordId].update({
          ownerId: user.id,
          deckName: deckScope,
          dayStamp: nextDailyState.dayStamp,
          newShown: nextDailyState.newShown,
          reviewShown: nextDailyState.reviewShown,
          customNewDelta: nextDailyState.customNewDelta,
          customReviewDelta: nextDailyState.customReviewDelta,
          lastResetAt: nextDailyState.lastResetAt,
          updatedAt: Date.now(),
        })
      );
    },
    [resolvedDeckName, user]
  );

  const createSession = useCallback(async () => {
    if (!user) {
      return;
    }

    const now = Date.now();
    const cardsById = new Map(cards.map((card) => [card.id, card]));

    const matchingDailyRecord = dailyStateRecords.find((record) => isDailyStateRecordForDeck(record, resolvedDeckName));
    dailyStateRecordIdRef.current =
      matchingDailyRecord && typeof matchingDailyRecord.id === 'string'
        ? matchingDailyRecord.id
        : null;
    let nextDailyState = parseDailyDeckState(matchingDailyRecord, resolvedDeckName, now, dayStamp);

    const needsRecordBootstrap = !matchingDailyRecord;
    const shouldApplyCustomDeltas =
      !customDeltaAppliedRef.current &&
      ((requestedCustomStudy.addNewCards ?? 0) > 0 || (requestedCustomStudy.addReviewCards ?? 0) > 0);

    if (shouldApplyCustomDeltas) {
      nextDailyState = applyCustomStudyOverrides(nextDailyState, requestedCustomStudy);
      customDeltaAppliedRef.current = true;
    }

    if (needsRecordBootstrap || shouldApplyCustomDeltas) {
      await persistDailyState(nextDailyState, dailyStateRecordIdRef.current ?? undefined);
    }

    const baseOptions = resolveDeckStudyOptions(optionsRecords, resolvedDeckName);
    const hasConfiguredOptions = hasDeckStudyOptions(optionsRecords, resolvedDeckName);
    const settingsFallback = parseReviewSettings(settingsRecord);
    const options = hasConfiguredOptions
      ? baseOptions
      : {
          ...baseOptions,
          reviewPerDay: settingsFallback.dailyReviewGoal,
          newPerDay: settingsFallback.learnNewCardsPerSession,
        };

    const nextSession = createStudySessionState({
      cards: Array.from(cardsById.values()),
      deckName: resolvedDeckName,
      options,
      dailyState: nextDailyState,
      customStudy: requestedCustomStudy,
      nowMs: now,
    });

    setSessionCardsById(cardsById);
    setSessionState(nextSession);
    setIsFlipped(false);
    setIsEasyCelebrating(false);
    setEasyStreak(createInitialEasyStreakState);
    setSubmitting(false);
    setError(null);
  }, [
    cards,
    dailyStateRecords,
    dayStamp,
    optionsRecords,
    persistDailyState,
    requestedCustomStudy,
    resolvedDeckName,
    settingsRecord,
    user,
  ]);

  useEffect(() => {
    setSessionState(null);
    setSessionCardsById(new Map());
    setIsFlipped(false);
    setIsEasyCelebrating(false);
    setEasyStreak(createInitialEasyStreakState);
    setSubmitting(false);
    setError(null);
    customDeltaAppliedRef.current = false;
    dailyStateRecordIdRef.current = null;
  }, [
    resolvedDeckName,
    requestedCustomStudy.addNewCards,
    requestedCustomStudy.addReviewCards,
    requestedCustomStudy.includeForgotten,
    requestedCustomStudy.includeReviewAhead,
    user?.id,
  ]);

  const isDataLoading =
    authLoading ||
    cardsLoading ||
    (!!user &&
      (deckStudyOptionsQuery.isLoading || dailyStateQuery.isLoading || settingsQuery.isLoading));

  useEffect(() => {
    if (isDataLoading || !user || sessionState) {
      return;
    }

    void createSession().catch((err) => {
      setError(err instanceof Error ? err.message : 'Could not start study session.');
    });
  }, [createSession, isDataLoading, sessionState, user]);

  useEffect(() => {
    if (!sessionState) {
      return;
    }

    setSessionCardsById((previous) => {
      let changed = false;
      const next = new Map(previous);
      cards.forEach((card) => {
        const existing = next.get(card.id);
        if (!existing || card.updatedAt > existing.updatedAt) {
          next.set(card.id, card);
          changed = true;
        }
      });

      if (changed) {
        setSessionState((prior) => {
          if (!prior) {
            return prior;
          }
          return refreshStudySessionState({
            state: prior,
            cards: Array.from(next.values()),
            nowMs: Date.now(),
          });
        });
      }

      return changed ? next : previous;
    });
  }, [cards, sessionState]);

  useEffect(() => {
    if (!sessionState || sessionState.queue.length > 0 || sessionState.nextPendingLearningDueAt === null) {
      return;
    }

    const delayMs = Math.max(sessionState.nextPendingLearningDueAt - Date.now(), 250);
    const timeout = setTimeout(() => {
      setSessionState((prior) => {
        if (!prior) {
          return prior;
        }

        return refreshStudySessionState({
          state: prior,
          cards: Array.from(sessionCardsById.values()),
          nowMs: Date.now(),
        });
      });
    }, delayMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [sessionCardsById, sessionState]);

  const nowMs = Date.now();
  const currentEntry = sessionState ? getCurrentQueueEntry(sessionState) : null;
  const currentCard = currentEntry ? sessionCardsById.get(currentEntry.cardId) : undefined;
  const reviewedCount = sessionState?.reviewedCount ?? 0;
  const totalCards = Math.max(reviewedCount + (sessionState?.queue.length ?? 0), 1);
  const hasPendingWork = sessionState ? hasStudySessionWork(sessionState) : false;
  const isComplete = Boolean(sessionState) && !hasPendingWork;
  const reviewProgressRatio =
    totalCards > 0
      ? isComplete
        ? 1
        : Math.min(Math.max(reviewedCount / totalCards, 0), 1)
      : 0;
  const topBarTop = insets.top + 8;
  const topBarLeft = insets.left + 12;
  const topBarRight = insets.right + 22;
  const reviewContentTopInset = insets.top + 64;
  const topBarFillAnimatedStyle = useAnimatedStyle(() => ({
    width: topBarTrackWidth.value * topBarProgress.value,
  }));

  const remainingTodayMessage = sessionState
    ? `${formatRemaining(sessionState.queueBuild.remaining.review)} review left · ${formatRemaining(
        sessionState.queueBuild.remaining.new
      )} new left today`
    : '';

  const topMetaMessage = resolvedDeckName ? `${resolvedDeckName} deck` : 'All decks';

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    flipProgress.value = withTiming(isFlipped ? 1 : 0, FLIP_ANIMATION_CONFIG);
  }, [flipProgress, isFlipped]);

  useEffect(() => {
    topBarProgress.value = withSpring(reviewProgressRatio, {
      damping: 17,
      mass: 0.95,
      stiffness: 220,
    });
  }, [reviewProgressRatio, topBarProgress]);

  const lipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipProgress.value, [0, 1], [0.96, 1]),
    transform: [{ translateY: interpolate(flipProgress.value, [0, 1], [18, 0]) }],
  }));

  const lipContentAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(
      flipProgress.value,
      [0, 1],
      [LIP_COLLAPSED_HEIGHT, LIP_EXPANDED_HEIGHT],
      Extrapolation.CLAMP
    ),
  }));

  const hintAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipProgress.value, [0, 0.35], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(flipProgress.value, [0, 1], [0, -8], Extrapolation.CLAMP),
      },
    ],
  }));

  const onTopBarTrackLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (Math.abs(topBarTrackWidth.value - nextWidth) > 0.5) {
      topBarTrackWidth.value = nextWidth;
    }
  };

  const renderTopBar = () => (
    <View
      pointerEvents="box-none"
      className="absolute z-30 flex-row items-center"
      style={{ top: topBarTop, left: topBarLeft, right: topBarRight }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        accessibilityHint="Returns to the previous screen"
        onPress={() => router.back()}
        style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
      >
        <GlassView
          glassEffectStyle="regular"
          style={{ borderRadius: 999, overflow: 'hidden' }}
          isInteractive
        >
          <View className="size-11 items-center justify-center">
            <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
          </View>
        </GlassView>
      </Pressable>

      <View
        onLayout={onTopBarTrackLayout}
        className="ml-3 h-3 flex-1 overflow-hidden rounded-full bg-muted-light/30 dark:bg-muted-dark/35"
      >
        <Animated.View className="h-full rounded-full bg-primary" style={topBarFillAnimatedStyle} />
      </View>
    </View>
  );

  if (authLoading || cardsLoading || (!sessionState && isDataLoading)) {
    return (
      <ThemedView className="relative flex-1 bg-panel-light dark:bg-panel-dark">
        {renderTopBar()}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator colorClassName="text-primary" />
        </View>
      </ThemedView>
    );
  }

  if (!user) {
    return <Redirect href="/sign-in" />;
  }

  if (!sessionState) {
    return (
      <ThemedView className="relative flex-1 bg-panel-light dark:bg-panel-dark">
        {renderTopBar()}
        <View className="flex-1 items-center justify-center px-5">
          <ActivityIndicator colorClassName="text-primary" />
          {error ? <ThemedText className="mt-3 text-center text-danger">{error}</ThemedText> : null}
        </View>
      </ThemedView>
    );
  }

  const startNewSession = () => {
    setSessionState(
      createStudySessionState({
        cards: Array.from(sessionCardsById.values()),
        deckName: resolvedDeckName,
        options: sessionState.options,
        dailyState: sessionState.dailyState,
        customStudy: sessionState.customStudy,
        nowMs: Date.now(),
      })
    );
    setIsFlipped(false);
    setEasyStreak(createInitialEasyStreakState);
    setError(null);
  };

  const onGradeCard = async (rating: ReviewRating) => {
    if (!currentCard || !sessionState || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const flipDurationMs = FLIP_ANIMATION_CONFIG.duration;
      const swapContentDelayMs = Math.round(flipDurationMs * 0.55);
      const postSwapSettleMs = Math.max(flipDurationMs - swapContentDelayMs, 0);

      const updatedCard = await gradeCardReview(currentCard.id, rating, sessionState.options);
      const nextCardsById = new Map(sessionCardsById);
      nextCardsById.set(updatedCard.id, updatedCard);
      setSessionCardsById(nextCardsById);
      setEasyStreak((previous) => advanceEasyStreak(previous, rating));

      let didTriggerConfetti = false;
      if (rating === 'easy') {
        setIsEasyCelebrating(true);
        gradeBounceTrigger.value += 1;
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        confettiRef.current?.burst();
        didTriggerConfetti = true;
      }

      const confettiNearEndDelay =
        rating === 'easy' && didTriggerConfetti
          ? Math.max(CONFETTI_DURATION_MS - EASY_CONFETTI_LEADOUT_MS, 0)
          : 0;
      if (confettiNearEndDelay > 0) {
        await waitFor(confettiNearEndDelay);
      }

      if (isUnmountedRef.current) {
        return;
      }
      setIsEasyCelebrating(false);
      setIsFlipped(false);

      if (swapContentDelayMs > 0) {
        await waitFor(swapContentDelayMs);
      }

      if (isUnmountedRef.current) {
        return;
      }

      const nextSession = advanceStudySessionState({
        state: sessionState,
        cards: Array.from(nextCardsById.values()),
        currentCardId: currentCard.id,
        nowMs: Date.now(),
      });
      setSessionState(nextSession);
      await persistDailyState(nextSession.dailyState);

      if (postSwapSettleMs > 0) {
        await waitFor(postSwapSettleMs);
      }
    } catch (err) {
      if (!isUnmountedRef.current) {
        setIsEasyCelebrating(false);
        setError(err instanceof Error ? err.message : 'Could not submit review grade.');
      }
    } finally {
      if (!isUnmountedRef.current) {
        setIsEasyCelebrating(false);
        setSubmitting(false);
      }
    }
  };

  const toggleCardFace = () => {
    if (submitting) {
      return;
    }

    setIsFlipped((previous) => !previous);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  if (isComplete) {
    const emptyMessage =
      reviewedCount > 0
        ? `You reviewed ${reviewedCount} card${reviewedCount === 1 ? '' : 's'} in this session.`
        : 'No cards are ready right now.';

    return (
      <ThemedView className="relative flex-1 bg-panel-light dark:bg-panel-dark">
        {renderTopBar()}
        <View
          className="flex-1 items-stretch justify-center px-5 py-5"
          style={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
            paddingLeft: insets.left + 20,
            paddingRight: insets.right + 20,
          }}
        >
          <ThemedText type="title">Study complete</ThemedText>
          <ThemedText className="mt-1 opacity-70">{topMetaMessage}</ThemedText>
          <ThemedText className="mb-2 mt-3">{emptyMessage}</ThemedText>
          {easyStreak.best > 0 ? (
            <ThemedText className="mb-2 text-sm opacity-80">
              Best easy streak: {easyStreak.best}
            </ThemedText>
          ) : null}
          <ThemedText className="mb-6 text-sm opacity-70">{remainingTodayMessage}</ThemedText>

          <Button onPress={() => router.replace('/')} textClassName="font-bold">
            Back to cards
          </Button>

          <Button
            variant="secondary"
            className="mt-3"
            textClassName="text-link"
            onPress={startNewSession}
          >
            Study again
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (!currentCard) {
    const nextDueAt = sessionState.nextPendingLearningDueAt;
    const countdown = nextDueAt ? formatCountdown(nextDueAt, nowMs) : null;

    return (
      <ThemedView className="relative flex-1 bg-panel-light dark:bg-panel-dark">
        {renderTopBar()}
        <View className="flex-1 items-center justify-center px-5">
          <ActivityIndicator colorClassName="text-primary" />
          <ThemedText className="mt-3 text-center opacity-70">
            {countdown ? `Next learning card in ${countdown}.` : 'Checking your next card...'}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      className="relative flex-1 bg-panel-light dark:bg-panel-dark"
      style={{ paddingLeft: insets.left, paddingRight: insets.right }}
    >
      {renderTopBar()}

      <ScrollView
        className="z-0 flex-1 px-3"
        contentContainerClassName="gap-2.5 flex-grow"
        contentContainerStyle={{
          paddingTop: reviewContentTopInset,
          paddingBottom: LIP_COLLAPSED_HEIGHT + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={toggleCardFace}
          className="flex-1 gap-2.5"
          style={({ pressed }) => ({ opacity: pressed ? 0.99 : 1 })}
        >
          <ReviewFlipCard
            title={currentCard.title}
            frontText={currentCard.frontText}
            backText={currentCard.backText}
            flipProgress={flipProgress}
          />

          {error ? <ThemedText className="mt-2.5 text-danger">{error}</ThemedText> : null}
        </Pressable>
      </ScrollView>

      <View pointerEvents="none" className="absolute inset-0 z-10">
        <ReviewConfetti
          ref={confettiRef}
          durationMs={CONFETTI_DURATION_MS}
          particleCount={CONFETTI_PARTICLE_COUNT}
        />
      </View>

      <Animated.View
        className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl bg-surface-light px-3 pt-3 dark:bg-surface-dark"
        style={[lipAnimatedStyle, { paddingBottom: 12 }]}
      >
        <Animated.View className="overflow-hidden" style={lipContentAnimatedStyle}>
          {easyStreak.current > 1 ? (
            <View className="mb-2 items-center">
              <ThemedText className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                Easy streak {easyStreak.current}
              </ThemedText>
            </View>
          ) : null}
          <View>
            <ReviewGradeBar
              onGrade={onGradeCard}
              disabled={submitting || !isFlipped}
              visibilityProgress={flipProgress}
              gradeBounceTrigger={gradeBounceTrigger}
              celebratingRating={isEasyCelebrating ? 'easy' : null}
            />
          </View>

          <Animated.View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center"
            style={hintAnimatedStyle}
          >
            <ThemedText className="mb-8 text-center text-sm opacity-70">
              Flip the card to reveal grading options.
            </ThemedText>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </ThemedView>
  );
}

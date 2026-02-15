import {
	ReviewConfetti,
	type ReviewConfettiRef,
} from "@/components/review/review-confetti";
import { ReviewFlipCard } from "@/components/review/review-flip-card";
import { ReviewGradeBar } from "@/components/review/review-grade-bar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui";
import { useCards } from "@/hooks/useCards";
import { db } from "@/services/instant";
import { buildReviewQueue } from "@/services/review/fsrs";
import type { ReviewRating } from "@/types/card";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { AudioPlayer } from "expo-audio";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { Redirect, router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	type LayoutChangeEvent,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import Animated, {
	Easing,
	Extrapolation,
	interpolate,
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useCSSVariable } from "uniwind";

const LIP_COLLAPSED_HEIGHT = 64;
const LIP_EXPANDED_HEIGHT = 248;
const FLIP_ANIMATION_CONFIG = {
	duration: 420,
	easing: Easing.bezier(0.22, 1, 0.36, 1),
} as const;
const CONFETTI_PARTICLE_COUNT = 45;
const CONFETTI_DURATION_MS = 2450;
const EASY_CONFETTI_LEADOUT_MS = 280;
const NON_EASY_CELEBRATION_MS = 220;
const CHIME_VOLUME = 0.62;
const TOP_BAR_STREAK_ICON_SIZE = 30;
const TOP_BAR_STREAK_SLOT_WIDTH = 50;
const TOP_BAR_STREAK_SLOT_GAP = 4;
const FIRST_STREAK_BOUNCE_DELAY_MS = 180;

const waitFor = (durationMs: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, durationMs));

export default function ReviewScreen() {
	const { user, isLoading: authLoading } = db.useAuth();
	const { cards, loading: cardsLoading, gradeCardReview } = useCards();
	const insets = useSafeAreaInsets();

	const [sessionCardIds, setSessionCardIds] = useState<string[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [reviewedCount, setReviewedCount] = useState(0);
	const [displayReviewedCount, setDisplayReviewedCount] = useState(0);
	const [easyStreak, setEasyStreak] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [celebratingRating, setCelebratingRating] =
		useState<ReviewRating | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const isUnmountedRef = useRef(false);
	const previousEasyStreakRef = useRef(0);
	const confettiRef = useRef<ReviewConfettiRef>(null);
	const flipProgress = useSharedValue(0);
	const gradeBounceTrigger = useSharedValue(0);
	const topBarTrackWidth = useSharedValue(0);
	const topBarProgress = useSharedValue(0);
	const topBarStreakProgress = useSharedValue(0);
	const topBarStreakPop = useSharedValue(0);
	const positiveChimePlayer = useAudioPlayer(
		require("../../assets/sounds/grade-positive-chime.wav"),
		{ keepAudioSessionActive: true },
	);
	const [primary, warning] = useCSSVariable([
		"--color-primary",
		"--color-warning",
	]);

	const toColorValue = (
		value: string | number | undefined,
		fallback: string,
	): string => (typeof value === "string" ? value : fallback);

	const topBarPrimaryColor = toColorValue(primary, "#0a84ff");
	const topBarStreakColor = toColorValue(warning, "#ef6c00");

	const cardById = useMemo(
		() => new Map(cards.map((card) => [card.id, card])),
		[cards],
	);
	const currentCard = sessionCardIds[currentIndex]
		? cardById.get(sessionCardIds[currentIndex])
		: undefined;
	const totalCards = sessionCardIds.length;
	const isComplete = totalCards === 0 || currentIndex >= totalCards;
	const reviewProgressRatio =
		totalCards > 0
			? isComplete
				? 1
				: Math.min(Math.max(displayReviewedCount / totalCards, 0), 1)
			: 0;
	const topBarTop = insets.top + 8;
	const topBarLeft = insets.left + 12;
	const topBarRight = insets.right + 32;
	const reviewContentTopInset = insets.top + 64;
	const topBarFillAnimatedStyle = useAnimatedStyle(() => ({
		width: topBarTrackWidth.value * topBarProgress.value,
		backgroundColor: interpolateColor(
			topBarStreakProgress.value,
			[0, 1],
			[topBarPrimaryColor, topBarStreakColor],
		),
	}));

	const topBarStreakBadgeAnimatedStyle = useAnimatedStyle(() => ({
		width: interpolate(
			topBarStreakProgress.value,
			[0, 1],
			[0, TOP_BAR_STREAK_SLOT_WIDTH],
			Extrapolation.CLAMP,
		),
		marginLeft: interpolate(
			topBarStreakProgress.value,
			[0, 1],
			[0, TOP_BAR_STREAK_SLOT_GAP],
			Extrapolation.CLAMP,
		),
		opacity: topBarStreakProgress.value,
		transform: [
			{
				translateY: interpolate(
					topBarStreakProgress.value,
					[0, 1],
					[3, 0],
					Extrapolation.CLAMP,
				),
			},
			{
				scale: interpolate(
					topBarStreakProgress.value,
					[0, 1],
					[0.92, 1],
					Extrapolation.CLAMP,
				),
			},
		],
	}));

	const topBarStreakIconAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: 1 + topBarStreakPop.value * 0.12 }],
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
					style={{ borderRadius: 999, overflow: "hidden" }}
					isInteractive
				>
					<View className="size-11 items-center justify-center">
						<MaterialIcons name="arrow-back" size={20} color="#ffffff" />
					</View>
				</GlassView>
			</Pressable>

			<View className="ml-3 flex-1 flex-row items-center">
				<View
					onLayout={onTopBarTrackLayout}
					className="h-3 flex-1 overflow-hidden rounded-full bg-muted-light/30 dark:bg-muted-dark/35"
				>
					<Animated.View
						className="h-full rounded-full"
						style={topBarFillAnimatedStyle}
					/>
				</View>

				<Animated.View
					pointerEvents="none"
					className="-mr-1 h-9 items-center justify-center overflow-hidden"
					style={topBarStreakBadgeAnimatedStyle}
				>
					<View className="h-8 flex-row items-center gap-1">
						<Animated.View style={topBarStreakIconAnimatedStyle}>
							<Svg
								xmlns="http://www.w3.org/2000/svg"
								width={24}
								height={24}
								viewBox="0 0 24 24"
								fill={topBarStreakColor}
								stroke={topBarStreakColor}
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
								style={{
									width: TOP_BAR_STREAK_ICON_SIZE,
									height: TOP_BAR_STREAK_ICON_SIZE,
								}}
							>
								<Path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
							</Svg>
						</Animated.View>
						<ThemedText className="text-sm font-semibold text-fg-dark">
							{easyStreak}
						</ThemedText>
					</View>
				</Animated.View>
			</View>
		</View>
	);

	useEffect(() => {
		if (cardsLoading || authLoading || sessionCardIds.length > 0) {
			return;
		}

		const initialQueue = buildReviewQueue(cards);
		if (initialQueue.length === 0) {
			return;
		}

		setSessionCardIds(initialQueue.map((card) => card.id));
	}, [authLoading, cards, cardsLoading, sessionCardIds.length]);

	useEffect(() => {
		if (!currentCard && currentIndex < sessionCardIds.length) {
			setCurrentIndex((prev) => prev + 1);
			setIsFlipped(false);
		}
	}, [currentCard, currentIndex, sessionCardIds.length]);

	useEffect(() => {
		return () => {
			isUnmountedRef.current = true;
		};
	}, []);

	useEffect(() => {
		flipProgress.value = withTiming(isFlipped ? 1 : 0, FLIP_ANIMATION_CONFIG);
	}, [flipProgress, isFlipped]);

	useEffect(() => {
		void setAudioModeAsync({
			interruptionMode: "mixWithOthers",
			playsInSilentMode: true,
			shouldPlayInBackground: false,
		}).catch(() => undefined);
	}, []);

	useEffect(() => {
		positiveChimePlayer.volume = CHIME_VOLUME;
	}, [positiveChimePlayer]);

	useEffect(() => {
		topBarProgress.value = withSpring(reviewProgressRatio, {
			damping: 17,
			mass: 0.95,
			stiffness: 220,
			energyThreshold: 0.0006,
		});
	}, [reviewProgressRatio, topBarProgress]);

	useEffect(() => {
		const hasStreak = easyStreak > 0 ? 1 : 0;
		const hadStreak = previousEasyStreakRef.current > 0;
		topBarStreakProgress.value = withSpring(hasStreak, {
			damping: 18,
			mass: 0.9,
			stiffness: 205,
			energyThreshold: 0.0006,
		});
		if (hasStreak === 0) {
			topBarStreakPop.value = 0;
			previousEasyStreakRef.current = easyStreak;
			return;
		}

		const bounceDelayMs = hadStreak ? 0 : FIRST_STREAK_BOUNCE_DELAY_MS;
		topBarStreakPop.value = 0;
		topBarStreakPop.value = withSequence(
			withDelay(
				bounceDelayMs,
				withTiming(1, {
					duration: 170,
					easing: Easing.out(Easing.cubic),
				}),
			),
			withTiming(0, {
				duration: 220,
				easing: Easing.out(Easing.cubic),
			}),
		);
		previousEasyStreakRef.current = easyStreak;
	}, [easyStreak, topBarStreakPop, topBarStreakProgress]);

	const playChime = (player: AudioPlayer) => {
		void player
			.seekTo(0)
			.then(() => {
				player.play();
			})
			.catch(() => {
				try {
					player.play();
				} catch {
					// ignore playback race conditions when the player has not loaded yet
				}
			});
	};

	const lipAnimatedStyle = useAnimatedStyle(() => ({
		opacity: interpolate(flipProgress.value, [0, 1], [0.96, 1]),
		transform: [
			{ translateY: interpolate(flipProgress.value, [0, 1], [18, 0]) },
		],
	}));

	const lipContentAnimatedStyle = useAnimatedStyle(() => ({
		height: interpolate(
			flipProgress.value,
			[0, 1],
			[LIP_COLLAPSED_HEIGHT, LIP_EXPANDED_HEIGHT],
			Extrapolation.CLAMP,
		),
	}));

	const hintAnimatedStyle = useAnimatedStyle(() => ({
		opacity: interpolate(
			flipProgress.value,
			[0, 0.35],
			[1, 0],
			Extrapolation.CLAMP,
		),
		transform: [
			{
				translateY: interpolate(
					flipProgress.value,
					[0, 1],
					[0, -8],
					Extrapolation.CLAMP,
				),
			},
		],
	}));

	if (authLoading || cardsLoading) {
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

	const startNewSession = () => {
		const nextQueue = buildReviewQueue(cards);
		setSessionCardIds(nextQueue.map((card) => card.id));
		setCurrentIndex(0);
		setReviewedCount(0);
		setDisplayReviewedCount(0);
		setEasyStreak(0);
		setIsFlipped(false);
		setError(null);
	};

	const onGradeCard = async (rating: ReviewRating) => {
		if (!currentCard || submitting) {
			return;
		}

		setSubmitting(true);
		setError(null);
		const nextDisplayedCount = Math.min(reviewedCount + 1, totalCards);
		const nextStreak = rating === "easy" ? easyStreak + 1 : 0;

		setDisplayReviewedCount(nextDisplayedCount);
		setEasyStreak(nextStreak);
		setCelebratingRating(rating);
		gradeBounceTrigger.value += 1;

		try {
			const flipDurationMs = FLIP_ANIMATION_CONFIG.duration;
			const swapContentDelayMs = Math.round(flipDurationMs * 0.55);
			const postSwapSettleMs = Math.max(flipDurationMs - swapContentDelayMs, 0);

			await gradeCardReview(currentCard.id, rating);
			let celebrationDelayMs = NON_EASY_CELEBRATION_MS;

			if (rating === "easy") {
				playChime(positiveChimePlayer);
				void Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Success,
				).catch(() => undefined);
				confettiRef.current?.burst();
				celebrationDelayMs = Math.max(
					CONFETTI_DURATION_MS - EASY_CONFETTI_LEADOUT_MS,
					0,
				);
			} else if (rating === "again") {
				void Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Warning,
				).catch(() => undefined);
			} else {
				// hard/good: no chime, only brief visual hold state
				void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
					() => undefined,
				);
			}

			if (celebrationDelayMs > 0) {
				await waitFor(celebrationDelayMs);
			}

			if (isUnmountedRef.current) {
				return;
			}
			setCelebratingRating(null);
			setIsFlipped(false);

			if (swapContentDelayMs > 0) {
				await waitFor(swapContentDelayMs);
			}

			if (isUnmountedRef.current) {
				return;
			}
			setReviewedCount((prev) => prev + 1);
			setCurrentIndex((prev) => prev + 1);

			if (postSwapSettleMs > 0) {
				await waitFor(postSwapSettleMs);
			}
		} catch (err) {
			if (!isUnmountedRef.current) {
				setDisplayReviewedCount(reviewedCount);
				setEasyStreak(easyStreak);
				setCelebratingRating(null);
				setError(
					err instanceof Error ? err.message : "Could not submit review grade.",
				);
			}
		} finally {
			if (!isUnmountedRef.current) {
				setCelebratingRating(null);
				setSubmitting(false);
			}
		}
	};

	const toggleCardFace = () => {
		if (submitting) {
			return;
		}

		setIsFlipped((prev) => !prev);
		void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
			() => undefined,
		);
	};

	if (isComplete) {
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
					<ThemedText type="title">Review complete</ThemedText>
					<ThemedText className="mb-6 mt-3">
						{totalCards > 0
							? `You reviewed ${reviewedCount} card${reviewedCount === 1 ? "" : "s"} in this session.`
							: "No cards are due right now."}
					</ThemedText>

					<Button onPress={() => router.replace("/")} textClassName="font-bold">
						Back to cards
					</Button>

					<Button
						variant="secondary"
						className="mt-3"
						textClassName="text-link"
						onPress={startNewSession}
					>
						Start another session
					</Button>
				</View>
			</ThemedView>
		);
	}

	if (!currentCard) {
		return (
			<ThemedView className="relative flex-1 bg-panel-light dark:bg-panel-dark">
				{renderTopBar()}
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator colorClassName="text-primary" />
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

					{error ? (
						<ThemedText className="mt-2.5 text-danger">{error}</ThemedText>
					) : null}
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
				<Animated.View
					className="overflow-hidden"
					style={lipContentAnimatedStyle}
				>
					<View>
						<ReviewGradeBar
							onGrade={onGradeCard}
							disabled={submitting || !isFlipped}
							visibilityProgress={flipProgress}
							gradeBounceTrigger={gradeBounceTrigger}
							celebratingRating={celebratingRating}
						/>
					</View>

					<Animated.View
						pointerEvents="none"
						className="absolute inset-0 items-center justify-center"
						style={hintAnimatedStyle}
					>
						<ThemedText className="text-center text-sm opacity-70 mb-8">
							Flip the card to reveal grading options.
						</ThemedText>
					</Animated.View>
				</Animated.View>
			</Animated.View>
		</ThemedView>
	);
}

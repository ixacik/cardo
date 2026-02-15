import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { ReviewRating } from "@/types/card";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import { Pressable, View } from "react-native";
import Animated, {
	Easing,
	Extrapolation,
	interpolate,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withTiming,
	type SharedValue,
} from "react-native-reanimated";
import { useCSSVariable } from "uniwind";

type ReviewGradeBarProps = {
	onGrade: (rating: ReviewRating) => void;
	disabled?: boolean;
	visibilityProgress: SharedValue<number>;
	gradeBounceTrigger: SharedValue<number>;
	celebratingRating?: ReviewRating | null;
};

type GradeButton = {
	rating: ReviewRating;
	label: string;
	iconName: ComponentProps<typeof MaterialIcons>["name"];
	iconTone: "again" | "hard" | "good" | "easy";
};

const gradeButtons: GradeButton[] = [
	{ rating: "again", label: "Again", iconName: "replay", iconTone: "again" },
	{
		rating: "hard",
		label: "Hard",
		iconName: "trending-down",
		iconTone: "hard",
	},
	{ rating: "good", label: "Good", iconName: "done", iconTone: "good" },
	{ rating: "easy", label: "Easy", iconName: "bolt", iconTone: "easy" },
];

type GradeButtonRowProps = {
	button: GradeButton;
	disabled: boolean;
	iconColor: string;
	index: number;
	isSelected: boolean;
	onGrade: (rating: ReviewRating) => void;
	selectedContentColor: string;
	visibilityProgress: SharedValue<number>;
	gradeBounceTrigger: SharedValue<number>;
};

function GradeButtonRow({
	button,
	disabled,
	iconColor,
	index,
	isSelected,
	onGrade,
	selectedContentColor,
	visibilityProgress,
	gradeBounceTrigger,
}: GradeButtonRowProps) {
	const rowDelay = index * 0.09;
	const rowDuration = 0.3;
	const gradeBounceScaleY = useSharedValue(1);

	useAnimatedReaction(
		() => gradeBounceTrigger.value,
		(nextValue, previousValue) => {
			if (!isSelected || nextValue === previousValue) {
				return;
			}

			gradeBounceScaleY.value = withSequence(
				withTiming(1.018, {
					duration: 120,
					easing: Easing.out(Easing.quad),
				}),
				withTiming(0.998, {
					duration: 100,
					easing: Easing.out(Easing.quad),
				}),
				withTiming(1, {
					duration: 130,
					easing: Easing.out(Easing.quad),
				}),
			);
		},
		[gradeBounceTrigger, isSelected],
	);

	const animatedStyle = useAnimatedStyle(() => {
		const rowProgress = interpolate(
			visibilityProgress.value,
			[rowDelay, rowDelay + rowDuration],
			[0, 1],
			Extrapolation.CLAMP,
		);

		const revealScaleY = interpolate(
			rowProgress,
			[0, 1],
			[0.992, 1],
			Extrapolation.CLAMP,
		);

		return {
			opacity: rowProgress,
			transform: [
				{
					translateY: interpolate(
						rowProgress,
						[0, 1],
						[-6, 0],
						Extrapolation.CLAMP,
					),
				},
				{
					scaleY: revealScaleY * gradeBounceScaleY.value,
				},
			],
		};
	});

	return (
		<Animated.View style={animatedStyle}>
			<Pressable
				accessibilityRole="button"
				disabled={disabled}
				onPress={() => onGrade(button.rating)}
				className={
					isSelected
						? "items-center justify-center rounded-2xl bg-success px-4 py-3"
						: "items-center justify-center rounded-2xl bg-tertiary-light px-4 py-3 dark:bg-tertiary-dark"
				}
				style={({ pressed }) => ({
					opacity:
						isSelected
							? 1
							: disabled
								? 0.6
								: pressed
									? 0.9
									: 1,
				})}
			>
				<View className="flex-row items-center justify-center gap-2">
					<MaterialIcons
						name={button.iconName}
						size={18}
						color={iconColor}
					/>
					<ThemedText
						className={
							isSelected
								? "text-center text-lg font-semibold text-fg-light dark:text-fg-dark"
								: "text-center text-lg font-semibold"
						}
					>
						{button.label}
					</ThemedText>
				</View>
			</Pressable>
		</Animated.View>
	);
}

export function ReviewGradeBar({
	onGrade,
	disabled = false,
	visibilityProgress,
	gradeBounceTrigger,
	celebratingRating = null,
}: ReviewGradeBarProps) {
	const isDark = useColorScheme() === "dark";
	const [mutedLight, mutedDark, dangerStrong, ratingGood, success, fgLight, fgDark] =
		useCSSVariable([
			"--color-muted-light",
			"--color-muted-dark",
			"--color-danger-strong",
			"--color-rating-good",
			"--color-success",
			"--color-fg-light",
			"--color-fg-dark",
		]);

	const toColorValue = (
		value: string | number | undefined,
		fallback: string,
	) => (typeof value === "string" ? value : fallback);

	const selectedContentColor = toColorValue(
		isDark ? fgDark : fgLight,
		isDark ? "#eceef0" : "#11181c",
	);

	const iconColorByTone: Record<GradeButton["iconTone"], string> = {
		again: toColorValue(
			isDark ? mutedDark : mutedLight,
			isDark ? "#9ba1a6" : "#687076",
		),
		hard: toColorValue(dangerStrong, "#c62828"),
		good: toColorValue(ratingGood, "#f4c542"),
		easy: toColorValue(success, "#2e7d32"),
	};

	return (
		<View className="gap-2.5">
			{gradeButtons.map((button, index) => (
				(() => {
					const isSelected = celebratingRating === button.rating;
					const iconColor = isSelected
						? selectedContentColor
						: iconColorByTone[button.iconTone];
					return (
				<GradeButtonRow
					key={button.rating}
					button={button}
					disabled={disabled}
					iconColor={iconColor}
					index={index}
					isSelected={isSelected}
					onGrade={onGrade}
					selectedContentColor={selectedContentColor}
					visibilityProgress={visibilityProgress}
					gradeBounceTrigger={gradeBounceTrigger}
				/>
					);
				})()
			))}
		</View>
	);
}

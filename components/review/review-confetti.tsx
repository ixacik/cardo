import {
	forwardRef,
	useCallback,
	useImperativeHandle,
	useMemo,
	useState,
} from "react";
import { type LayoutChangeEvent, View } from "react-native";
import Animated, {
	Easing,
	cancelAnimation,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	type SharedValue,
} from "react-native-reanimated";
import { useCSSVariable } from "uniwind";

import { useColorScheme } from "@/hooks/use-color-scheme";

export type ReviewConfettiRef = {
	burst: () => void;
};

type ReviewConfettiProps = {
	durationMs?: number;
	particleCount?: number;
};

type ParticleConfig = {
	color: string;
	id: number;
	delayMs: number;
	height: number;
	launchOffset: number;
	rotationStartDeg: number;
	rotationVelocityDeg: number;
	startX: number;
	velocityX: number;
	velocityY: number;
	gravity: number;
	wobbleAmplitude: number;
	wobbleFrequency: number;
	wobblePhase: number;
	width: number;
};

type ParticleProps = {
	config: ParticleConfig;
	containerHeight: number;
	durationMs: number;
	progress: SharedValue<number>;
};

const DEFAULT_DURATION_MS = 2450;
const DEFAULT_PARTICLE_COUNT = 45;
const MAX_PARTICLE_STAGGER_MS = 130;

const randomBetween = (min: number, max: number) =>
	Math.random() * (max - min) + min;

const createParticles = (
	count: number,
	containerWidth: number,
	palette: string[],
): ParticleConfig[] => {
	const launchCenterX = containerWidth / 2;
	const halfInitialSpread = containerWidth * 0.18;
	const horizontalVelocityRange = containerWidth * 0.9;

	return Array.from({ length: count }, (_, index) => {
		const width = randomBetween(6, 10);
		const height = randomBetween(10, 15);
		return {
			color: palette[index % palette.length] ?? "#0a84ff",
			id: index,
			delayMs: randomBetween(0, MAX_PARTICLE_STAGGER_MS),
			height,
			launchOffset: randomBetween(0, 24),
			rotationStartDeg: randomBetween(0, 360),
			rotationVelocityDeg: randomBetween(-620, 620),
			startX: launchCenterX + randomBetween(-halfInitialSpread, halfInitialSpread),
			velocityX: randomBetween(-horizontalVelocityRange, horizontalVelocityRange),
			velocityY: -randomBetween(800, 1450),
			gravity: randomBetween(860, 1400),
			wobbleAmplitude: randomBetween(2, 9),
			wobbleFrequency: randomBetween(2.2, 4.4),
			wobblePhase: randomBetween(0, Math.PI * 2),
			width,
		};
	});
};

function Particle({ config, containerHeight, durationMs, progress }: ParticleProps) {
	const animatedStyle = useAnimatedStyle(() => {
		const elapsedMs = progress.value * durationMs - config.delayMs;
		if (elapsedMs <= 0 || elapsedMs >= durationMs) {
			return { opacity: 0 };
		}

		const t = elapsedMs / 1000;
		const fadeStartMs = durationMs * 0.6;
		const opacityRaw = (durationMs - elapsedMs) / (durationMs - fadeStartMs);
		const opacity =
			elapsedMs < fadeStartMs ? 1 : Math.min(Math.max(opacityRaw, 0), 1);

		const x =
			config.startX +
			config.velocityX * t +
			Math.sin(t * config.wobbleFrequency + config.wobblePhase) *
				config.wobbleAmplitude;
		const y =
			containerHeight +
			config.launchOffset +
			config.velocityY * t +
			0.5 * config.gravity * t * t;
		const rotationDeg = config.rotationStartDeg + config.rotationVelocityDeg * t;

		return {
			opacity,
			transform: [
				{ translateX: x },
				{ translateY: y },
				{ rotateZ: `${rotationDeg}deg` },
			],
		};
	}, [config, containerHeight, durationMs, progress]);

	return (
		<Animated.View
			className="absolute rounded-sm"
			style={[
				animatedStyle,
				{
					backgroundColor: config.color,
					width: config.width,
					height: config.height,
				},
			]}
		/>
	);
}

export const ReviewConfetti = forwardRef<ReviewConfettiRef, ReviewConfettiProps>(
	function ReviewConfetti(
		{ durationMs = DEFAULT_DURATION_MS, particleCount = DEFAULT_PARTICLE_COUNT },
		ref,
	) {
		const isDark = useColorScheme() === "dark";
		const [
			primary,
			success,
			ratingGood,
			danger,
			warning,
			info,
			primaryPressed,
			fgDark,
		] = useCSSVariable([
			"--color-primary",
			"--color-success",
			"--color-rating-good",
			"--color-danger",
			"--color-warning",
			"--color-info",
			"--color-primary-pressed",
			"--color-fg-dark",
		]);

		const toColorValue = (
			value: string | number | undefined,
			fallback: string,
		): string => (typeof value === "string" ? value : fallback);

		const palette = useMemo(
			() => [
				toColorValue(primary, "#0a84ff"),
				toColorValue(success, "#2e7d32"),
				toColorValue(ratingGood, "#f4c542"),
				toColorValue(danger, "#d32f2f"),
				toColorValue(warning, "#ef6c00"),
				toColorValue(info, "#1565c0"),
				toColorValue(primaryPressed, "#0070d6"),
				toColorValue(fgDark, isDark ? "#eceef0" : "#11181c"),
			],
			[
				danger,
				fgDark,
				info,
				isDark,
				primary,
				primaryPressed,
				ratingGood,
				success,
				warning,
			],
		);

		const progress = useSharedValue(1);
		const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
		const [isVisible, setIsVisible] = useState(false);
		const [particles, setParticles] = useState<ParticleConfig[]>([]);

		const hideConfetti = useCallback(() => {
			setIsVisible(false);
		}, []);

		const burst = useCallback(() => {
			if (containerSize.width <= 0 || containerSize.height <= 0) {
				return;
			}

			setParticles(createParticles(particleCount, containerSize.width, palette));
			setIsVisible(true);
			cancelAnimation(progress);
			progress.value = 0;
			progress.value = withTiming(
				1,
				{
					duration: durationMs,
					easing: Easing.linear,
				},
				(finished) => {
					if (finished) {
						runOnJS(hideConfetti)();
					}
				},
			);
		}, [
			containerSize.height,
			containerSize.width,
			durationMs,
			hideConfetti,
			palette,
			particleCount,
			progress,
		]);

		const onLayout = useCallback((event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			setContainerSize((previous) =>
				previous.width === width && previous.height === height
					? previous
					: { width, height },
			);
		}, []);

		useImperativeHandle(ref, () => ({ burst }), [burst]);

		return (
			<View
				onLayout={onLayout}
				pointerEvents="none"
				className="absolute inset-0 overflow-hidden"
			>
				{isVisible
					? particles.map((particle) => (
							<Particle
								key={particle.id}
								config={particle}
								containerHeight={containerSize.height}
								durationMs={durationMs}
								progress={progress}
							/>
						))
					: null}
			</View>
		);
	},
);

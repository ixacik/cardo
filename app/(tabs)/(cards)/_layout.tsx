import { useTheme } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, Stack } from "expo-router";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProfileStats } from "@/hooks/useProfileStats";

export default function CardsTabStackLayout() {
	const { colors } = useTheme();
	const { streakDays } = useProfileStats();

	const onCreateCard = () => {
		router.push("/card/create" as never);
	};

	const onOpenProfile = () => {
		router.push("/(tabs)/(settings)");
	};

	return (
		<Stack
			screenOptions={{
				headerLargeTitle: true,
				contentStyle: {
					backgroundColor: colors.background,
				},
				headerStyle: {
					backgroundColor: colors.background,
				},
				headerLargeStyle: {
					backgroundColor: colors.background,
				},
				headerShadowVisible: false,
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					title: "My Cards",
					headerLeft: () => (
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Open profile streak details"
							accessibilityHint="Opens your profile tab"
							onPress={onOpenProfile}
							className="rounded-full px-2.5 py-1 flex-row items-center gap-0.5"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
								<MaterialIcons
									name="local-fire-department"
									size={20}
									color="#FF8904"
								/>
							<ThemedText className="text-sm font-semibold">{streakDays}d</ThemedText>
						</Pressable>
					),
					headerRight: () => (
						<View className="flex-row items-center">
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Create new card"
								accessibilityHint="Opens the new card modal"
								onPress={onCreateCard}
								className="size-9 items-center justify-center"
								style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							>
								<IconSymbol name="plus" size={20} color={colors.text} />
							</Pressable>
						</View>
					),
				}}
			/>
			<Stack.Screen
				name="deck/[deckName]"
				options={{
					title: "Deck",
					headerLargeTitle: false,
				}}
			/>
		</Stack>
	);
}

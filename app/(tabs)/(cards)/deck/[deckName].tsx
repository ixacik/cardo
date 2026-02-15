import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CardGridItem } from "@/components/cards/card-grid-item";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui";
import { useCards } from "@/hooks/useCards";
import type { Card as CardRecord } from "@/types/card";

const chunkIntoRows = <T,>(items: T[], rowSize: number): T[][] => {
	const rows: T[][] = [];
	for (let index = 0; index < items.length; index += rowSize) {
		rows.push(items.slice(index, index + rowSize));
	}
	return rows;
};

const parseDeckName = (value: string | string[] | undefined): string => {
	if (typeof value !== "string") {
		return "";
	}

	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
};

export default function DeckCardsScreen() {
	const insets = useSafeAreaInsets();
	const { cards } = useCards();
	const { deckName } = useLocalSearchParams<{ deckName?: string }>();

	const resolvedDeckName = useMemo(() => parseDeckName(deckName), [deckName]);

	const deckCards = useMemo<CardRecord[]>(() => {
		const targetDeckName = resolvedDeckName.trim();
		if (!targetDeckName) {
			return [];
		}

		return cards.filter((card) => (card.deckName?.trim() ?? "") === targetDeckName);
	}, [cards, resolvedDeckName]);

	const dueNowCount = useMemo(() => {
		const now = Date.now();
		return deckCards.filter((card) => card.dueAt <= now).length;
	}, [deckCards]);

	const cardRows = useMemo(() => chunkIntoRows(deckCards, 2), [deckCards]);

	const onOpenCard = (cardId: string) => {
		router.push(`/card/${cardId}`);
	};

	return (
		<>
			<Stack.Screen
				options={{
					title: resolvedDeckName || "Deck",
					headerLargeTitle: false,
				}}
			/>

			<ScrollView
				className="flex-1 bg-app-light dark:bg-app-dark"
				contentInsetAdjustmentBehavior="automatic"
				contentContainerClassName="gap-3 px-4 pt-3"
				contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
				showsVerticalScrollIndicator={false}
			>
				<Card>
					<ThemedText type="defaultSemiBold" className="opacity-70">
						{resolvedDeckName || "Deck"}
					</ThemedText>
					<View className="mt-1.5 flex-row flex-wrap gap-x-3 gap-y-1">
						<ThemedText className="font-semibold">{deckCards.length} cards</ThemedText>
						<ThemedText className="font-semibold opacity-80">{dueNowCount} due now</ThemedText>
					</View>
				</Card>

				{cardRows.length > 0 ? (
					<View className="gap-2.5">
						{cardRows.map((row, rowIndex) => (
							<View key={`deck-card-row-${rowIndex}`} className="flex-row gap-2.5">
								{row.map((card) => (
									<CardGridItem key={card.id} card={card} onPress={onOpenCard} />
								))}
								{row.length === 1 ? <View className="flex-1" /> : null}
							</View>
						))}
					</View>
				) : (
					<Card>
						<ThemedText className="text-muted-light dark:text-muted-dark">
							No cards are currently assigned to this deck.
						</ThemedText>
					</Card>
				)}
			</ScrollView>
		</>
	);
}

import { Stack } from "expo-router";

export default function ExploreTabStackLayout() {
	return (
		<Stack screenOptions={{ headerLargeTitleEnabled: true }}>
			<Stack.Screen name="index" options={{ title: "Explore" }} />
			<Stack.Screen name="search" options={{ title: "Search" }} />
			<Stack.Screen name="[deckId]" options={{ title: "Deck" }} />
		</Stack>
	);
}

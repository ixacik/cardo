import { Stack } from "expo-router";

export default function SettingsTabStackLayout() {
	return (
		<Stack screenOptions={{ headerLargeTitleEnabled: true }}>
			<Stack.Screen name="settings" options={{ title: "Settings" }} />
		</Stack>
	);
}

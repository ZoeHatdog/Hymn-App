import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LandingScreen } from "../screens/LandingScreen";
import { HymnDetailScreen } from "../screens/HymnDetailScreen";
import { MainTabs } from "./MainTabs";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="HymnDetail"
        component={HymnDetailScreen}
        options={{ presentation: "card" }}
      />
    </Stack.Navigator>
  );
}

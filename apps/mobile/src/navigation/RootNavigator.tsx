import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LandingScreen } from "../screens/LandingScreen";
import { HymnViewPickerScreen } from "../screens/HymnViewPickerScreen";
import { HymnTextDetailScreen } from "../screens/HymnTextDetailScreen";
import { HymnImageDetailScreen } from "../screens/HymnImageDetailScreen";
import { MainTabs } from "./MainTabs";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="HymnViewPicker"
        component={HymnViewPickerScreen}
        options={{ presentation: "card" }}
      />
      <Stack.Screen
        name="HymnTextDetail"
        component={HymnTextDetailScreen}
        options={{ presentation: "card" }}
      />
      <Stack.Screen
        name="HymnImageDetail"
        component={HymnImageDetailScreen}
        options={{ presentation: "card" }}
      />
    </Stack.Navigator>
  );
}
